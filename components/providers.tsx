"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Store, Profile } from "@/types";
import { initialStore } from "@/data/dummy";
import { profiles } from "@/data/dummy/branches";
import { demoRepository } from "@/lib/repository";
import { applyCommand, Command } from "@/lib/operations";
interface AppContext {
  store: Store;
  profile: Profile;
  ready: boolean;
  switchProfile: (p: Profile, remember?: boolean) => void;
  execute: (c: Command) => boolean;
  toast: (text: string) => void;
}
const Context = createContext<AppContext | null>(null);
export function Providers({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(initialStore);
  const [profile, setProfile] = useState(profiles[0]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setStore(demoRepository.load());
    try {
      const id =
        localStorage.getItem("brew-profile") ||
        sessionStorage.getItem("brew-profile");
      setProfile(profiles.find((p) => p.id === id) ?? profiles[0]);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [message]);
  const switchProfile = (p: Profile, remember = true) => {
    setProfile(p);
    try {
      localStorage.removeItem("brew-profile");
      sessionStorage.removeItem("brew-profile");
      (remember ? localStorage : sessionStorage).setItem("brew-profile", p.id);
    } catch {}
  };
  const execute = (c: Command) => {
    try {
      const next = applyCommand(store, profile, c);
      demoRepository.save(next);
      setStore(next);
      setMessage(
        c.type === "read"
          ? "Notifications marked as read."
          : "Changes saved successfully.",
      );
      return true;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save changes.");
      return false;
    }
  };
  return (
    <Context.Provider
      value={{
        store,
        profile,
        ready,
        switchProfile,
        execute,
        toast: setMessage,
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          <span className="toast-dot" />
          {message}
          <button onClick={() => setMessage("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Missing app provider");
  return ctx;
}
