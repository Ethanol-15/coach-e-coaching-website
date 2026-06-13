import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import APIError, Groq, RateLimitError
from pydantic import BaseModel, Field

from prompts import SYSTEM_PROMPT


# Load values from backend/.env during local development.
load_dotenv()

app = FastAPI(
    title="Coach E API",
    version="1.0.0",
)

# React and FastAPI use different origins during local development,
# so FastAPI needs CORS middleware.
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Read the secret only on the backend.
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise RuntimeError(
        "GROQ_API_KEY is missing. Add it to backend/.env."
    )

client = Groq(api_key=groq_api_key)

# Keep the model configurable so you can change it without editing code.
MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "500"))


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=5000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=30)


class ChatResponse(BaseModel):
    reply: str


@app.get("/")
def root():
    return {
        "message": "Coach E backend is running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Receive conversation history from React, add the Coach E
    system prompt, send it to Groq, and return the AI response.
    """

    # Keep only recent messages to control token usage.
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
        response = client.chat.completions.create(
            model=MODEL,
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

        return ChatResponse(reply=reply)

    except RateLimitError as error:
        raise HTTPException(
            status_code=429,
            detail="Coach E is receiving too many requests. Try again shortly.",
        ) from error

    except APIError as error:
        raise HTTPException(
            status_code=502,
            detail="Coach E could not reach the AI service.",
        ) from error

    except HTTPException:
        raise

    except Exception as error:
        print(f"Unexpected chat error: {error}")

        raise HTTPException(
            status_code=500,
            detail="An unexpected chatbot error occurred.",
        ) from error