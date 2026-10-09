# Brew Coffee

A responsive sales and inventory prototype for one Head Office and three branches, built with Next.js 16 App Router, TypeScript, Tailwind CSS 4, Framer Motion, Recharts and a Supabase-ready data boundary.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. The root opens a Head Office demo for immediate exploration. Visit /login for sample sign-in, or use the profile menu to switch demo accounts. On Windows PowerShell with restricted script execution, use npm.cmd in place of npm.

All sample accounts use password **brew2026**.

| Account           | Email                   | Scope         |
| ----------------- | ----------------------- | ------------- |
| Head Office Admin | admin@brewcoffee.ph     | All locations |
| Downtown Manager  | downtown@brewcoffee.ph  | Downtown      |
| Riverside Manager | riverside@brewcoffee.ph | Riverside     |
| Uptown Manager    | uptown@brewcoffee.ph    | Uptown        |
| Downtown Staff    | staff@brewcoffee.ph     | Downtown      |

## Explore the workflow

1. Create a stock transfer from the dashboard or Stock Transfers. Multiple products, drafts and delivery notes are supported.
2. Dispatch it from Head Office. Stock is deducted atomically and Transfer Out movements are recorded.
3. Switch to the destination branch from the profile menu.
4. Receive the delivery, confirm actual quantities and explain discrepancies. Confirmed quantities are added to branch stock.
5. Record sales, adjustments, wastage and physical counts. Every stock change is traceable.
6. Switch back to Head Office and review branch dashboards, reports, notifications and activity logs.

The seeded date is **October 8, 2026**. Three daily reports already exist for that date; edit those reports or select another reporting date. Payment totals must equal net sales when submitting. Submitted branch/date reports cannot be duplicated. Report edits preserve the reference and create an audit entry.

## Included screens

- Head Office and branch dashboards with live demo calculations, date/branch filters and interactive sales trends
- Daily sales with payment reconciliation, drafts, editing, details, search, sort, filters, pagination and CSV export
- Location inventory, minimum/reorder alerts and traceable movement history
- Multi-item transfers, draft editing, dispatch, transit, cancellation and branch receiving
- Adjustments, wastage comparison and physical counts (including zero-variance counts)
- Product creation/editing and activation/deactivation without deleting history
- Branch directory and operational detail tabs
- Daily, weekly and monthly sales reports, branch comparisons and payment breakdown
- Inventory reports for current stock, low stock, movements, transfers, adjustments, wastage and physical count variance
- Read/unread notifications, activity logs, predefined team permission details and saved workspace preferences
- Responsive drawer, collapsible sidebar, loading/error/empty states, accessible dialogs and subtle motion

## Data and integration

- `data/dummy/`: typed realistic fixtures, separate from UI components
- `types/`: shared entities
- `lib/operations.ts`: validated, immutable demo transitions with authorization, movement and audit rules
- `lib/repository.ts`: browser persistence adapter
- `lib/permissions.ts`: demo role/location checks
- `lib/supabase/client.ts`: optional lazy Supabase factory
- `components/`: layout, dashboard, forms, shared tables and feature modules
- `app/`: server route components and client interactivity boundaries

Changes persist in localStorage on this browser. Remember me persists the selected demo account; unchecked sign-in uses sessionStorage. To restore fixtures, clear the browser's `brew-demo-v1` storage entry. Demo role selection is for exploration, not production authentication. All fixture data resides in the client; production access requires authenticated queries and RLS.

See [Supabase architecture](docs/supabase-architecture.md) for entities, ownership policies, transactional RPCs and integration steps. Real Supabase authentication, email password recovery, account invitations and database persistence are not enabled in this frontend scope. Suppliers and procurement are excluded.

## Verification

```sh
npm test
npm run build
# With a local server running:
npm run test:e2e
```

Domain tests verify atomic inventory changes, branch isolation, duplicate receipt prevention, discrepancy validation, sales reconciliation and audit behavior. Browser tests cover the end-to-end transfer flow, persisted branch scope, sales editing, notifications, login errors and mobile layout. Browser tests use installed Microsoft Edge by default; set PLAYWRIGHT_BASE_URL to test another local port.
