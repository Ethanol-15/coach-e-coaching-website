import "./App.css";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Journey from "./components/Journey";
import Clients from "./components/Clients";
import Chatbot from "./components/Chatbot";
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
      <Contact />
      <Footer />
    </>
  );
}

export default App;