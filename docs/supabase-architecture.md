# Supabase integration plan

The initial implementation intentionally uses local dummy data. `lib/repository.ts` is the storage boundary, `types/index.ts` defines the frontend contracts, and `lib/operations.ts` defines the demo business transitions. `lib/supabase/client.ts` provides a lazy client factory; no credentials or Supabase project are required to run the prototype.

## Entities and ownership

| Entity               | Important columns / relationships                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| roles                | id, name (`admin`, `manager`, `staff`)                                                                          |
| profiles             | id → auth.users, role_id → roles, branch_id → branches, name                                                    |
| branches             | id, code, name, address, manager_id → profiles, phone, active, is_head_office                                   |
| products             | id, sku (unique), name, category, unit, minimum_stock, reorder_level, unit_value, active                        |
| inventory            | product_id → products, branch_id → branches, quantity, updated_at; unique product + branch                      |
| inventory_movements  | id, product_id, branch_id, type, signed_quantity, reference_id, created_by, created_at, remarks                 |
| stock_transfers      | id, number, source_branch_id, destination_branch_id, date, status, prepared_by, received_by, received_at, notes |
| stock_transfer_items | id, transfer_id → stock_transfers, product_id, expected_quantity, received_quantity                             |
| sales                | id, branch_id, date, gross, discounts, transactions, cash, wallet, card, status, submitted_by                   |
| stock_adjustments    | id, product_id, branch_id, signed_quantity, reason, remarks, movement_id, recorded_by                           |
| wastage_records      | id, product_id, branch_id, quantity, reason, remarks, movement_id, recorded_by, date                            |
| physical_counts      | id, branch_id, date, status, counted_by                                                                         |
| physical_count_items | id, physical_count_id, product_id, system_quantity, physical_quantity, remarks, adjustment_id                   |
| notifications        | id, branch_id, category, title, created_at; per-user read state in notification_reads                           |
| audit_logs           | id, branch_id, user_id, role, action, module, reference_id, old_values, new_values, created_at                  |

Use UUID primary keys, foreign keys, `numeric` quantities, `numeric(14,2)` currency, timestamptz timestamps and database constraints. Store net sales as generated `gross - discounts`. Enforce unique submitted branch/date reports with a partial unique index. Products are deactivated rather than deleted.

## Row Level Security

Resolve role and branch from the authenticated profile, never from request payloads, user-editable metadata or the demo role selector. All operational tables require RLS. Head Office admins may read every location. Branch employees may read only their assigned branch's rows. Transfers and transfer items are visible only to Head Office and their destination branch. Users cannot update their own role or branch. Catalogs may be readable to branch employees; catalog writes and account management require Head Office.

Keep role lookup in a carefully scoped security-definer helper with a fixed search_path to avoid recursive profiles policies. Profiles must be provisioned by a trusted server/admin. Remove the demo account switcher in the authenticated deployment.

Use authenticated transactional RPCs for stock changes instead of direct `inventory` writes. Check ownership and role inside each RPC and apply RLS to reads. Revoke direct update permissions to stock balances, immutable movements and audit logs from ordinary users.

## Transactional operations

- **Dispatch:** lock transfer and source inventory rows; verify Pending status and sufficient stock; subtract all items; insert Transfer Out movements and audit log; advance status. Fail atomically if any item is unavailable.
- **Receive:** verify authenticated destination branch and Dispatched/In Transit status; validate quantities and discrepancy remarks; lock transfer and destination inventory; add only confirmed quantities; append Transfer In records and audit log; save receiving metadata. Prevent duplicate receipt by locking and status checks. Shortage remarks remain linked to the transfer for reconciliation.
- **Adjustment / wastage / physical count:** validate reason, remarks and ownership; lock inventory rows; reject a negative resulting balance; insert immutable movements and source records; update balances; append audit log. Persist zero-variance counts without creating a stock movement.
- **Sales:** validate non-negative amounts, transaction integer, payment reconciliation and branch ownership; save drafts, submit one daily report per branch, and audit corrections with old/new values.

Do not deploy frontend-only role checks as a security boundary. The demo keeps all fixtures in the browser for role demonstrations. Production repositories must fetch only RLS-authorized rows, and server mutations must not trust client-computed balances.

## Migration sequence

1. Create the entities, constraints, RPCs and RLS policies in reviewed migrations.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; keep privileged service keys server-only.
3. Replace predefined profiles with Supabase Auth and trusted profile queries.
4. Replace the local repository with an asynchronous Supabase adapter, scope queries by authenticated identity and introduce loading/error handling at that boundary.
5. Replace `applyCommand` mutations with transactional RPCs returning refreshed authorized data.
6. Test policies using Head Office, two different branches, staff and unauthenticated clients before connecting production records.

Supplier, purchasing and procurement entities are intentionally excluded.
