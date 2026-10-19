import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createProxySupabaseClient } from "@/lib/supabase/server";
import { deriveRedirectPath, normalizeRole } from "@/lib/auth";

const protectedRoutes = ["/owner", "/admin", "/branch"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/login" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const protectedRoute = protectedRoutes.find((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const supabase = createProxySupabaseClient(request);

  if (!supabase) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let profile: { role?: string | null } | null = null;

  try {
    const { data } = await supabase
      .from("app_users")
      .select("role")
      .eq("uuid", user.id)
      .maybeSingle();

    profile = data;
  } catch {
    profile = null;
  }

  const role = normalizeRole(profile?.role ?? "branch");

  if (protectedRoute === "/owner" && role !== "owner") {
    return NextResponse.redirect(new URL(deriveRedirectPath(role), request.url));
  }

  if (
    protectedRoute === "/admin" &&
    role !== "admin" &&
    role !== "owner"
  ) {
    return NextResponse.redirect(new URL(deriveRedirectPath(role), request.url));
  }

  if (protectedRoute === "/branch" && role !== "branch") {
    return NextResponse.redirect(new URL(deriveRedirectPath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/admin/:path*", "/branch/:path*"],
};
