import "./ClientCard.css";

function ClientCard({ client }) {
  const hasTransformationImages =
    client.beforeImage && client.afterImage;

  return (
    <article className="client-card">
      <div className="client-header">
        <div className="client-anonymous-icon">
          <span>
            {client.id.toString().padStart(2, "0")}
          </span>
        </div>

        <div>
          <div className="client-name">
            {client.label}
          </div>

          <div className="client-goal">
            {client.goal}
          </div>
        </div>
      </div>

      {hasTransformationImages ? (
        <div className="client-transformation">
          <div className="client-photo">
            <img
              src={client.beforeImage}
              alt={`${client.label} before transformation`}
            />

            <span className="client-photo-label">
              Before
            </span>
          </div>

          <div className="client-photo">
            <img
              src={client.afterImage}
              alt={`${client.label} after transformation`}
            />

            <span className="client-photo-label">
              After
            </span>
          </div>
        </div>
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
        <i
          className={client.icon}
          aria-hidden="true"
        ></i>

        {client.result}
      </div>
    </article>
  );
}

export default ClientCard;