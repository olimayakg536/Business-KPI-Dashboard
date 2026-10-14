import { Users, TrendingDown, UserCheck, DollarSign } from 'lucide-react';
import { churnRate, retentionRate, revenueAtRisk } from '../utils/calculations.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

function Card({ icon: Icon, label, value, note, tone }) {
  return (
    <div className={`card kpi ${tone}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="kpi-value">{value}</div>
      <p className="kpi-note">{note}</p>
    </div>
  );
}

export default function KpiCards({ customers, columns }) {
  const empty = customers.length === 0;
  const emptyNote = 'No customers match the selected filters.';
  const churned = customers.filter((c) => c.churned).length;

  return (
    <section id="overview" aria-label="Key performance indicators">
      <div className="kpi-grid">
        <Card icon={Users} tone="blue" label="Total Customers" value={formatNumber(customers.length)}
          note={empty ? emptyNote : 'Customers in the current selection'} />
        <Card icon={TrendingDown} tone="red" label="Churn Rate" value={formatPercent(churnRate(customers))}
          note={empty ? emptyNote : `${churned} churned ÷ ${customers.length} customers`} />
        <Card icon={UserCheck} tone="green" label="Retention Rate" value={formatPercent(retentionRate(customers))}
          note={empty ? emptyNote : `${customers.length - churned} retained ÷ ${customers.length} customers`} />
        <Card icon={DollarSign} tone="amber" label="Revenue at Risk"
          value={columns.charges && !empty ? formatCurrency(revenueAtRisk(customers)) : '—'}
          note={!columns.charges ? 'Needs a monthly charges column, which was not found.' : empty ? emptyNote : 'Monthly charges of churned customers'} />
      </div>
      <p className="muted small kpi-explainer">
        <strong>Revenue at Risk</strong> is the sum of monthly charges for customers who have already churned,
        i.e. monthly recurring charges associated with churned customers. It is not a forecast of future revenue loss.
      </p>
    </section>
  );
}
