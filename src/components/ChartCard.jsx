// Wrapper that gives every chart a title and a friendly fallback message.
export default function ChartCard({ title, subtitle, available = true, unavailableMessage, empty = false, children }) {
  let body = children;
  if (!available) body = <p className="chart-message">{unavailableMessage}</p>;
  else if (empty) body = <p className="chart-message">No data to display for the current filters.</p>;

  return (
    <section className="card chart-card">
      <h3>{title}</h3>
      {subtitle && <p className="muted small">{subtitle}</p>}
      <div className="chart-body">{body}</div>
    </section>
  );
}
