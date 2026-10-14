// Display formatting helpers. The dataset does not state a currency,
// so amounts are shown in USD format for readability.
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const integer = new Intl.NumberFormat('en-US');

export const formatCurrency = (v) => (v == null || !Number.isFinite(v) ? '—' : currency.format(v));
export const formatPercent = (v, digits = 1) => (v == null || !Number.isFinite(v) ? '—' : `${v.toFixed(digits)}%`);
export const formatNumber = (v) => (v == null || !Number.isFinite(v) ? '—' : integer.format(v));
