import "./Hero.css";
function Hero() {
    function scrollToSection(sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
      });
    }
  
    return (
        <section id="home" className="hero">
        <div className="hero-bg"></div>
  
        <div className="hero-content">
          <div className="hero-tag">Fitness Coach & CS Student</div>
  
          <h1 className="hero-electric-title">
          <span className="electric-line">Train Smarter.</span>

            <br/>
            <em className="electric-line electric-accent">
                Get Results.
            </em>
          </h1>
  
          <p>
            Evidence-based coaching powered by data, discipline, and AI. I help
            clients cut, bulk, and build strength with real plans that actually
            work.
          </p>
  
          <div className="hero-ctas">
            <button
              className="btn-primary"
              onClick={() => scrollToSection("chat")}
            >
              Ask Coach E
            </button>
  
            <button
              className="btn-outline"
              onClick={() => scrollToSection("clients")}
            >
              See Results
            </button>
          </div>
  
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">10+</div>
              <div className="hero-stat-label">Clients trained</div>
            </div>
  
            <div>
              <div className="hero-stat-num">2+</div>
              <div className="hero-stat-label">Years of experience</div>
            </div>
  
            <div>
              <div className="hero-stat-num">AI</div>
              <div className="hero-stat-label">Powered coaching</div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  export default Hero;