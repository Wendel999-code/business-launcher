# Local sales and inventory

Operational records are stored in this browser's `brew-demo-v1` localStorage entry. A new workspace starts empty. Previously saved records are retained; legacy Downtown, Riverside and Uptown locations map to Amadeo, Gen Tri and Tanza respectively.

## Complete workflow

1. As Head Office, open Products and add Arabica Coffee Beans with unit kg and Initial Head Office Quantity 100. This creates the product, balances at every location and an opening stock movement.
2. Open Stock Transfers, create a transfer of 20 kg to Amadeo, then dispatch it. Head Office now has 80 kg. Pending transfers do not deduct stock until dispatched.
3. Switch to the Amadeo account, open Stock Transfers and confirm receipt. Amadeo now has 20 kg and the transfer is Received. Receipt cannot be applied twice.
4. Open Daily Sales. Enter financial totals and add an inventory item for the tracked product with quantity 3 and use Sold or Consumed. Submit the report; Amadeo now has 17 kg. For piece-based products the same operation changes 20 pcs to 17 pcs. Drafts do not deduct stock. Editing a submitted report applies only the quantity difference.
5. In Inventory, record an adjustment of -2, reason Damaged, with remarks. Amadeo now has 15 kg and the movement is recorded.
6. Head Office's dashboard shows actual location balances, sales, transfers, adjustments and stock conditions. An already-open Head Office tab updates when another tab saves operational changes.
7. Refresh either tab. The products, balances, sales, transfers and movements remain saved.

Invalid quantities, duplicate receipts, overselling and adjustments below zero are rejected without saving partial changes. Storage errors preserve the previous saved snapshot and display an error. Product edits do not reset stock; use adjustments or physical counts to change existing balances.

## Data boundary

`lib/operations.ts` contains immutable, validated commands. `lib/repository.ts` loads the latest saved snapshot, applies one command and persists the resulting snapshot before updating the UI. `components/providers.tsx` manages subscriptions and profile selection. UI components submit commands rather than writing inventory directly.

Replace the repository adapter with authenticated Supabase/PostgreSQL reads and transactional RPCs when adding a backend. Enforce authorization and stock validation within database transactions. Browser localStorage supports this local workflow; it does not synchronize between devices or provide database transaction locking across simultaneous tab writes.

`data/dummy` remains available as test fixtures and configuration; operational fixtures are not loaded into a new workspace. Clearing operational storage starts an empty workspace and removes its saved records.

## Verification

Run `npm test` for command and repository checks. With the app running, run `npm run test:e2e` for the complete browser workflow, cross-tab monitoring, persistence, branch scope and mobile layout. Use `npm.cmd` on PowerShell if script execution blocks `npm`.
