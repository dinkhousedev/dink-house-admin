import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  try {
    // Create SSR client for proper session handling
    const supabase = await createClient();

    // Exchange the code for a session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError);
      return NextResponse.redirect(
        `${origin}/auth/login?error=auth_failed`,
      );
    }

    if (!sessionData.session || !sessionData.user) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=no_session`,
      );
    }

    const { session, user } = sessionData;

    // Create service client for database queries
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    );

    // Get employee data from database - try by auth_id first, then by email
    let { data: employeeData, error: employeeError } = await serviceClient
      .from("employees")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    // If not found by auth_id, try by email and link the account
    if (employeeError || !employeeData) {
      const { data: employeeByEmail, error: emailError } = await serviceClient
        .from("employees")
        .select("*")
        .eq("email", user.email)
        .eq("is_active", true)
        .single();

      if (emailError || !employeeByEmail) {
        console.error("Error fetching employee:", emailError || "Not found");
        return NextResponse.redirect(
          `${origin}/auth/login?error=employee_not_found`,
        );
      }

      // Link the auth_id to the employee record
      const { data: updatedEmployee, error: updateError } = await serviceClient
        .from("employees")
        .update({ auth_id: user.id })
        .eq("id", employeeByEmail.id)
        .select()
        .single();

      if (updateError || !updatedEmployee) {
        console.error("Error linking employee:", updateError);
        return NextResponse.redirect(
          `${origin}/auth/login?error=link_failed`,
        );
      }

      employeeData = updatedEmployee;
    }

    const userRole = employeeData.role || "employee";

    // Set session cookies
    const cookieStore = await cookies();

    cookieStore.set("session_token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    cookieStore.set("refresh_token", session.refresh_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    cookieStore.set("user_role", userRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Redirect based on role
    if (["super_admin", "admin", "manager"].includes(userRole)) {
      return NextResponse.redirect(`${origin}/`);
    } else {
      return NextResponse.redirect(`${origin}/employee/dashboard`);
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${origin}/auth/login?error=unexpected_error`,
    );
  }
}
