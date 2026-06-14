import "./Journey.css";
import useScrollReveal from "../hooks/useScrollReveal";

import skinnyImage from "../assets/journey-skinny.png";
import muscularImage from "../assets/journey-muscular.jpg";

function Journey() {
  const { elementRef, isVisible } = useScrollReveal();

  return (
    <section
      id="journey"
      ref={elementRef}
      className={`journey-section ${isVisible ? "is-visible" : ""}`}
    >
      <div className="container">
        <div className="section-label">My journey</div>

        <h2 className="section-title">
          My Body <em>Transformation</em>
        </h2>

        <p className="section-sub">
          My transformation was built through years of consistent training,
          experimentation, and learning what actually works.
        </p>

        <div className="journey-comparison">
          <div className="journey-photo-card">
            <img
              src={skinnyImage}
              alt="Ethan before starting his fitness journey"
              className="journey-photo"
            />

            <div className="journey-photo-label">
              <span>Before</span>
              <strong>2020</strong>
            </div>
          </div>

          <div className="journey-photo-card">
            <img
              src={muscularImage}
              alt="Ethan after years of consistent training"
              className="journey-photo"
            />

            <div className="journey-photo-label">
              <span>After</span>
              <strong>Now</strong>
            </div>
          </div>
        </div>

        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-year">2020–2021</div>

            <div className="timeline-title">
              Started skinny and trained at home
            </div>

            <div className="timeline-desc">
              I started my fitness journey with a skinny physique, training at
              home using weights and calisthenics. This was where I built my
              foundation, developed discipline, and learned the basics of
              resistance training.
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-year">2022–2024</div>

            <div className="timeline-title">
              Focused on body recomposition
            </div>

            <div className="timeline-desc">
              I focused on maingaining and body recomposition, gradually losing
              body fat while gaining muscle. I improved my training, nutrition,
              exercise selection, and understanding of progressive overload.
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-year">2024–2025</div>

            <div className="timeline-title">
              Completed my first bulk and cut cycle
            </div>

            <div className="timeline-desc">
              I completed my first structured bulking and cutting cycle, using
              calorie tracking and science-based training principles to build
              more muscle while managing body fat.
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-year">2025–Present</div>

            <div className="timeline-title">
              Applied what I learned to coaching
            </div>

            <div className="timeline-desc">
              After years of learning through experience, I began applying
              modern, science-based training methods to help others improve
              their physique, maximize hypertrophy, and avoid the mistakes I
              made when I first started.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Journey;