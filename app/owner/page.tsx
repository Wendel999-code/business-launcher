import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";
import { requireRole } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const profile = await requireRole("owner");

  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
