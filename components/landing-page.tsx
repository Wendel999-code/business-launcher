"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  ChartColumn,
  Coffee,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Brand } from "@/components/ui";

const capabilities = [
  {
    icon: ChartColumn,
    label: "Sales Monitoring",
    text: "Track branch performance, revenue, and operational trends in real time.",
  },
  {
    icon: PackageCheck,
    label: "Inventory Tracking",
    text: "Monitor stock levels, reorder signals and product movement across locations.",
  },
  {
    icon: Building2,
    label: "Branch Management",
    text: "Coordinate head office and branch workflows with a shared operations view.",
  },
  {
    icon: Truck,
    label: "Stock Distribution",
    text: "Align transfers and deliveries between central inventory and branch operations.",
  },
  {
    icon: ShieldCheck,
    label: "Centralized Operations",
    text: "Keep approvals, oversight, and reporting consistent across the Brew Coffee network.",
  },
];

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Brand />
          <Link href="/login" className="button secondary landing-login-button">
            Login
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <motion.section
          className="landing-hero"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="landing-copy">
            <span className="eyebrow">Brew Coffee operations</span>
            <h1>
              One coffee network.
              <br />
              One operational rhythm.
            </h1>
            <p>
              Brew Coffee brings head office and branch teams together with a
              centralized view of sales, stock, fulfillment, and daily operational
              performance.
            </p>
            <div className="landing-actions">
              <Link href="/login" className="button primary">
                Sign in
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <motion.div
            className="landing-panel"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}
          >
            <div className="landing-panel-header">
              <span className="landing-badge">
                <Coffee size={15} />
                Centralized view
              </span>
            </div>
            <div className="landing-panel-grid">
              <div>
                <strong>12.4k</strong>
                <span>Monthly sales</span>
              </div>
              <div>
                <strong>96.2%</strong>
                <span>Inventory readiness</span>
              </div>
              <div>
                <strong>3</strong>
                <span>Active branches</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Operations oversight</span>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          className="landing-capabilities"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <div className="landing-section-heading">
            <span className="eyebrow">Core capabilities</span>
            <h2>Built for thoughtful operations.</h2>
          </div>
          <div className="landing-capability-grid">
            {capabilities.map(({ icon: Icon, label, text }) => (
              <article key={label} className="landing-card">
                <span className="landing-card-icon">
                  <Icon size={18} />
                </span>
                <h3>{label}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </motion.section>
      </main>

      <footer className="landing-footer">
        <span>© 2026 Brew Coffee</span>
        <span>Head office and branch operations, aligned.</span>
      </footer>
    </div>
  );
}
