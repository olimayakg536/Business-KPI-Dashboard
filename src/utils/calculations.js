// Pure calculation functions (no React). Every KPI, chart, insight and table row
// uses the SAME filtered customer list produced by filterCustomers().

export const TENURE_GROUPS = ['0–6 months', '7–12 months', '13–24 months', 'More than 24 months'];
export const ALL = 'All';

/** Assigns a tenure (in months) to a group. Returns null for invalid tenure. */
export function getTenureGroup(months) {
  if (months == null || !Number.isFinite(months) || months < 0) return null;
  if (months <= 6) return TENURE_GROUPS[0];
  if (months <= 12) return TENURE_GROUPS[1];
  if (months <= 24) return TENURE_GROUPS[2];
  return TENURE_GROUPS[3];
}

export const countChurned = (customers) => customers.filter((c) => c.churned).length;
export const countRetained = (customers) => customers.filter((c) => !c.churned).length;

/** Churn Rate (%) = churned customers / total customers x 100. Returns null if there are no customers. */
export function churnRate(customers) {
  if (customers.length === 0) return null;
  return (countChurned(customers) / customers.length) * 100;
}

/** Retention Rate (%) = retained customers / total customers x 100. Returns null if there are no customers. */
export function retentionRate(customers) {
  if (customers.length === 0) return null;
  return (countRetained(customers) / customers.length) * 100;
}

/**
 * Revenue at Risk = sum of MonthlyCharges of customers who have actually churned.
 * It is monthly recurring revenue already associated with churned customers,
 * NOT a forecast of future revenue loss.
 */
export function revenueAtRisk(customers) {
  return customers.reduce((sum, c) => (c.churned && c.charges != null ? sum + c.charges : sum), 0);
}

/**
 * Churn rate for each value of a field (e.g. 'contract').
 * Returns [{ name, total, churned, churnRate }]. Pass `order` for a fixed category order.
 */
export function churnRateByCategory(customers, field, order = null) {
  const groups = new Map();
  customers.forEach((c) => {
    const key = c[field];
    if (key == null) return;
    const g = groups.get(key) ?? { name: key, total: 0, churned: 0 };
    g.total += 1;
    if (c.churned) g.churned += 1;
    groups.set(key, g);
  });

  const rows = [...groups.values()].map((g) => ({ ...g, churnRate: (g.churned / g.total) * 100 }));
  if (order) {
    const pos = (n) => (order.includes(n) ? order.indexOf(n) : order.length);
    return rows.sort((a, b) => pos(a.name) - pos(b.name));
  }
  return rows.sort((a, b) => b.churnRate - a.churnRate || a.name.localeCompare(b.name));
}

/** Average monthly charge for retained vs churned customers (only rows with a valid charge). */
export function chargesByStatus(customers) {
  const build = (label, list) => {
    const withCharge = list.filter((c) => c.charges != null);
    const total = withCharge.reduce((s, c) => s + c.charges, 0);
    return {
      status: label,
      customers: withCharge.length,
      total,
      average: withCharge.length ? total / withCharge.length : null,
    };
  };
  return [build('Retained', customers.filter((c) => !c.churned)), build('Churned', customers.filter((c) => c.churned))];
}

/** Applies the three dropdown filters and (optionally) a customer ID search. */
export function filterCustomers(customers, filters, search = '') {
  const q = search.trim().toLowerCase();
  return customers.filter((c) => {
    if (filters.contract !== ALL && c.contract !== filters.contract) return false;
    if (filters.tenureGroup !== ALL && c.tenureGroup !== filters.tenureGroup) return false;
    if (filters.payment !== ALL && c.payment !== filters.payment) return false;
    if (q && !(c.id ?? '').toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Distinct values of a field, for building filter dropdowns. */
export function uniqueValues(customers, field, order = null) {
  const values = [...new Set(customers.map((c) => c[field]).filter((v) => v != null))];
  if (order) {
    const pos = (n) => (order.includes(n) ? order.indexOf(n) : order.length);
    return values.sort((a, b) => pos(a) - pos(b));
  }
  return values.sort((a, b) => a.localeCompare(b));
}

const highest = (rows) => {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.churnRate));
  return { rate: max, names: rows.filter((r) => r.churnRate === max).map((r) => r.name) };
};

/**
 * Builds plain-language findings from the filtered data.
 * An insight is only returned when the data needed for it exists.
 */
export function buildInsights(customers, columns, fmt) {
  const insights = [];
  if (customers.length === 0) return insights;

  const describeTop = (field, label, present, order = null) => {
    if (!present) return;
    const rows = churnRateByCategory(customers, field, order);
    if (rows.length < 2) {
      insights.push({ id: field, title: label, text: `Only one ${label.toLowerCase().replace('highest churn: ', '')} value is in the current selection, so there is nothing to compare.` });
      return;
    }
    const top = highest(rows);
    insights.push({
      id: field,
      title: label,
      text: `${top.names.join(' and ')} ${top.names.length > 1 ? 'have' : 'has'} the highest churn rate at ${fmt.percent(top.rate)} in the current selection.`,
    });
  };

  describeTop('contract', 'Highest churn: contract type', columns.contract);
  describeTop('payment', 'Highest churn: payment method', columns.payment);
  describeTop('tenureGroup', 'Highest churn: tenure group', columns.tenure, TENURE_GROUPS);

  if (columns.charges) {
    const churnedCount = countChurned(customers);
    insights.push({
      id: 'revenue',
      title: 'Monthly charges of churned customers',
      text: `${churnedCount} churned customer(s) are associated with ${fmt.currency(revenueAtRisk(customers))} in monthly charges.`,
    });
  }

  if (columns.contract) {
    const rows = churnRateByCategory(customers, 'contract');
    if (rows.length >= 2) {
      const hi = rows[0];
      const lo = rows[rows.length - 1];
      const gap = hi.churnRate - lo.churnRate;
      insights.push({
        id: 'contract-gap',
        title: 'Contract type gap',
        text: `Churn is ${gap.toFixed(1)} percentage points higher for ${hi.name} (${fmt.percent(hi.churnRate)}) than for ${lo.name} (${fmt.percent(lo.churnRate)}).`,
      });
    }
  }
  return insights;
}
