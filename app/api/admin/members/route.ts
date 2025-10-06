import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || null;
    const duprStatus = searchParams.get("dupr_status") || null;
    const membershipLevel = searchParams.get("membership_level") || null;

    // Call the admin function
    const { data, error } = await supabase.rpc("get_all_members", {
      p_page: page,
      p_page_size: 20,
      p_search: search,
      p_dupr_status: duprStatus,
      p_membership_level: membershipLevel,
    });

    if (error) {
      console.error("Error fetching members:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Exception in GET /api/admin/members:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
