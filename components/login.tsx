"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Coffee,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/ui";
import { useApp } from "@/components/providers";
import { profiles, locationName } from "@/data/dummy/branches";
export function Login() {
  const { switchProfile, toast } = useApp();
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState(profiles[0].email);
  const [password, setPassword] = useState("brew2026");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="login-page">
      <div className="login-story">
        <Brand />
        <div className="login-art">
          <Coffee size={160} strokeWidth={0.7} />
          <span className="login-ring ring-one" />
          <span className="login-ring ring-two" />
        </div>
        <div className="login-story-copy">
          <div className="eyebrow">GOOD COFFEE. BETTER OPERATIONS.</div>
          <h1>
            Every great day
            <br />
            starts with a<br />
            <em>better brew.</em>
          </h1>
          <p>
            One head office. Three branches.
            <br />
            Everything you need, in one thoughtful workspace.
          </p>
        </div>
        <small>© 2026 Brew Coffee</small>
      </div>
      <div className="login-form-side">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const p = profiles.find(
              (p) => p.email.toLowerCase() === email.toLowerCase(),
            );
            if (!p || password !== "brew2026") {
              setError("Use a sample account and the demo password: brew2026.");
              return;
            }
            setLoading(true);
            await new Promise((r) => setTimeout(r, 500));
            switchProfile(p, remember);
            router.push("/dashboard");
          }}
        >
          <span className="login-coffee">
            <Coffee size={28} />
          </span>
          <h2>Welcome back.</h2>
          <p>A fresh start to a well-run day.</p>
          <label>
            Demo workspace
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setEmail(profiles.find((p) => p.id === e.target.value)!.email);
                setPassword("brew2026");
              }}
            >
              {profiles.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.role === "admin"
                    ? "Head Office Admin"
                    : `${locationName(p.branchId)} · ${p.role === "staff" ? "Staff" : "Manager"}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <div className="password-input">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <div className="login-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />{" "}
              Remember me
            </label>
            <button
              className="text-link"
              type="button"
              onClick={() =>
                toast(
                  "Demo password: brew2026. Password recovery will be available with Supabase authentication.",
                )
              }
            >
              Forgot password?
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full" disabled={loading}>
            {loading ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <>
                Sign in to your workspace <ArrowRight size={17} />
              </>
            )}
          </button>
          <div className="login-demo">
            <ShieldCheck size={16} />
            <span>
              You're exploring a demo workspace.
              <br />
              Sample data. Real possibilities.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
