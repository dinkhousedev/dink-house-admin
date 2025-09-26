import { NextRequest, NextResponse } from "next/server";
import { getEvents, createEvent, getCourts } from "@/app/session_booking/actions";
import { EventFormData } from "@/types/events";

// GET /api/events - Fetch all events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const result = await getEvents(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0
    });
  } catch (error) {
    console.error("API GET /events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body: EventFormData = await request.json();

    // Basic validation
    if (!body.title || !body.event_type) {
      return NextResponse.json(
        { error: "Title and event type are required" },
        { status: 400 }
      );
    }

    // Get courts if not provided
    if (!body.court_ids || body.court_ids.length === 0) {
      const courtsResult = await getCourts();
      if (courtsResult.success && courtsResult.data) {
        // Assign first available court
        body.court_ids = [courtsResult.data[0]?.id].filter(Boolean);
      }
    }

    const result = await createEvent(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Event created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("API POST /events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}