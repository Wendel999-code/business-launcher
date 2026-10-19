import { NextResponse } from "next/server";
import { deriveRedirectPath, getCurrentProfile } from "@/lib/auth-server";

export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json(
      { authenticated: false, role: null, redirectTo: "/login" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    authenticated: true,
    role: profile.role,
    redirectTo: deriveRedirectPath(profile.role),
    email: profile.email,
  });
}
