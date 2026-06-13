import { useState } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import "./Navbar.css";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <nav className="navbar">
      {/* Logo routes back to the Hero section */}
      <a
        href="#home"
        className="nav-logo"
        onClick={closeMenu}
        aria-label="Go to home section"
      >
        COACH<span>E</span>
      </a>

      {/* Desktop and mobile navigation links */}
      <ul className={`nav-links ${isMenuOpen ? "nav-links-open" : ""}`}>
        <li>
          <a href="#about" onClick={closeMenu}>
            About
          </a>
        </li>

        <li>
          <a href="#journey" onClick={closeMenu}>
            Journey
          </a>
        </li>

        <li>
          <a href="#clients" onClick={closeMenu}>
            Clients
          </a>
        </li>

        <li>
          <a href="#chat" onClick={closeMenu}>
            Coach E
          </a>
        </li>

        <li>
          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>
        </li>
      </ul>

      {/* Mobile menu button */}
      <button
        type="button"
        className="nav-menu-button"
        onClick={() => setIsMenuOpen((current) => !current)}
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? <FaXmark /> : <FaBars />}
      </button>
    </nav>
  );
}

export default Navbar;