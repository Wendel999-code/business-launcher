import { AppShell } from "@/components/layout/app-shell";
import { Suspense } from "react";
import Loading from "./loading";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="content">
          <Loading />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
