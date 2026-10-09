"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Store, Profile } from "@/types";
import { emptyStore } from "@/data/initial-state";
import { profiles } from "@/data/dummy/branches";
import { demoRepository, STORAGE_KEY } from "@/lib/repository";
import { Command } from "@/lib/operations";
import { resolveLocation } from "@/lib/storage-migrations";
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
  const [store, setStore] = useState(emptyStore);
  const [profile, setProfile] = useState(profiles[0]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const restore = setTimeout(() => {
      try {
        setStore(demoRepository.load());
      } catch (e) {
        setMessage(
          e instanceof Error ? e.message : "Unable to read workspace storage.",
        );
      }
      try {
        const id =
          localStorage.getItem("brew-profile") ||
          sessionStorage.getItem("brew-profile");
        setProfile(
          profiles.find((p) => p.id === (id ? resolveLocation(id) : id)) ??
            profiles[0],
        );
      } catch {}
      setReady(true);
    }, 0);
    const refresh = () => {
      try {
        setStore(demoRepository.load());
      } catch (e) {
        setMessage(
          e instanceof Error
            ? e.message
            : "Unable to refresh workspace storage.",
        );
      }
    };
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(restore);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", refresh);
    };
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
      if (!ready)
        throw new Error("Please wait for your saved workspace to load.");
      const next = demoRepository.commit(profile, c);
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
