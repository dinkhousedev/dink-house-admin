import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive") || "true";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Build query params
    const params = new URLSearchParams();
    params.append("select", "*");

    // Apply filters
    if (search) {
      params.append("or", `(email.ilike.*${search}*,first_name.ilike.*${search}*,last_name.ilike.*${search}*)`);
    }

    if (isActive !== "all") {
      if (isActive === "true") {
        params.append("status", `eq.active`);
      } else {
        params.append("status", `neq.active`);
      }
    }

    // Apply sorting
    params.append("order", `${sortBy}.${sortOrder}`);

    // Apply pagination
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/launch_subscribers?${params.toString()}`,
      { headers }
    );

    const data = await response.json();
    const contentRange = response.headers.get("content-range");
    const count = contentRange
      ? parseInt(contentRange.split("/")[1] || "0")
      : 0;

    if (!response.ok) {
      console.error("Database error:", data);
      return NextResponse.json(
        { success: false, error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Subscribers API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    // Check if email already exists
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/launch_subscribers?email=eq.${body.email}&select=id,status`,
      { headers }
    );
    const existing = await checkResponse.json();

    if (existing && existing.length > 0) {
      const existingSubscriber = existing[0];
      if (existingSubscriber.status === "active") {
        return NextResponse.json(
          { success: false, error: "Email already subscribed" },
          { status: 409 }
        );
      } else {
        // Reactivate inactive subscriber
        const reactivateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/launch_subscribers?id=eq.${existingSubscriber.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              status: "active",
              subscribed_at: new Date().toISOString(),
              unsubscribed_at: null,
            }),
          }
        );

        const data = await reactivateResponse.json();

        return NextResponse.json({
          success: true,
          message: "Subscription reactivated successfully",
          data: data[0],
        });
      }
    }

    // Create new subscriber
    const createResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/launch_subscribers`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: body.email,
          first_name: body.firstName,
          last_name: body.lastName,
          source: body.source || "website",
          status: "active",
        }),
      }
    );

    const data = await createResponse.json();

    if (!createResponse.ok) {
      console.error("Database error:", data);
      return NextResponse.json(
        { success: false, error: "Failed to create subscriber" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      data: data[0],
    });
  } catch (error) {
    console.error("Subscribers API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
