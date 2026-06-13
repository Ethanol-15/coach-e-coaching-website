import { useState } from "react";
import {
  FaEnvelope,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa6";

import "./Contact.css";
import useScrollReveal from "../hooks/useScrollReveal";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://your-backend-url.com";

function Contact() {
  const [isSending, setIsSending] = useState(false);

  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });

  function showToast(message, type = "success") {
    setToast({
      message,
      type,
      visible: true,
    });

    setTimeout(() => {
      setToast((currentToast) => ({
        ...currentToast,
        visible: false,
      }));
    }, 3000);
  }

  async function handleContactForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim();
    const message = formData.get("message")?.trim();

    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      showToast(
        "Message sent! I'll get back to you soon 💪",
        "success"
      );

      form.reset();
    } catch (error) {
      console.error("Contact form error:", error);

      showToast(
        "Failed to send message. Please try again.",
        "error"
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <section id="contact">
        <div className="container">
          <div className="section-label">Get in touch</div>

          <h2 className="section-title">
            Ready to <em>start?</em>
          </h2>

          <div className="contact-grid">
            <div>
              <p className="section-sub">
                Interested in working together or just want to chat fitness?
                Reach out through any of these channels.
              </p>

              <div className="contact-links">
                <a
                  href="https://www.instagram.com/ethanlcruz/"
                  className="contact-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaInstagram
                    className="contact-icon"
                    aria-hidden="true"
                  />

                  <span>@ethanlcruz</span>
                </a>

                <a
                  href="https://www.facebook.com/ethanlyle.cruz.1215"
                  className="contact-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaFacebook
                    className="contact-icon"
                    aria-hidden="true"
                  />

                  <span>Ethan Lyle Cruz</span>
                </a>

                <a
                  href="https://www.tiktok.com/@ethanlcruz"
                  className="contact-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaTiktok
                    className="contact-icon"
                    aria-hidden="true"
                  />

                  <span>@ethanlcruz</span>
                </a>

                <a
                  href="mailto:cruz.ethanlyle2003@gmail.com"
                  className="contact-link"
                >
                  <FaEnvelope
                    className="contact-icon"
                    aria-hidden="true"
                  />

                  <span>cruz.ethanlyle2003@gmail.com</span>
                </a>
              </div>
            </div>

            <div>
              <form
                className="contact-form"
                onSubmit={handleContactForm}
              >
                <input
                  type="text"
                  name="name"
                  id="contactName"
                  placeholder="Your name"
                  required
                />

                <input
                  type="email"
                  name="email"
                  id="contactEmail"
                  placeholder="Your email"
                  required
                />

                <textarea
                  name="message"
                  id="contactMessage"
                  placeholder="Tell me about your goals..."
                  required
                />

                <button
                  type="submit"
                  id="contactBtn"
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`toast ${toast.type} ${
          toast.visible ? "show" : ""
        }`}
      >
        {toast.message}
      </div>
    </>
  );
}

export default Contact;