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
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { deriveRedirectPath, normalizeRole } from "@/lib/auth";

export function Login() {
  const { toast } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("admin@brewcoffee.ph");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Your email or password is incorrect. Please try again.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/profile", {
        credentials: "include",
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.role) {
        await supabase.auth.signOut();
        setError("This account is not authorized for Brew Coffee access.");
        setLoading(false);
        return;
      }

      const role = normalizeRole(payload.role);
      toast("Signed in securely with Supabase Auth.");
      router.push(deriveRedirectPath(role));
    } catch {
      setError("We could not complete the login request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        <form onSubmit={handleSubmit}>
          <span className="login-coffee">
            <Coffee size={28} />
          </span>
          <h2>Welcome back.</h2>
          <p>Secure sign in for your Brew Coffee workspace.</p>
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
              End-to-end authentication with Supabase.
              <br />
              Trusted role-based access for every workspace.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
