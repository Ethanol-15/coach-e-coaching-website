import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import APIError, Groq, RateLimitError
from pydantic import BaseModel, Field

from prompts import SYSTEM_PROMPT


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
# ------------------------------------------------------------

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.1-8b-instant",
)

try:
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "500"))
except ValueError:
    MAX_TOKENS = 500

# Do not crash the whole FastAPI app during startup if the key
# is missing. The /chat route will return a clear error instead.
groq_client = (
    Groq(api_key=GROQ_API_KEY)
    if GROQ_API_KEY
    else None
)


# ------------------------------------------------------------
# REQUEST AND RESPONSE MODELS
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