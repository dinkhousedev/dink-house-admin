import { createClient } from "@supabase/supabase-js";

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Refreshes Supabase authentication tokens using a refresh token
 * @param refreshToken - The refresh token from cookies
 * @returns RefreshResult with new tokens or error
 */
export async function refreshAuthTokens(
  refreshToken: string,
): Promise<RefreshResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: "Supabase configuration missing",
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return {
        success: false,
        error: error?.message || "Failed to refresh session",
      };
    }

    return {
      success: true,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token || refreshToken,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cookie options for session tokens (1 hour expiry)
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60, // 1 hour (match JWT expiry)
  path: "/",
};

/**
 * Cookie options for refresh tokens (7 days expiry)
 */
export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};
