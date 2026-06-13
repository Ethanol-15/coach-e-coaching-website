import "./ClientCard.css";
import useScrollReveal from "../hooks/useScrollReveal";
function ClientCard({ client }) {
    return (
      <article className="client-card">
        <div className="client-header">
          <div className="client-anonymous-icon">
            <span>{client.id.toString().padStart(2, "0")}</span>
          </div>
  
          <div>
            <div className="client-name">{client.label}</div>
            <div className="client-goal">{client.goal}</div>
          </div>
        </div>
  
        {client.image ? (
          <img
            src={client.image}
            alt={`${client.label} before and after transformation`}
            className="client-transformation-image"
          />
        ) : (
          <div className="client-image-placeholder">
            <div className="placeholder-side placeholder-before">
              <span>Before</span>
            </div>
  
            <div className="placeholder-divider"></div>
  
            <div className="placeholder-side placeholder-after">
              <span>After</span>
            </div>
          </div>
        )}
  
        <div className="client-quote">
          “{client.quote}”
        </div>
  
        <div className="client-result">
          <i className={client.icon}></i>
          {client.result}
        </div>
      </article>
    );
  }
  
  export default ClientCard;