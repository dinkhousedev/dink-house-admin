import { NextRequest, NextResponse } from "next/server";
import { getEvent, updateEvent, deleteEvent, cancelEvent } from "@/app/session_booking/actions";
import { EventFormData } from "@/types/events";

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getEvent(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error(`API GET /events/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: Partial<EventFormData> = await request.json();

    const result = await updateEvent(params.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Event updated successfully"
    });
  } catch (error) {
    console.error(`API PUT /events/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for soft delete (cancel) via query param
    const searchParams = request.nextUrl.searchParams;
    const cancel = searchParams.get("cancel") === "true";
    const reason = searchParams.get("reason");

    let result;
    if (cancel) {
      result = await cancelEvent(params.id, reason || undefined);
    } else {
      result = await deleteEvent(params.id);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: cancel ? "Event cancelled successfully" : "Event deleted successfully"
    });
  } catch (error) {
    console.error(`API DELETE /events/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}