import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    // If no session token, return unauthorized immediately
    if (!sessionToken?.value) {
      return NextResponse.json(
        { error: "Unauthorized - No session token", success: false },
        { status: 401 }
      );
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase configuration missing");
      return NextResponse.json(
        { error: "Authentication service not configured", success: false },
        { status: 500 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify the session with Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(
      sessionToken.value
    );

    if (authError || !authUser) {
      console.error("Error verifying session:", authError);
      return NextResponse.json(
        { error: "Invalid session", success: false },
        { status: 401 }
      );
    }

    // Get employee data from database
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, email, first_name, last_name, role, is_active, auth_id")
      .eq("auth_id", authUser.id)
      .eq("is_active", true)
      .single();

    if (employeeError || !employee) {
      console.error("Error getting employee:", employeeError);
      return NextResponse.json(
        { error: "Employee not found", success: false },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        email: employee.email,
        name: `${employee.first_name} ${employee.last_name}`.trim(),
        role: employee.role,
        auth_id: employee.auth_id,
      },
    });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}