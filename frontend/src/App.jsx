import "./App.css";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Journey from "./components/Journey";
import Clients from "./components/Clients";
import Chatbot from "./components/Chatbot";
import BodyFatAnalyzer from "./components/BodyFatAnalyzer";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Journey />
      <Clients />
      <Chatbot />
      <BodyFatAnalyzer />
      <Contact />
      <Footer />
    </>
  );
}

export default App;
