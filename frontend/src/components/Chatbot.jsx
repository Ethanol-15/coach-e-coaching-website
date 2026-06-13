import { useEffect, useRef, useState } from "react";
import { FaBolt, FaPaperPlane } from "react-icons/fa6";

import useScrollReveal from "../hooks/useScrollReveal";
import "./Chatbot.css";

/*
  Local development:
  React runs on localhost:5173
  FastAPI runs on localhost:8000

  Production:
  FastAPI is routed through /__backend on Vercel.
*/
const API_BASE = import.meta.env.DEV
  ? "http://localhost:8000"
  : "/__backend";

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Chatbot() {
  const { elementRef, isVisible } = useScrollReveal();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to Coach E. Ask me anything about training, nutrition, cutting, bulking, recovery, or structuring your fitness journey.",
      time: "Just now",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const chatMessagesRef = useRef(null);

  // Automatically scroll to the newest message.
  useEffect(() => {
    const container = chatMessagesRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isTyping]);

  async function sendMessage(customPrompt) {
    const text =
      typeof customPrompt === "string"
        ? customPrompt.trim()
        : chatInput.trim();

    if (!text || isSending) {
      return;
    }

    const userMessage = {
      role: "user",
      content: text,
      time: getTime(),
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setChatInput("");
    setIsSending(true);
    setIsTyping(true);

    try {
      /*
        Remove display-only information such as message time
        before sending the conversation to FastAPI.
      */
      const conversationHistory = updatedMessages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      /*
        Send the conversation to:
        Local: http://localhost:8000/chat
        Production: /__backend/chat
      */
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const reply =
        data.reply ||
        "Sorry, I had trouble responding. Please try again.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: reply,
          time: getTime(),
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content:
            "I couldn't connect to Coach E right now. Please try again in a moment.",
          time: getTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function handleInputChange(event) {
    setChatInput(event.target.value);

    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(
      event.target.scrollHeight,
      100
    )}px`;
  }

  return (
    <section
      id="chat"
      ref={elementRef}
      className={`coach-section ${isVisible ? "is-visible" : ""}`}
    >
      <div className="container">
        <div className="section-label">AI coaching</div>

        <h2 className="section-title">
          Meet <em>Coach E</em>
        </h2>

        <p className="section-sub">
          Get instant guidance on training, nutrition, programming, and
          recovery through an AI assistant built around science-based fitness.
        </p>

        <div className="chat-wrapper">
          <div className="chat-header">
            <div className="chat-logo" aria-hidden="true">
              <FaBolt />
            </div>

            <div className="chat-info">
              <div className="chat-name-row">
                <div className="chat-name">Coach E</div>
                <span className="chat-badge">AI</span>
              </div>

              <div className="chat-status">
                <span className="status-dot"></span>
                Ready to help
              </div>
            </div>
          </div>

          <div className="quick-prompts">
            <button
              type="button"
              className="quick-btn"
              onClick={() =>
                sendMessage("How do I start a cutting cycle?")
              }
              disabled={isSending}
            >
              Start a cutting cycle
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() =>
                sendMessage("What should I eat before training?")
              }
              disabled={isSending}
            >
              Pre-workout nutrition
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() =>
                sendMessage("How often should I train per week?")
              }
              disabled={isSending}
            >
              Training frequency
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() =>
                sendMessage("How do I calculate my TDEE?")
              }
              disabled={isSending}
            >
              Calculate my TDEE
            </button>
          </div>

          <div
            className="chat-messages"
            ref={chatMessagesRef}
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                className={`msg ${
                  message.role === "user" ? "user" : "bot"
                }`}
                key={`${message.role}-${index}`}
              >
                <div
                  className="msg-bubble"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {message.content}
                </div>

                <div className="msg-time">{message.time}</div>
              </div>
            ))}

            {isTyping && (
              <div className="msg bot">
                <div className="msg-bubble typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="Ask Coach E anything..."
              rows="1"
              value={chatInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={isSending || !chatInput.trim()}
              aria-label="Send message"
            >
              <FaPaperPlane aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Chatbot;