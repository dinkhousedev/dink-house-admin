import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        redirectTo: process.env.NEXT_PUBLIC_REDIRECT_URL || process.env.NEXT_PUBLIC_APP_URL,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'Accept': 'application/json',
        },
      },
    }
  );
}
