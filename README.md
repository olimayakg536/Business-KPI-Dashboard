# Business KPI Dashboard

An interactive, browser-only dashboard that helps a business understand **customer churn, retention, revenue at risk and customer behavior**. Built for a customer churn analytics internship task.

> **Live demo:** https://business-kpi-dashboard-nine.vercel.app/ *(placeholder: add after a successful deployment)*
> **GitHub repository:** `https://github.com/YOUR-USERNAME/Business-KPI-Dashboard` *(placeholder: add after pushing)*

## Business problem

Subscription businesses lose revenue when customers leave. Managers need to see quickly **how many customers churn, which segments churn most, and how much monthly revenue is tied to churned customers**, so they can focus retention work where it matters.

## Objectives

- Calculate core churn KPIs dynamically from a customer dataset.
- Compare churn across contract types, payment methods and tenure groups.
- Let users filter the data and see every KPI, chart and table update together.
- Turn the numbers into plain-language business insights.
- Let users analyse their own CSV without sending data anywhere.

## Features

- 4 KPI cards: Total Customers, Churn Rate, Retention Rate, Revenue at Risk
- 5 interactive Recharts charts with titles, axis labels, tooltips and legends
- 3 working filters (Contract Type, Tenure Group, Payment Method) with an **All** option and a **Reset filters** button
- Business insights calculated from the selected data (only shown when the data supports them)
- Customer summary table with search by Customer ID, "Show more" paging and an empty state
- **Upload CSV** (parsed in the browser) and **Download sample** buttons
- Automatic column-name detection (e.g. `Contract Type`, `contract_type` and `ContractType` all work)
- Safe handling of empty files, missing columns, missing values, invalid numbers and unrecognised churn labels
- Responsive layout (desktop sidebar, mobile top navigation)

## Technology stack

React 18 · Vite 5 · JavaScript · Recharts · Lucide React · Plain CSS · PapaParse · Git/GitHub · Vercel

There is no backend, database, API or authentication. Everything runs in the browser.

## Dataset

The default data is `public/sample-customers.csv`, a copy of the **Edvyro customer churn sample dataset**
(<https://edvyro.in/datasets/customer_churn_sample.csv>, 15 customer records). It is real sample data, not synthetic.

Columns: `CustomerID, Gender, Age, TenureMonths, SubscriptionType, MonthlyCharges, TotalCharges, ContractType, SupportTickets, PaymentMethod, Churn`.
The dashboard uses `CustomerID, TenureMonths, MonthlyCharges, ContractType, PaymentMethod, Churn`. Gender and Age are **not** displayed.
The dataset does not specify a currency; amounts are formatted with a `$` sign for readability.

## KPI definitions

| KPI | Formula |
|---|---|
| Total Customers | Number of customers in the current (filtered) selection |
| Churn Rate | churned customers ÷ total customers × 100 |
| Retention Rate | retained customers ÷ total customers × 100 |
| Revenue at Risk | sum of `MonthlyCharges` for customers who have **actually churned** |

**Revenue at Risk** is the monthly recurring charge associated with customers who have already churned. It is **not** a forecast of future revenue loss.

Churn values are interpreted from the file (`Yes/No`, `True/False`, `1/0`, `Churned/Retained`, and similar). Rows with an unrecognised churn value are skipped and reported, never guessed. If there are no customers (for example after a very narrow filter), rates show `—` instead of dividing by zero.

Tenure groups: `0–6 months`, `7–12 months`, `13–24 months`, `More than 24 months`.

## Charts

1. **Churn Distribution**: donut chart of churned vs retained customers
2. **Churn by Contract Type**: churn rate (%) per contract type
3. **Churn by Payment Method**: churn rate (%) per payment method
4. **Churn by Tenure Group**: churn rate (%) per tenure group
5. **Revenue Analysis**: average monthly charge for retained vs churned customers (tooltip also shows totals)

If a needed column is missing, the chart shows a friendly message instead of failing.

## Install and run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # development server (http://localhost:5173)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm test           # run the calculation tests
```

## Push to GitHub

1. Create an empty repository named `Business-KPI-Dashboard` on GitHub (no README, no .gitignore).
2. In the project folder:

```powershell
git remote add origin https://github.com/YOUR-USERNAME/Business-KPI-Dashboard.git
git push -u origin main
```

## Deploy to Vercel

1. Sign in at <https://vercel.com> with your GitHub account.
2. Click **Add New → Project** and import `Business-KPI-Dashboard`.
3. Vercel detects Vite automatically. Confirm: Build Command `npm run build`, Output Directory `dist`.
4. Click **Deploy** and copy the live URL into this README.

No environment variables or `vercel.json` are needed.

## Screenshots

*Add screenshots after deployment, for example `docs/dashboard-desktop.png` and `docs/dashboard-mobile.png`.*

## Limitations

- The bundled sample has only 15 customers, so percentages jump a lot (one customer = 6.7 points). Results are illustrative.
- The dashboard shows patterns, not causes; a high churn rate in a group does not prove why customers left.
- Uploaded CSVs are limited to 10 MB. Column detection covers common names only; other names may not be recognised.
- No date columns are used, so there are no time-trend charts.
- Currency is displayed as `$` because the dataset states none.

## Future improvements

- Time-based churn trends if a signup or cancellation date is available
- Additional segments (subscription type, support tickets, age bands)
- Export the filtered data or charts
- Manual column-mapping screen for unusual CSV headers
