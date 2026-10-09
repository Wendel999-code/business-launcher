import { BranchDetails } from "@/components/modules/branches-page";
import { Suspense } from "react";
import Loading from "../../loading";
export function generateStaticParams() {
  return ["downtown", "riverside", "uptown"].map((id) => ({ id }));
}
export default function BranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <BranchContent params={params} />
    </Suspense>
  );
}
async function BranchContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BranchDetails id={id} />;
}
