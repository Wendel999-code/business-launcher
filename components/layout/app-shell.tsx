"use client";
import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Package,
  Truck,
  SlidersHorizontal,
  Trash2,
  Coffee,
  Store,
  Users,
  FileChartColumn,
  ChartColumn,
  Bell,
  History,
  Settings,
  ChevronDown,
  ChevronsLeft,
  Menu,
  Search,
  ArrowUpRight,
  LogOut,
  CircleHelp,
  Building2,
  X,
} from "lucide-react";
import { Brand } from "@/components/ui";
import { useApp } from "@/components/providers";
import { profiles, locationName } from "@/data/dummy/branches";
import { canAccess, canAccessLocation } from "@/lib/permissions";
import { WorkflowModal } from "@/components/forms/workflow-modal";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
const groups = [
  {
    label: "",
    items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "OPERATIONS",
    items: [
      { id: "sales", label: "Sales", icon: ChartNoAxesCombined },
      { id: "inventory", label: "Inventory", icon: Package },
      // { id: "transfers", label: "Stock Transfers", icon: Truck },
      // {
      //   id: "adjustments",
      //   label: "Stock Adjustments",
      //   icon: SlidersHorizontal,
      // },
      // { id: "wastage", label: "Wastage", icon: Trash2 },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { id: "products", label: "Products", icon: Coffee },
      // { id: "branches", label: "Branches", icon: Store },
      // { id: "users", label: "Team & Access", icon: Users },
    ],
  },
  // {
  //   label: "ANALYTICS",
  //   items: [
  //     { id: "sales-reports", label: "Sales Reports", icon: FileChartColumn },
  //     {
  //       id: "inventory-reports",
  //       label: "Inventory Reports",
  //       icon: ChartColumn,
  //     },
  //     {
  //       id: "branch-performance",
  //       label: "Branch Performance",
  //       icon: ChartNoAxesCombined,
  //     },
  //   ],
  // },
  // {
  //   label: "SYSTEM",
  //   items: [
  //     { id: "notifications", label: "Notifications", icon: Bell },
  //     { id: "activity", label: "Activity Logs", icon: History },
  //     { id: "settings", label: "Settings", icon: Settings },
  //   ],
  // },
];
export function AppShell({ children }: { children: ReactNode }) {
  const { profile, store, switchProfile } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSearch("");
        setProfileOpen(false);
        setMobile(false);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
  const [modal, setModal] = useState<string | null>(null);
  const unread = store.notifications.filter(
    (n) => !n.read && canAccessLocation(profile, n.branchId),
  ).length;
  const title =
    groups
      .flatMap((g) => g.items)
      .find((i) => path === `/${i.id}` || path.startsWith(`/${i.id}/`))
      ?.label ?? "Overview";
  const results = groups
    .flatMap((g) => g.items)
    .filter(
      (i) =>
        canAccess(profile, i.id) &&
        i.label.toLowerCase().includes(search.toLowerCase()),
    );
  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      {mobile && (
        <button
          className="drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link href="/" className="brand-link">
          <Brand />
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
        <div className="workspace">
          <span className="workspace-icon">
            <Building2 size={17} />
          </span>
          <div>
            <strong>
              {profile.role === "admin"
                ? "Head Office"
                : locationName(profile.branchId).replace(" Branch", "")}
            </strong>
            <small>
              {profile.role === "admin"
                ? "Admin workspace"
                : "Branch workspace"}
            </small>
          </div>
          <ChevronDown size={14} />
        </div>
        <nav aria-label="Main navigation">
          {groups.map((group, idx) => {
            const items = group.items.filter((i) => canAccess(profile, i.id));
            return (
              items.length > 0 && (
                <div className="nav-group" key={idx}>
                  {group.label && (
                    <div className="nav-label">{group.label}</div>
                  )}
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      title={collapsed ? item.label : undefined}
                      href={`/${item.id}`}
                      onClick={() => setMobile(false)}
                      className={`nav-item ${path === `/${item.id}` || path.startsWith(`/${item.id}/`) || (item.id === "dashboard" && path === "/") ? "active" : ""}`}
                    >
                      <item.icon size={17} strokeWidth={1.65} />
                      <span>{item.label}</span>
                      {item.id === "transfers" && (
                        <em>
                          {
                            store.transfers.filter(
                              (t) =>
                                [
                                  "Pending",
                                  "In Transit",
                                  "Dispatched",
                                ].includes(t.status) &&
                                canAccessLocation(profile, t.branchId),
                            ).length
                          }
                        </em>
                      )}
                      {item.id === "notifications" && unread > 0 && (
                        <i className="nav-dot" />
                      )}
                    </Link>
                  ))}
                </div>
              )
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          {/* <div className="help-box">
            <span>
              <CircleHelp size={16} /> A little help?
            </span>
            <p>Your daily operations, made simpler.</p>
            <button onClick={() => setModal("help")}>
              Explore the workspace <ArrowUpRight size={13} />
            </button>
          </div> */}
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft size={17} />
            <span>Collapse sidebar</span>
          </button>
          <div className="sidebar-version">
            <span className="online-dot" /> All systems operational{" "}
            <small>v1.0</small>
          </div>
        </div>
      </aside>
      <div className="main-wrapper">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <div className="global-search">
              <Search size={16} />
              <input
                aria-label="Search workspace"
                ref={searchRef}
                placeholder="Search workspace..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* <kbd>⌘ K</kbd> */}
              {search && (
                <div className="search-results">
                  {results.length ? (
                    results.map((r) => (
                      <Link
                        key={r.id}
                        href={`/${r.id}`}
                        onClick={() => setSearch("")}
                      >
                        <r.icon size={16} />
                        {r.label}
                        <ArrowUpRight size={14} />
                      </Link>
                    ))
                  ) : (
                    <p>No matching pages</p>
                  )}
                </div>
              )}
            </div>
            {/* <button
              className="notification-button icon-button"
              onClick={() => router.push("/notifications")}
              aria-label={`${unread} unread notifications`}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button> */}
            <div className="header-divider" />
            <div className="profile-container">
              <button
                className="profile-button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
              >
                <span className="avatar">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <span>
                  <strong>{profile.name}</strong>
                  <small>
                    {profile.role === "admin"
                      ? "Head Office Admin"
                      : profile.role === "staff"
                        ? "Branch Staff"
                        : "Branch Manager"}
                  </small>
                </span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <p>DEMO WORKSPACE</p>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProfile(p);
                        setProfileOpen(false);
                        router.push("/dashboard");
                      }}
                    >
                      <span className="small-avatar">
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <span>
                        {p.name}
                        <small>
                          {p.role === "admin"
                            ? "Head Office Admin"
                            : locationName(p.branchId)}
                        </small>
                      </span>
                      {p.id === profile.id && <span className="online-dot" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileOpen(false);
                      try {
                        const supabase = createBrowserSupabaseClient();
                        if (supabase) {
                          await supabase.auth.signOut();
                        }
                        await fetch("/api/auth/logout", {
                          method: "POST",
                          credentials: "include",
                        });
                      } catch {
                        // Ignore logout errors and continue to the login screen.
                      }
                      router.push("/login");
                    }}
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
        <footer className="app-footer">
          <span>© 2026 Brew Coffee. Crafted for better operations.</span>
          <span>
            <span className="online-dot" /> Demo workspace{" "}
            <span className="footer-dot">·</span> Philippine Standard Time
          </span>
        </footer>
      </div>
      {modal && <WorkflowModal type={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
