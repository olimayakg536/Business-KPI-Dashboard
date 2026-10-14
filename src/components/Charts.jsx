import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
} from 'recharts';
import ChartCard from './ChartCard.jsx';
import {
  TENURE_GROUPS, churnRateByCategory, chargesByStatus, countChurned, countRetained,
} from '../utils/calculations.js';
import { formatCurrency, formatPercent } from '../utils/format.js';

const COLORS = { churned: '#dc2626', retained: '#2563eb', bar: '#2563eb', grid: '#e2e8f0', text: '#334155' };
const tick = { fontSize: 12, fill: COLORS.text };
const legendText = (value) => <span style={{ color: COLORS.text }}>{value}</span>;

// Bar chart used for all three "churn rate by category" charts.
function RateChart({ title, subtitle, data, xLabel, columnName, hasColumn, tickFormatter }) {
  return (
    <ChartCard title={title} subtitle={subtitle} available={hasColumn}
      unavailableMessage={`This chart needs a ${columnName} column, which was not found in the dataset.`}
      empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" tick={tick} interval={0} tickFormatter={tickFormatter}
            label={{ value: xLabel, position: 'insideBottom', offset: -18, fill: COLORS.text, fontSize: 12 }} />
          <YAxis domain={[0, 110]} ticks={[0, 25, 50, 75, 100]} tick={tick} tickFormatter={(v) => `${v}%`}
            label={{ value: 'Churn rate (%)', angle: -90, position: 'insideLeft', offset: 8, fill: COLORS.text, fontSize: 12, style: { textAnchor: 'middle' } }} />
          <Tooltip cursor={{ fill: '#eff6ff' }}
            formatter={(value, _name, item) => [`${formatPercent(value)} (${item.payload.churned} of ${item.payload.total} churned)`, 'Churn rate']} />
          <Legend verticalAlign="top" align="right" height={30} formatter={legendText} />
          <Bar dataKey="churnRate" isAnimationActive={false} name="Churn rate (%)" fill={COLORS.bar} radius={[4, 4, 0, 0]} maxBarSize={72}>
            <LabelList dataKey="churnRate" position="top" formatter={(v) => formatPercent(v, 0)} style={{ fontSize: 12, fill: COLORS.text }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function Charts({ customers, columns }) {
  const churned = countChurned(customers);
  const pieData = [
    { name: 'Churned', value: churned, color: COLORS.churned },
    { name: 'Retained', value: countRetained(customers), color: COLORS.retained },
  ];
  const revenue = chargesByStatus(customers).filter((r) => r.average != null);

  return (
    <section id="charts" aria-labelledby="charts-title">
      <h2 id="charts-title" className="section-title">Charts</h2>
      <div className="charts-grid">
        <ChartCard title="Churn Distribution" subtitle="Churned vs retained customers" empty={customers.length === 0}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2} isAnimationActive={false}
                label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} customers (${formatPercent((v / customers.length) * 100)})`, n]} />
              <Legend verticalAlign="bottom" formatter={legendText} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <RateChart title="Churn by Contract Type" subtitle="Share of customers who churned in each contract type"
          data={churnRateByCategory(customers, 'contract')} xLabel="Contract type" columnName="contract type" hasColumn={!!columns.contract} />

        <RateChart title="Churn by Payment Method" subtitle="Share of customers who churned for each payment method"
          data={churnRateByCategory(customers, 'payment')} xLabel="Payment method" columnName="payment method" hasColumn={!!columns.payment} />

        <RateChart title="Churn by Tenure Group" subtitle="Tenure is measured in months"
          data={churnRateByCategory(customers, 'tenureGroup', TENURE_GROUPS)} xLabel="Tenure group" columnName="tenure" hasColumn={!!columns.tenure}
          tickFormatter={(name) => (name === 'More than 24 months' ? '24+ months' : name)} />

        <ChartCard title="Revenue Analysis" subtitle="Average monthly charge per customer, retained vs churned"
          available={!!columns.charges} unavailableMessage="This chart needs a monthly charges column, which was not found in the dataset."
          empty={revenue.length === 0}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue} margin={{ top: 20, right: 16, left: 4, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="status" tick={tick} label={{ value: 'Customer status', position: 'insideBottom', offset: -18, fill: COLORS.text, fontSize: 12 }} />
              <YAxis tick={tick} tickFormatter={(v) => `$${v}`}
                label={{ value: 'Avg monthly charge ($)', angle: -90, position: 'insideLeft', offset: 8, fill: COLORS.text, fontSize: 12, style: { textAnchor: 'middle' } }} />
              <Tooltip cursor={{ fill: '#eff6ff' }}
                formatter={(v, _n, item) => [`${formatCurrency(v)} average · ${formatCurrency(item.payload.total)} total across ${item.payload.customers} customers`, 'Monthly charge']} />
              <Bar dataKey="average" isAnimationActive={false} name="Average monthly charge ($)" radius={[4, 4, 0, 0]} maxBarSize={96}>
                {revenue.map((r) => <Cell key={r.status} fill={r.status === 'Churned' ? COLORS.churned : COLORS.retained} />)}
                <LabelList dataKey="average" position="top" formatter={formatCurrency} style={{ fontSize: 12, fill: COLORS.text }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
