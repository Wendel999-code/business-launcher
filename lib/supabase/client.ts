import { createClient } from "@supabase/supabase-js";
/** Call only after replacing the demo repository with authenticated Supabase queries. */
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. The prototype uses the demo repository.",
    );
  return createClient(url, key);
}
