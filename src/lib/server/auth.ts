import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedSupabase() {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { supabase, user };
}
