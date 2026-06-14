import {
  FaArrowTrendUp,
  FaArrowsRotate,
  FaChartPie,
  FaDumbbell,
  FaRobot,
  FaScaleBalanced,
} from "react-icons/fa6";

import aboutImage from "../assets/IMG_0909.png";
import useScrollReveal from "../hooks/useScrollReveal";
import "./About.css";

function About() {
  const { elementRef, isVisible } = useScrollReveal();

  return (
    <section
      id="about"
      ref={elementRef}
      className={isVisible ? "is-visible" : ""}
    >
      <div className="container">
        <div className="section-label">About me</div>

        <h2 className="section-title">
          More than a <em>coach</em>
        </h2>

        <div className="about-grid">
          <div className="about-image-wrapper">
            <img
              src={aboutImage}
              alt="Ethan Cruz fitness coach"
              className="about-image"
            />
          </div>

          <div className="about-text">
            <p>
              I take fitness seriously, tracking everything from calories and
              macros to strength using custom-built tools and programs. I
              coach with the same data-first mindset.
            </p>

            <p>
              I apply science-based training principles to help clients
              maximize hypertrophy and build muscle effectively. No broscience
              just proven methods, progressive overload, and smart programming.
            </p>

            <div className="skills-grid">
              <div className="skill-item">
                <FaArrowsRotate
                  className="skill-icon"
                  aria-hidden="true"
                />
                Cutting &amp; Bulking Cycles
              </div>

              <div className="skill-item">
                <FaChartPie
                  className="skill-icon"
                  aria-hidden="true"
                />
                Macro Tracking
              </div>

              <div className="skill-item">
                <FaDumbbell
                  className="skill-icon"
                  aria-hidden="true"
                />
                Strength Programming
              </div>

              <div className="skill-item">
                <FaRobot
                  className="skill-icon"
                  aria-hidden="true"
                />
                AI-Powered Coaching
              </div>

              <div className="skill-item">
                <FaScaleBalanced
                  className="skill-icon"
                  aria-hidden="true"
                />
                Body Recomposition
              </div>

              <div className="skill-item">
                <FaArrowTrendUp
                  className="skill-icon"
                  aria-hidden="true"
                />
                Progressive Overload
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;