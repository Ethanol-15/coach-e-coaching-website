import "./Clients.css";

import clientsData from "../data/clientsData";
import ClientCard from "./ClientCard";

function Clients() {
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
      <div className="clients-marquee">
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