import { RotateCcw } from 'lucide-react';
import { ALL } from '../utils/calculations.js';

function Select({ id, label, value, options, disabled, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value={ALL}>{disabled ? 'Column not available' : 'All'}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export default function Filters({ filters, options, columns, onChange, onReset, shown, total }) {
  const active = Object.values(filters).some((v) => v !== ALL);
  return (
    <section id="filters" className="card" aria-labelledby="filters-title">
      <div className="section-head">
        <h2 id="filters-title">Filters</h2>
        <p className="muted small" aria-live="polite">Showing {shown} of {total} customers</p>
      </div>
      <div className="filters-grid">
        <Select id="f-contract" label="Contract type" value={filters.contract} options={options.contract}
          disabled={!columns.contract} onChange={(v) => onChange('contract', v)} />
        <Select id="f-tenure" label="Tenure group" value={filters.tenureGroup} options={options.tenureGroup}
          disabled={!columns.tenure} onChange={(v) => onChange('tenureGroup', v)} />
        <Select id="f-payment" label="Payment method" value={filters.payment} options={options.payment}
          disabled={!columns.payment} onChange={(v) => onChange('payment', v)} />
        <button type="button" className="btn" onClick={onReset} disabled={!active}>
          <RotateCcw size={16} aria-hidden="true" /> Reset filters
        </button>
      </div>
    </section>
  );
}
