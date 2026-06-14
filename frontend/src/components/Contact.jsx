import {
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa6";

import useScrollReveal from "../hooks/useScrollReveal";
import "./Contact.css";

function Contact() {
  const { elementRef, isVisible } = useScrollReveal();

  return (
    <section
      id="contact"
      ref={elementRef}
      className={`contact-section ${isVisible ? "is-visible" : ""}`}
    >
      <div className="container">
        <div className="section-label">Get in touch</div>

        <h2 className="section-title">
          Ready to <em>start?</em>
        </h2>

        <p className="section-sub">
          Interested in coaching or want to talk about fitness? Reach out
          through any of these channels.
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

            <div className="contact-link-text">
              <span>Instagram</span>
              <small>@ethanlcruz</small>
            </div>
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

            <div className="contact-link-text">
              <span>Facebook</span>
              <small>Ethan Lyle Cruz</small>
            </div>
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

            <div className="contact-link-text">
              <span>TikTok</span>
              <small>@ethanlcruz</small>
            </div>
          </a>

          <a
            href="mailto:cruz.ethanlyle2003@gmail.com"
            className="contact-link"
          >
            <FaEnvelope
              className="contact-icon"
              aria-hidden="true"
            />

            <div className="contact-link-text">
              <span>Email</span>
              <small>cruz.ethanlyle2003@gmail.com</small>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;