import { useEffect, useRef, useState } from "react";
import "./Clients.css";

import clientsData from "../data/clientsData";
import ClientCard from "./ClientCard";

function Clients() {
  const marqueeRef = useRef(null);
  const resumeTimerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const isPausedRef = useRef(false);

  /* Continuously moves the conveyor from right to left */
  useEffect(() => {
    const marquee = marqueeRef.current;

    if (!marquee) return;

    let animationFrameId;

    const moveConveyor = () => {
      if (!isDragging && !isPausedRef.current) {
        /* Moves the conveyor from left to right */
        marquee.scrollLeft -= 0.7;

        /* Reset seamlessly after reaching the duplicate group */
        const halfwayPoint = marquee.scrollWidth / 2;

        if (marquee.scrollLeft <=0 ) {
          marquee.scrollLeft += halfwayPoint;
        }
      }

      animationFrameId = requestAnimationFrame(moveConveyor);
    };

    animationFrameId = requestAnimationFrame(moveConveyor);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isDragging]);

  /* Resumes automatic movement after manual interaction */
  const resumeAfterDelay = () => {
    clearTimeout(resumeTimerRef.current);

    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 800);
  };

  /* Starts desktop mouse dragging */
  const handlePointerDown = (event) => {
    const marquee = marqueeRef.current;

    if (!marquee) return;

    setIsDragging(true);
    isPausedRef.current = true;

    startXRef.current = event.clientX;
    startScrollLeftRef.current = marquee.scrollLeft;

    marquee.setPointerCapture(event.pointerId);
  };

  /* Moves the cards while dragging */
  const handlePointerMove = (event) => {
    const marquee = marqueeRef.current;

    if (!isDragging || !marquee) return;

    const distanceMoved = event.clientX - startXRef.current;

    marquee.scrollLeft =
      startScrollLeftRef.current - distanceMoved;
  };

  /* Ends dragging and resumes the conveyor */
  const handlePointerUp = (event) => {
    const marquee = marqueeRef.current;

    if (!marquee) return;

    setIsDragging(false);

    if (marquee.hasPointerCapture(event.pointerId)) {
      marquee.releasePointerCapture(event.pointerId);
    }

    resumeAfterDelay();
  };

  /* Pauses briefly when using a mouse wheel or trackpad */
  const handleWheel = () => {
    isPausedRef.current = true;
    resumeAfterDelay();
  };

  return (
    <section id="clients">
      {/* Section heading */}
      <div className="container">
        <div className="section-label">Client results</div>

        <h2 className="section-title">
          Real people. <em>Real gains.</em>
        </h2>

        <p className="section-sub">
          Every client gets a personalized plan. Here's what some of them have
          achieved.
        </p>
      </div>

      {/* Infinite client-card conveyor */}
      <div
        ref={marqueeRef}
        className={`clients-marquee ${
          isDragging ? "clients-marquee--dragging" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div className="clients-track">
          {/* First set of cards */}
          <div className="clients-group">
            {clientsData.map((client) => (
              <ClientCard
                key={`first-${client.id}`}
                client={client}
              />
            ))}
          </div>

          {/* Duplicate set creates the seamless loop */}
          <div
            className="clients-group"
            aria-hidden="true"
          >
            {clientsData.map((client) => (
              <ClientCard
                key={`second-${client.id}`}
                client={client}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Clients;