import { redirect } from "next/navigation";
import { Login } from "@/components/login";
import { deriveRedirectPath, getCurrentProfile } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(deriveRedirectPath(profile.role));
  }

  return <Login />;
}
