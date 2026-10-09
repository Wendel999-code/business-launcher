"use client";
import { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Package,
  Truck,
  ChartNoAxesCombined,
  SlidersHorizontal,
  Save,
  ShieldCheck,
  UserRound,
  Eye,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Badge, Panel, Modal } from "@/components/ui";
import { profiles, locationName } from "@/data/dummy/branches";
import { canAccessLocation } from "@/lib/permissions";
import { DataTable } from "@/components/shared/data-table";
export function NotificationsPage() {
  const { store, profile, execute } = useApp();
  const [category, setCategory] = useState("All");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const notices = store.notifications.filter(
    (n) =>
      canAccessLocation(profile, n.branchId) &&
      (category === "All" || n.category === category) &&
      (!unreadOnly || !n.read),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BREW COFFEE · SYSTEM</div>
          <h1>
            Your notifications<span className="title-dot">.</span>
          </h1>
          <p>Stay in the know, wherever the day takes you.</p>
        </div>
        <button
          className="button secondary"
          onClick={() => execute({ type: "read" })}
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>
      <div className="report-toolbar">
        <div className="segmented-control">
          {["All", "Inventory", "Sales", "Transfers", "Adjustments"].map(
            (c) => (
              <button
                key={c}
                className={category === c ? "selected" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ),
          )}
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />{" "}
          Unread only
        </label>
      </div>
      <section className="panel notifications-panel">
        {notices.map((n) => {
          const Icon =
            n.category === "Inventory"
              ? Package
              : n.category === "Transfers"
                ? Truck
                : n.category === "Sales"
                  ? ChartNoAxesCombined
                  : SlidersHorizontal;
          return (
            <div className={`notice-row ${n.read ? "" : "unread"}`} key={n.id}>
              <span className={`notice-icon ${n.category.toLowerCase()}`}>
                <Icon size={20} />
              </span>
              <div>
                <div>
                  <strong>{n.title}</strong>
                  {!n.read && <span className="unread-dot" />}
                </div>
                <small>
                  {n.category} <span>·</span> {locationName(n.branchId)}{" "}
                  <span>·</span> {n.time}
                </small>
              </div>
              {!n.read && (
                <button
                  className="text-link"
                  onClick={() => execute({ type: "read", id: n.id })}
                >
                  Mark as read
                </button>
              )}
            </div>
          );
        })}
        {!notices.length && (
          <div className="empty-state">
            <Bell size={32} />
            <h3>You're all caught up</h3>
            <p>No notifications match these filters.</p>
          </div>
        )}
      </section>
    </>
  );
}
export function SettingsPage() {
  const { toast } = useApp();
  const [name, setName] = useState("Brew Coffee");
  const [email, setEmail] = useState("hello@brewcoffee.ph");
  const [saved, setSaved] = useState(false);
  const [low, setLow] = useState(true);
  const [sales, setSales] = useState(true);
  const [transfers, setTransfers] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("brew-settings");
      if (raw) {
        const value = JSON.parse(raw);
        setName(value.name ?? "Brew Coffee");
        setEmail(value.email ?? "hello@brewcoffee.ph");
        setLow(value.low ?? true);
        setSales(value.sales ?? true);
        setTransfers(value.transfers ?? true);
      }
    } catch {
      /* Keep default preferences if storage is unavailable. */
    }
  }, []);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BREW COFFEE · SYSTEM</div>
          <h1>
            Workspace settings<span className="title-dot">.</span>
          </h1>
          <p>A few preferences to make this workspace feel like yours.</p>
        </div>
      </div>
      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            localStorage.setItem(
              "brew-settings",
              JSON.stringify({ name, email, low, sales, transfers }),
            );
            setSaved(true);
            toast("Workspace preferences saved in this browser.");
          } catch {
            toast("Unable to save preferences in this browser.");
          }
        }}
      >
        <Panel
          title="Business profile"
          subtitle="Your company details and regional preferences."
        >
          <div className="form-body form-grid">
            <label>
              Business name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Contact email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Currency
              <input disabled value="PHP — Philippine Peso (₱)" />
            </label>
            <label>
              Time zone
              <input disabled value="Asia/Manila (UTC+08:00)" />
            </label>
          </div>
        </Panel>
        <Panel
          title="Notifications"
          subtitle="Choose which updates matter to your team."
        >
          <div className="settings-toggles">
            {[
              [
                "Low stock alerts",
                "Know when stock falls below minimum.",
                low,
                setLow,
              ],
              [
                "Daily sales updates",
                "Keep track of submitted branch reports.",
                sales,
                setSales,
              ],
              [
                "Stock transfer updates",
                "Follow deliveries from dispatch to receipt.",
                transfers,
                setTransfers,
              ],
            ].map(([label, desc, value, setter]) => (
              <div className="settings-toggle-row" key={String(label)}>
                <div>
                  <strong>{String(label)}</strong>
                  <p>{String(desc)}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(value)}
                  aria-label={String(label)}
                  className={`toggle ${value ? "on" : ""}`}
                  onClick={() => (setter as (v: boolean) => void)(!value)}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>
        </Panel>
        <div className="info-box">
          <ShieldCheck size={20} />
          <span>
            Demo mode uses browser storage. Authentication and database
            permissions will be enforced by Supabase when connected.
          </span>
        </div>
        <div className="settings-save">
          {saved && <span className="positive">Preferences saved</span>}
          <button className="button primary">
            <Save size={16} /> Save preferences
          </button>
        </div>
      </form>
    </>
  );
}
export function UsersPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BREW COFFEE · MANAGEMENT</div>
          <h1>
            Team & access<span className="title-dot">.</span>
          </h1>
          <p>The people behind every good day at Brew Coffee.</p>
        </div>
        <Badge>{profiles.length} Active Users</Badge>
      </div>
      <DataTable
        title="Team"
        rows={profiles.map((p) => ({
          ...p,
          branch: locationName(p.branchId),
          status: "Active",
        }))}
        columns={[
          {
            key: "name",
            label: "TEAM MEMBER",
            render: (r) => (
              <div className="branch-cell">
                <span className="small-avatar">
                  <UserRound size={16} />
                </span>
                <span>
                  <strong>{String(r.name)}</strong>
                  <small>{String(r.email)}</small>
                </span>
              </div>
            ),
          },
          {
            key: "role",
            label: "ROLE",
            render: (r) =>
              r.role === "admin"
                ? "Head Office Admin"
                : r.role === "manager"
                  ? "Branch Manager"
                  : "Branch Staff",
          },
          { key: "branch", label: "WORKSPACE" },
          {
            key: "status",
            label: "STATUS",
            render: (r) => <Badge>{String(r.status)}</Badge>,
          },
        ]}
        actions={(r) => (
          <button
            className="icon-button"
            aria-label="View user permissions"
            onClick={() => setSelected(r.id)}
          >
            <Eye size={16} />
          </button>
        )}
      />
      <div className="info-box">
        <ShieldCheck size={20} />
        <span>
          Demo accounts are predefined. Invite and permission changes will
          become available with Supabase authentication.
        </span>
      </div>
      {selected && (
        <Modal title="Account permissions" onClose={() => setSelected(null)}>
          <div className="form-body">
            <h3>{profiles.find((p) => p.id === selected)?.name}</h3>
            <p>
              {selected === "admin"
                ? "Full access to all branch operations, reporting and workspace management."
                : `Can view and record sales, receive stock, and record inventory changes for ${locationName(profiles.find((p) => p.id === selected)!.branchId)} only.`}
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
