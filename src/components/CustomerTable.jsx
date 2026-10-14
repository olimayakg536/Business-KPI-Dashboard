import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/format.js';

const PAGE_SIZE = 10;

export default function CustomerTable({ customers, columns, search, onSearch, filteredCount }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => setVisible(PAGE_SIZE), [customers, search]);

  const churned = customers.filter((c) => c.churned).length;
  const rate = customers.length ? (churned / customers.length) * 100 : null;

  return (
    <section id="customers" className="card" aria-labelledby="customers-title">
      <div className="section-head">
        <h2 id="customers-title">Customer summary</h2>
        {columns.id && (
          <div className="search">
            <Search size={16} aria-hidden="true" />
            <label htmlFor="search" className="sr-only">Search by customer ID</label>
            <input id="search" type="search" placeholder="Search by customer ID" value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}
      </div>

      {customers.length === 0 ? (
        <p className="empty-state">
          {search ? `No customers match "${search}" with the current filters.` : 'No customers match the selected filters.'}
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.id && <th scope="col">Customer ID</th>}
                  {columns.contract && <th scope="col">Contract type</th>}
                  {columns.tenure && <th scope="col" className="num">Tenure (months)</th>}
                  {columns.payment && <th scope="col">Payment method</th>}
                  {columns.charges && <th scope="col" className="num">Monthly charges</th>}
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, visible).map((c, i) => (
                  <tr key={`${c.id}-${i}`}>
                    {columns.id && <td>{c.id}</td>}
                    {columns.contract && <td>{c.contract}</td>}
                    {columns.tenure && <td className="num">{c.tenure ?? '—'}</td>}
                    {columns.payment && <td>{c.payment}</td>}
                    {columns.charges && <td className="num">{formatCurrency(c.charges)}</td>}
                    <td><span className={`badge ${c.churned ? 'churned' : 'retained'}`}>{c.churned ? 'Churned' : 'Retained'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span className="muted small">
              Showing {Math.min(visible, customers.length)} of {customers.length} customers · {churned} churned ({formatPercent(rate)})
              {search && ` · search narrows the table only (${filteredCount} match the filters)`}
            </span>
            {visible < customers.length && (
              <button type="button" className="btn" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Show more</button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
