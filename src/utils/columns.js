// Column detection: maps the headers of any CSV onto the fields the dashboard needs.
// Headers are normalised (lower case, letters/digits only) before matching,
// so "Contract Type", "contract_type" and "ContractType" are treated the same.

export const normalizeHeader = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Exact (normalised) names we recognise, in priority order.
const ALIASES = {
  id: ['customerid', 'custid', 'clientid', 'userid', 'accountid', 'customernumber', 'id'],
  contract: ['contracttype', 'contract', 'contractterm', 'contractlength', 'plantype'],
  tenure: ['tenuremonths', 'tenure', 'customertenure', 'monthsactive', 'monthsasacustomer', 'months'],
  payment: ['paymentmethod', 'payment', 'paymenttype', 'paymentmode', 'billingmethod'],
  charges: ['monthlycharges', 'monthlycharge', 'monthlyfee', 'monthlyrevenue', 'monthlybill', 'mrr', 'charges'],
  churn: ['churn', 'churned', 'churnstatus', 'churnflag', 'customerchurn', 'exited', 'attrition', 'left'],
};

// Looser fallbacks if no exact name matched.
const CONTAINS = {
  contract: /contract/,
  tenure: /tenure/,
  payment: /payment/,
  charges: /monthly.*(charge|fee|bill|revenue)/,
  churn: /churn(?!.*(reason|score|prob|risk|date))/,
};

/** Returns { id, contract, tenure, payment, charges, churn } -> original header name or null. */
export function detectColumns(headers) {
  const normalized = headers.map((h) => ({ original: h, key: normalizeHeader(h) }));
  const used = new Set();
  const result = {};

  for (const field of Object.keys(ALIASES)) {
    let match = null;
    for (const alias of ALIASES[field]) {
      match = normalized.find((h) => h.key === alias && !used.has(h.original));
      if (match) break;
    }
    if (!match && CONTAINS[field]) {
      match = normalized.find((h) => CONTAINS[field].test(h.key) && !used.has(h.original));
    }
    result[field] = match ? match.original : null;
    if (match) used.add(match.original);
  }
  return result;
}
