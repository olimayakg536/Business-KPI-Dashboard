import { Lightbulb, Info } from 'lucide-react';

export default function Insights({ insights, total }) {
  return (
    <section id="insights" className="card" aria-labelledby="insights-title">
      <h2 id="insights-title"><Lightbulb size={18} aria-hidden="true" /> Business insights</h2>
      {insights.length === 0 ? (
        <p className="muted">
          {total === 0
            ? 'No customers match the current filters, so no insights can be calculated.'
            : 'The dataset does not contain enough columns (contract, payment, tenure or monthly charges) to calculate insights.'}
        </p>
      ) : (
        <ul className="insight-list">
          {insights.map((i) => (
            <li key={i.id}>
              <strong>{i.title}</strong>
              <span>{i.text}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="notice info">
        <Info size={16} aria-hidden="true" />
        <span>
          These findings describe patterns in the selected data. They show association, not cause: a higher churn rate in a group
          does not prove that the group's contract, payment method or tenure caused customers to leave.
          {total > 0 && total < 30 && ' The current selection is very small, so treat results as illustrative.'}
        </span>
      </p>
    </section>
  );
}
