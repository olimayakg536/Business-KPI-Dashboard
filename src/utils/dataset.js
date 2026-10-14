// Turns raw CSV rows into clean customer records used by every chart, KPI and table.
import { detectColumns } from './columns.js';
import { getTenureGroup } from './calculations.js';

// Churn labels differ between datasets, so we recognise common spellings of both states.
// Anything else is NOT guessed: the row is skipped and reported to the user.
const CHURNED_VALUES = new Set(['yes', 'y', 'true', 't', '1', 'churn', 'churned', 'left', 'lost', 'cancelled', 'canceled', 'exited', 'attrited', 'closed']);
const RETAINED_VALUES = new Set(['no', 'n', 'false', 'f', '0', 'retained', 'active', 'stayed', 'current', 'existing', 'kept', 'notchurned']);

/** true = churned, false = retained, null = unrecognised. */
export function parseChurnValue(value) {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (s === '') return null;
  if (CHURNED_VALUES.has(s)) return true;
  if (RETAINED_VALUES.has(s)) return false;
  const n = Number(s);
  if (Number.isFinite(n)) return n === 1 ? true : n === 0 ? false : null;
  return null;
}

/** Parses "49.99", "$1,299.50" or "₹ 500". Returns null if it is not a valid non-negative number. */
export function parseNumber(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const cleanText = (v) => {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? 'Unknown' : s;
};

/**
 * Builds a dataset from parsed CSV rows.
 * Returns { ok: false, error } or { ok: true, customers, columns, warnings, headers }.
 */
export function buildDataset(rows, headers) {
  if (!Array.isArray(headers) || headers.length === 0 || !Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: 'The file is empty or has no data rows. Please upload a CSV with a header row and at least one customer.' };
  }

  const columns = detectColumns(headers);
  if (!columns.churn) {
    return {
      ok: false,
      error: `No churn status column was found, so churn cannot be calculated. Expected a column like "Churn", "Churned" or "Exited". Columns found: ${headers.join(', ')}.`,
    };
  }

  let skippedChurn = 0;
  let invalidCharges = 0;
  let invalidTenure = 0;
  const customers = [];

  rows.forEach((row) => {
    const churned = parseChurnValue(row[columns.churn]);
    if (churned === null) {
      skippedChurn += 1; // never guess a churn status
      return;
    }

    let tenure = null;
    if (columns.tenure) {
      tenure = parseNumber(row[columns.tenure]);
      if (tenure === null) invalidTenure += 1;
    }
    let charges = null;
    if (columns.charges) {
      charges = parseNumber(row[columns.charges]);
      if (charges === null) invalidCharges += 1;
    }

    customers.push({
      id: columns.id ? cleanText(row[columns.id]) : null,
      contract: columns.contract ? cleanText(row[columns.contract]) : null,
      payment: columns.payment ? cleanText(row[columns.payment]) : null,
      tenure,
      tenureGroup: columns.tenure ? getTenureGroup(tenure) ?? 'Unknown' : null,
      charges,
      churned,
    });
  });

  if (customers.length === 0) {
    return {
      ok: false,
      error: `None of the ${rows.length} rows had a recognisable churn value in "${columns.churn}". Supported values include Yes/No, True/False and 1/0.`,
    };
  }

  const warnings = [];
  if (skippedChurn) warnings.push(`${skippedChurn} row(s) skipped because the churn value was missing or not recognised.`);
  if (invalidCharges) warnings.push(`${invalidCharges} row(s) have a missing or invalid monthly charge; they are left out of revenue totals.`);
  if (invalidTenure) warnings.push(`${invalidTenure} row(s) have a missing or invalid tenure and appear under "Unknown".`);

  return { ok: true, customers, columns, warnings, headers };
}
