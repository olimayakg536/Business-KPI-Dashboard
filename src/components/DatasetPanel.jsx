import { useRef } from 'react';
import { Database, Download, Upload, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-react';
import { formatNumber } from '../utils/format.js';

const FIELD_LABELS = [
  ['id', 'Customer ID'],
  ['contract', 'Contract type'],
  ['tenure', 'Tenure'],
  ['payment', 'Payment method'],
  ['charges', 'Monthly charges'],
  ['churn', 'Churn status'],
];

export default function DatasetPanel({ dataset, message, onUpload }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  return (
    <section className="card dataset" aria-labelledby="dataset-title">
      <div className="dataset-head">
        <div>
          <h2 id="dataset-title"><Database size={18} aria-hidden="true" /> Dataset information</h2>
          <p className="muted">
            <strong>{dataset.name}</strong> · {formatNumber(dataset.customers.length)} customers analysed
          </p>
          <p className="muted small">{dataset.description}</p>
        </div>
        <div className="actions">
          <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleChange} hidden />
          <button type="button" className="btn primary" onClick={() => inputRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Upload CSV
          </button>
          <a className="btn" href={`${import.meta.env.BASE_URL}sample-customers.csv`} download="sample-customers.csv">
            <Download size={16} aria-hidden="true" /> Download sample
          </a>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {message && (
          <p className={`notice ${message.type}`}>
            {message.type === 'error' ? <AlertCircle size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
            <span>{message.text}</span>
          </p>
        )}
      </div>

      <details className="mapping">
        <summary>Detected columns</summary>
        <ul>
          {FIELD_LABELS.map(([key, label]) => (
            <li key={key}>
              <span>{label}</span>
              <code>{dataset.columns[key] ?? 'not found'}</code>
            </li>
          ))}
        </ul>
      </details>

      {dataset.warnings.length > 0 && (
        <ul className="warnings">
          {dataset.warnings.map((w) => (
            <li key={w}><TriangleAlert size={14} aria-hidden="true" /> {w}</li>
          ))}
        </ul>
      )}
      <p className="muted small">Files are processed in your browser and never uploaded to a server.</p>
    </section>
  );
}
