import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the currently authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch employee data
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (employeeError) {
      console.error("Error fetching employee:", employeeError);

      return NextResponse.json(
        { error: "Failed to fetch employee data" },
        { status: 500 },
      );
    }

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Fetch employee profile if exists
    const { data: profile } = await supabase
      .from("employee_profiles")
      .select("*")
      .eq("employee_id", employee.id)
      .single();

    return NextResponse.json({
      success: true,
      employee,
      profile,
    });
  } catch (error) {
    console.error("Employee API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get the currently authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch employee to verify ownership
    const { data: employee, error: fetchError } = await supabase
      .from("employees")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (fetchError || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Update employee data
    const { data: updatedEmployee, error: updateError } = await supabase
      .from("employees")
      .update({
        first_name: body.first_name ?? employee.first_name,
        middle_name: body.middle_name ?? employee.middle_name,
        last_name: body.last_name ?? employee.last_name,
        phone: body.phone ?? employee.phone,
        position_title: body.position_title ?? employee.position_title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employee.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating employee:", updateError);

      return NextResponse.json(
        { error: "Failed to update employee data" },
        { status: 500 },
      );
    }

    // Update profile if provided
    if (body.profile) {
      const { error: profileError } = await supabase
        .from("employee_profiles")
        .upsert({
          employee_id: employee.id,
          ...body.profile,
          updated_at: new Date().toISOString(),
        })
        .eq("employee_id", employee.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }
    }

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Employee update error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
