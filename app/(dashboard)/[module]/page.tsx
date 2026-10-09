import { notFound } from "next/navigation";
import { ModulePage } from "@/components/modules/module-page";
import { Dashboard } from "@/components/dashboard/dashboard";
import { Suspense } from "react";
import Loading from "../loading";
const modules = [
  "dashboard",
  "sales",
  "inventory",
  "transfers",
  "adjustments",
  "wastage",
  "products",
  "branches",
  "users",
  "sales-reports",
  "inventory-reports",
  "branch-performance",
  "notifications",
  "activity",
  "settings",
  "movements",
];
export function generateStaticParams() {
  return modules.map((module) => ({ module }));
}
export default function Page({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <ModuleContent params={params} />
    </Suspense>
  );
}
async function ModuleContent({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!modules.includes(module)) notFound();
  return module === "dashboard" ? (
    <Dashboard />
  ) : (
    <ModulePage key={module} module={module} />
  );
}
