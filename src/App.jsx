import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import DatasetPanel from './components/DatasetPanel.jsx';
import Filters from './components/Filters.jsx';
import KpiCards from './components/KpiCards.jsx';
import Charts from './components/Charts.jsx';
import Insights from './components/Insights.jsx';
import CustomerTable from './components/CustomerTable.jsx';
import { parseCsvText, readCsvFile } from './utils/csv.js';
import { buildDataset } from './utils/dataset.js';
import { ALL, TENURE_GROUPS, buildInsights, filterCustomers, uniqueValues } from './utils/calculations.js';
import { formatCurrency, formatPercent } from './utils/format.js';

const DEFAULT_FILTERS = { contract: ALL, tenureGroup: ALL, payment: ALL };

const SAMPLE_INFO = {
  name: 'Edvyro customer churn sample (sample-customers.csv)',
  description:
    'Real sample data from the Edvyro customer churn dataset (edvyro.in/datasets/customer_churn_sample.csv), 15 customer records. It is not synthetic. The sample is very small, so results are illustrative.',
};

export default function App() {
  const [dataset, setDataset] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');

  // Load the bundled sample dataset on first render.
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}sample-customers.csv`)
      .then((r) => {
        if (!r.ok) throw new Error('Could not load the sample dataset.');
        return r.text();
      })
      .then((text) => {
        const { rows, headers } = parseCsvText(text);
        const built = buildDataset(rows, headers);
        if (!built.ok) throw new Error(built.error);
        setDataset({ ...built, ...SAMPLE_INFO });
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  // Handle a user-uploaded CSV. On any error the current dataset stays in place.
  const handleUpload = async (file) => {
    try {
      const { rows, headers } = await readCsvFile(file);
      const built = buildDataset(rows, headers);
      if (!built.ok) throw new Error(built.error);
      setDataset({
        ...built,
        name: file.name,
        description: 'Uploaded by you and processed locally in this browser.',
      });
      setFilters(DEFAULT_FILTERS);
      setSearch('');
      setMessage({ type: 'success', text: `Loaded ${built.customers.length} customers from ${file.name}.` });
    } catch (err) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` });
    }
  };

  const customers = dataset?.customers ?? [];

  // One filtered list feeds the KPIs, charts, insights and table, so they always agree.
  const filtered = useMemo(() => filterCustomers(customers, filters), [customers, filters]);
  const tableRows = useMemo(() => filterCustomers(customers, filters, search), [customers, filters, search]);
  const options = useMemo(
    () => ({
      contract: uniqueValues(customers, 'contract'),
      tenureGroup: uniqueValues(customers, 'tenureGroup', TENURE_GROUPS),
      payment: uniqueValues(customers, 'payment'),
    }),
    [customers]
  );
  const insights = useMemo(
    () => (dataset ? buildInsights(filtered, dataset.columns, { percent: formatPercent, currency: formatCurrency }) : []),
    [filtered, dataset]
  );

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <header className="page-header">
          <h1>Business KPI Dashboard</h1>
          <p>Understand customer churn, retention, revenue at risk and customer behavior. Use the filters to explore segments.</p>
        </header>

        <main>
          {loadError && <p className="notice error" role="alert">{loadError}</p>}
          {!dataset && !loadError && <p className="muted">Loading sample dataset…</p>}

          {dataset && (
            <>
              <DatasetPanel dataset={dataset} message={message} onUpload={handleUpload} />
              <Filters
                filters={filters}
                options={options}
                columns={dataset.columns}
                onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
                onReset={() => setFilters(DEFAULT_FILTERS)}
                shown={filtered.length}
                total={customers.length}
              />
              <KpiCards customers={filtered} columns={dataset.columns} />
              <Charts customers={filtered} columns={dataset.columns} />
              <Insights insights={insights} total={filtered.length} />
              <CustomerTable
                customers={tableRows}
                columns={dataset.columns}
                search={search}
                onSearch={setSearch}
                filteredCount={filtered.length}
              />
            </>
          )}
        </main>

        <footer className="footer">Business KPI Dashboard · Customer churn analytics internship project</footer>
      </div>
    </div>
  );
}
