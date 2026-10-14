// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCsvText } from './csv.js';
import { buildDataset, parseChurnValue, parseNumber } from './dataset.js';
import {
  ALL, TENURE_GROUPS, getTenureGroup, churnRate, retentionRate, revenueAtRisk,
  churnRateByCategory, filterCustomers, chargesByStatus, buildInsights,
} from './calculations.js';

const csv = readFileSync(new URL('../../public/sample-customers.csv', import.meta.url), 'utf8');
const { rows, headers } = parseCsvText(csv);
const ds = buildDataset(rows, headers);
const noFilters = { contract: ALL, tenureGroup: ALL, payment: ALL };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('sample dataset loads with detected columns', () => {
  assert.equal(ds.ok, true);
  assert.equal(ds.customers.length, 15);
  assert.deepEqual(ds.columns, {
    id: 'CustomerID', contract: 'ContractType', tenure: 'TenureMonths',
    payment: 'PaymentMethod', charges: 'MonthlyCharges', churn: 'Churn',
  });
});

test('KPIs on the full sample (7 churned of 15)', () => {
  close(churnRate(ds.customers), (7 / 15) * 100);
  close(retentionRate(ds.customers), (8 / 15) * 100);
  close(revenueAtRisk(ds.customers), 409.93);
  close(churnRate(ds.customers) + retentionRate(ds.customers), 100);
});

test('tenure grouping boundaries', () => {
  assert.equal(getTenureGroup(0), TENURE_GROUPS[0]);
  assert.equal(getTenureGroup(6), TENURE_GROUPS[0]);
  assert.equal(getTenureGroup(7), TENURE_GROUPS[1]);
  assert.equal(getTenureGroup(12), TENURE_GROUPS[1]);
  assert.equal(getTenureGroup(13), TENURE_GROUPS[2]);
  assert.equal(getTenureGroup(24), TENURE_GROUPS[2]);
  assert.equal(getTenureGroup(25), TENURE_GROUPS[3]);
  assert.equal(getTenureGroup(-1), null);
  assert.equal(getTenureGroup(null), null);
});

test('churn rate by contract, payment and tenure group', () => {
  const byContract = Object.fromEntries(churnRateByCategory(ds.customers, 'contract').map((r) => [r.name, r.churnRate]));
  assert.deepEqual(byContract, { 'Month-to-Month': 100, 'One Year': 0, 'Two Year': 0 });
  const byPay = Object.fromEntries(churnRateByCategory(ds.customers, 'payment').map((r) => [r.name, r.churnRate]));
  close(byPay['Credit Card'], (2 / 6) * 100);
  close(byPay['UPI'], 75);
  assert.equal(byPay['Debit Card'], 100);
  assert.equal(byPay['Bank Transfer'], 0);
  const byTenure = churnRateByCategory(ds.customers, 'tenureGroup', TENURE_GROUPS);
  assert.deepEqual(byTenure.map((r) => r.name), TENURE_GROUPS);
  assert.deepEqual(byTenure.map((r) => r.churnRate), [100, 100, 20, 0]);
});

test('filters change the customer population consistently', () => {
  const m2m = filterCustomers(ds.customers, { ...noFilters, contract: 'Month-to-Month' });
  assert.equal(m2m.length, 7);
  assert.equal(churnRate(m2m), 100);
  const combo = filterCustomers(ds.customers, { contract: 'Month-to-Month', tenureGroup: '0–6 months', payment: 'UPI' });
  assert.deepEqual(combo.map((c) => c.id).sort(), ['CUST-1003', 'CUST-1010', 'CUST-1014']);
  assert.equal(filterCustomers(ds.customers, noFilters, 'cust-1004').length, 1);
  assert.equal(filterCustomers(ds.customers, noFilters, 'zzz').length, 0);
});

test('empty selections are handled safely', () => {
  assert.equal(churnRate([]), null);
  assert.equal(retentionRate([]), null);
  assert.equal(revenueAtRisk([]), 0);
  assert.deepEqual(churnRateByCategory([], 'contract'), []);
  assert.deepEqual(buildInsights([], ds.columns, {}), []);
});

test('revenue comparison by status', () => {
  const [retained, churned] = chargesByStatus(ds.customers);
  assert.equal(retained.customers, 8);
  assert.equal(churned.customers, 7);
  close(churned.total, 409.93);
});

test('churn labels are interpreted, never guessed', () => {
  assert.equal(parseChurnValue('Yes'), true);
  assert.equal(parseChurnValue(' churned '), true);
  assert.equal(parseChurnValue('1'), true);
  assert.equal(parseChurnValue('No'), false);
  assert.equal(parseChurnValue('Active'), false);
  assert.equal(parseChurnValue('maybe'), null);
  assert.equal(parseChurnValue(''), null);
});

test('number parsing handles currency symbols and bad values', () => {
  assert.equal(parseNumber('$1,299.50'), 1299.5);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('-5'), null);
});

test('alternative column names and bad rows', () => {
  const r = parseCsvText('Customer ID,Contract,Tenure,Payment Method,Monthly Charge,Churned\nA1,Monthly,3,Card,$20,TRUE\nA2,Annual,abc,Card,oops,FALSE\nA3,Annual,30,Card,10,unknown\n');
  const d = buildDataset(r.rows, r.headers);
  assert.equal(d.ok, true);
  assert.equal(d.customers.length, 2); // A3 skipped: unrecognised churn value
  assert.equal(d.customers[1].tenureGroup, 'Unknown');
  assert.equal(d.customers[1].charges, null);
  assert.equal(d.warnings.length, 3);
});

test('invalid files give clear errors', () => {
  assert.equal(buildDataset([], []).ok, false);
  const noChurn = parseCsvText('CustomerID,Contract\nA,Monthly\n');
  const e = buildDataset(noChurn.rows, noChurn.headers);
  assert.equal(e.ok, false);
  assert.match(e.error, /churn/i);
  const badChurn = parseCsvText('id,churn\nA,maybe\nB,perhaps\n');
  assert.equal(buildDataset(badChurn.rows, badChurn.headers).ok, false);
});

test('missing optional columns: dataset still works, insights are limited', () => {
  const r = parseCsvText('id,churn\nA,Yes\nB,No\n');
  const d = buildDataset(r.rows, r.headers);
  assert.equal(d.ok, true);
  assert.equal(d.customers[0].contract, null);
  const ins = buildInsights(d.customers, d.columns, { percent: String, currency: String });
  assert.equal(ins.length, 0);
});

test('insights on the sample', () => {
  const fmt = { percent: (v) => `${v.toFixed(1)}%`, currency: (v) => `$${v.toFixed(2)}` };
  const ins = buildInsights(ds.customers, ds.columns, fmt);
  const byId = Object.fromEntries(ins.map((i) => [i.id, i.text]));
  assert.match(byId.contract, /Month-to-Month has the highest churn rate at 100\.0%/);
  assert.match(byId.payment, /Debit Card/);
  assert.match(byId['contract-gap'], /100\.0 percentage points/);
  assert.match(byId.revenue, /\$409\.93/);
});
