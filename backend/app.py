import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import APIError, Groq, RateLimitError
from pydantic import BaseModel, Field

from prompts import SYSTEM_PROMPT
from bodyfat_utils import navy_formula, get_bf_category, analyze_bodyfat_with_groq


# Load backend/.env regardless of the folder used to start Uvicorn.
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_PATH)

app = FastAPI(
    title="Coach E API",
    version="1.0.0",
)


# ------------------------------------------------------------
# CORS
# Allows the React frontend to call this FastAPI backend.
# ------------------------------------------------------------

frontend_url = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

allowed_origins = list(
    {
        frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# GROQ CONFIGURATION
# One shared Groq client used by both /chat and /analyze-bodyfat.
# GROQ_MODEL       → text chat (llama 3.1)
# GROQ_VISION_MODEL → body fat image analysis (llama 4 scout)
# ------------------------------------------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.1-8b-instant",
)

GROQ_VISION_MODEL = os.getenv(
    "GROQ_VISION_MODEL",
    "meta-llama/llama-4-scout-17b-16e-instruct",
)

try:
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "500"))
except ValueError:
    MAX_TOKENS = 500

# Client is None if key is missing — routes handle this gracefully.
groq_client = (
    Groq(api_key=GROQ_API_KEY)
    if GROQ_API_KEY
    else None
)


# ------------------------------------------------------------
# REQUEST AND RESPONSE MODELS — CHAT
# ------------------------------------------------------------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(
        min_length=1,
        max_length=5000,
    )


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(
        min_length=1,
        max_length=30,
    )


class ChatResponse(BaseModel):
    reply: str


# ------------------------------------------------------------
# REQUEST AND RESPONSE MODELS — BODY FAT ANALYZER
# Unit conversion (imperial → metric) happens on the frontend.
# The backend always receives centimeters.
# ------------------------------------------------------------

class BodyFatRequest(BaseModel):
    gender: Literal["Male", "Female"]

    # Base64-encoded image sent from the React frontend
    image_b64: str = Field(min_length=1)
    image_mime: Literal["image/jpeg", "image/png"]

    # Measurements are optional — user may skip Step 3
    # All values must already be in centimeters
    height_cm: float | None = None
    waist_cm: float | None = None
    neck_cm: float | None = None
    hip_cm: float | None = None  # required for Female navy formula only


class BodyFatResponse(BaseModel):
    navy_result: float | None   # None if measurements were skipped
    category: dict | None       # None if navy_result is None
    ai_result: str              # always present — Groq visual analysis


# ------------------------------------------------------------
# BASIC ROUTES
# ------------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Coach E backend is running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "groq_configured": bool(GROQ_API_KEY),
    }


# ------------------------------------------------------------
# CHATBOT ROUTE
# ------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Receive the React conversation, add the Coach E system
    prompt, send everything to Groq, and return the response.
    """

    if groq_client is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "GROQ_API_KEY is missing. "
                "Add it to backend/.env and restart the server."
            ),
        )

    # Keep the latest messages to limit token usage.
    recent_messages = request.messages[-10:]

    groq_messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        *[
            {
                "role": message.role,
                "content": message.content,
            }
            for message in recent_messages
        ],
    ]

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=groq_messages,
            temperature=0.3,
            max_tokens=MAX_TOKENS,
        )

        reply = response.choices[0].message.content

        if not reply:
            raise HTTPException(
                status_code=502,
                detail="Groq returned an empty response.",
            )

        return ChatResponse(reply=reply.strip())

    except RateLimitError as error:
        raise HTTPException(
            status_code=429,
            detail=(
                "Coach E is receiving too many requests. "
                "Please try again shortly."
            ),
        ) from error

    except APIError as error:
        print(f"Groq API error: {error}")

        raise HTTPException(
            status_code=502,
            detail="Coach E could not reach the AI service.",
        ) from error

    except HTTPException:
        raise

    except Exception as error:
        print(f"Unexpected chatbot error: {error}")

        raise HTTPException(
            status_code=500,
            detail="An unexpected chatbot error occurred.",
        ) from error


# ------------------------------------------------------------
# BODY FAT ANALYZER ROUTE
# Step 1: Run Navy formula if measurements are provided
# Step 2: Send image + context to Groq vision model
# Step 3: Return both results to the frontend
# ------------------------------------------------------------

@app.post("/analyze-bodyfat", response_model=BodyFatResponse)
def analyze_bodyfat(request: BodyFatRequest):
    """
    Accepts a base64 image + optional measurements.
    Returns a Navy formula estimate (if measurements given)
    and a Groq AI visual analysis.
    """

    if groq_client is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "GROQ_API_KEY is missing. "
                "Add it to backend/.env and restart the server."
            ),
        )

    # --- Step 1: Navy Formula (math-based estimate) ---
    # Only runs if the user provided all required measurements.
    # Minimum thresholds guard against default 0.0 values slipping through.
    navy_result = None
    category = None

    has_base_measurements = (
        request.height_cm and request.height_cm > 100
        and request.waist_cm and request.waist_cm > 40
        and request.neck_cm and request.neck_cm > 20
    )

    if has_base_measurements:
        try:
            navy_result = navy_formula(
                gender=request.gender,
                height_cm=request.height_cm,
                waist_cm=request.waist_cm,
                neck_cm=request.neck_cm,
                hip_cm=request.hip_cm,  # None for males — formula handles it
            )
            # Get ACE category label if formula returned a valid number
            if navy_result is not None:
                category = get_bf_category(navy_result, request.gender)

        except Exception as error:
            # Don't crash the whole request if measurements are bad —
            # Groq visual analysis can still run without the navy result.
            print(f"Navy formula error: {error}")
            navy_result = None
            category = None

    # --- Step 2: Groq Vision (AI visual estimate from photo) ---
    # Passes navy_result as an anchor so the model can cross-reference
    # its visual estimate against the math-based one.
    # Also passes GROQ_VISION_MODEL so the model name is configurable
    # via environment variable without touching the code.
    try:
        ai_result = analyze_bodyfat_with_groq(
            groq_client=groq_client,
            image_b64=request.image_b64,
            image_mime=request.image_mime,
            gender=request.gender,
            navy_estimate=navy_result,
            vision_model=GROQ_VISION_MODEL,   # from env var
        )

    except RateLimitError as error:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again shortly.",
        ) from error

    except APIError as error:
        print(f"Groq vision API error: {error}")
        raise HTTPException(
            status_code=502,
            detail="Coach E could not reach the AI vision service.",
        ) from error

    except Exception as error:
        print(f"Unexpected body fat analysis error: {error}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during body fat analysis.",
        ) from error

    # --- Step 3: Return both results ---
    return BodyFatResponse(
        navy_result=navy_result,
        category=category,
        ai_result=ai_result,
    )