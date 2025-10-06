"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { EventFormData } from "@/types/events";

// GET: Fetch all events
export async function getEvents(startDate?: Date, endDate?: Date) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("events")
      .select(
        `
        *,
        event_courts (
          court:courts (*)
        )
      `,
      )
      .eq("is_cancelled", false)
      .order("start_time", { ascending: true });

    if (startDate) {
      query = query.gte("start_time", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("end_time", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);

      return { success: false, error: error.message };
    }

    // Transform data to match frontend types
    const events = data?.map((event: any) => ({
      ...event,
      courts:
        event.event_courts?.map((ec: any) => ({
          id: ec.court.id,
          court_number: ec.court.court_number,
          name: ec.court.name,
          surface_type: ec.court.surface_type,
          is_primary: ec.is_primary,
        })) || [],
    }));

    return { success: true, data: events };
  } catch (error) {
    console.error("Error in getEvents:", error);

    return { success: false, error: "Failed to fetch events" };
  }
}

// GET: Fetch single event
export async function getEvent(eventId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_courts (
          court:courts (*),
          is_primary
        ),
        event_registrations (
          id,
          player_name,
          skill_level,
          status
        )
      `,
      )
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event:", error);

      return { success: false, error: error.message };
    }

    // Transform data
    const event = {
      ...data,
      courts:
        data.event_courts?.map((ec: any) => ({
          id: ec.court.id,
          court_number: ec.court.court_number,
          name: ec.court.name,
          surface_type: ec.court.surface_type,
          is_primary: ec.is_primary,
        })) || [],
      registrations: data.event_registrations || [],
    };

    return { success: true, data: event };
  } catch (error) {
    console.error("Error in getEvent:", error);

    return { success: false, error: "Failed to fetch event" };
  }
}

// POST: Create new event
export async function createEvent(formData: EventFormData) {
  const supabase = await createClient();

  try {
    // Start a transaction by creating the event first
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        check_in_time: formData.check_in_time,
        max_capacity: formData.max_capacity,
        min_capacity: formData.min_capacity,
        waitlist_capacity: formData.waitlist_capacity || 5,
        skill_levels: formData.skill_levels,
        member_only: formData.member_only,
        price_member: formData.price_member,
        price_guest: formData.price_guest,
        equipment_provided: formData.equipment_provided,
        special_instructions: formData.special_instructions,
        template_id: formData.template_id,
        staff_notes: formData.staff_notes,
        setup_requirements: formData.setup_requirements,
        instructor_id: formData.instructor_id,
        registration_deadline: formData.registration_deadline,
      })
      .select()
      .single();

    if (eventError) {
      console.error("Error creating event:", eventError);

      return { success: false, error: eventError.message };
    }

    // Assign courts if provided
    if (formData.court_ids && formData.court_ids.length > 0) {
      const courtAssignments = formData.court_ids.map((courtId, index) => ({
        event_id: eventData.id,
        court_id: courtId,
        is_primary: index === 0,
      }));

      const { error: courtsError } = await supabase
        .from("event_courts")
        .insert(courtAssignments);

      if (courtsError) {
        // Rollback by deleting the event
        await supabase
          .schema("events")
          .from("events")
          .delete()
          .eq("id", eventData.id);
        console.error("Error assigning courts:", courtsError);

        return { success: false, error: courtsError.message };
      }
    }

    revalidatePath("/session_booking");

    return { success: true, data: eventData };
  } catch (error) {
    console.error("Error in createEvent:", error);

    return { success: false, error: "Failed to create event" };
  }
}

// PUT: Update event
export async function updateEvent(
  eventId: string,
  updates: Partial<EventFormData>,
) {
  const supabase = await createClient();

  try {
    // Update the event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .update({
        title: updates.title,
        description: updates.description,
        event_type: updates.event_type,
        start_time: updates.start_time,
        end_time: updates.end_time,
        max_capacity: updates.max_capacity,
        min_capacity: updates.min_capacity,
        skill_levels: updates.skill_levels,
        member_only: updates.member_only,
        price_member: updates.price_member,
        price_guest: updates.price_guest,
        equipment_provided: updates.equipment_provided,
        special_instructions: updates.special_instructions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single();

    if (eventError) {
      console.error("Error updating event:", eventError);

      return { success: false, error: eventError.message };
    }

    // Update court assignments if provided
    if (updates.court_ids) {
      // Delete existing assignments
      await supabase.from("event_courts").delete().eq("event_id", eventId);

      // Insert new assignments
      if (updates.court_ids.length > 0) {
        const courtAssignments = updates.court_ids.map((courtId, index) => ({
          event_id: eventId,
          court_id: courtId,
          is_primary: index === 0,
        }));

        const { error: courtsError } = await supabase
          .from("event_courts")
          .insert(courtAssignments);

        if (courtsError) {
          console.error("Error updating courts:", courtsError);

          return { success: false, error: courtsError.message };
        }
      }
    }

    revalidatePath("/session_booking");

    return { success: true, data: eventData };
  } catch (error) {
    console.error("Error in updateEvent:", error);

    return { success: false, error: "Failed to update event" };
  }
}

// DELETE: Delete event
export async function deleteEvent(eventId: string) {
  const supabase = await createClient();

  try {
    // Delete event (cascade will handle related records)
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      console.error("Error deleting event:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/session_booking");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteEvent:", error);

    return { success: false, error: "Failed to delete event" };
  }
}

// Soft DELETE: Cancel event
export async function cancelEvent(eventId: string, reason?: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("events")
      .update({
        is_cancelled: true,
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("Error cancelling event:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/session_booking");

    return { success: true, data };
  } catch (error) {
    console.error("Error in cancelEvent:", error);

    return { success: false, error: "Failed to cancel event" };
  }
}

// GET: Fetch all courts
export async function getCourts() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("courts")
      .select("*")
      .eq("status", "available")
      .order("court_number");

    if (error) {
      console.error("Error fetching courts:", error);

      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getCourts:", error);

    return { success: false, error: "Failed to fetch courts" };
  }
}

// GET: Fetch event templates
export async function getEventTemplates() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("event_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching templates:", error);

      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getEventTemplates:", error);

    return { success: false, error: "Failed to fetch templates" };
  }
}

// GET: Check court availability for a time range
export async function checkCourtAvailability(
  startTime: Date,
  endTime: Date,
  excludeEventId?: string,
) {
  const supabase = await createClient();

  try {
    // Get all courts
    const courtsResult = await getCourts();

    if (!courtsResult.success || !courtsResult.data) {
      return { success: false, error: "Failed to fetch courts" };
    }

    // Get all events that overlap with the requested time range
    let query = supabase
      .from("events")
      .select(
        `
        *,
        event_courts (
          court:courts (*)
        )
      `,
      )
      .eq("is_cancelled", false)
      .lte("start_time", endTime.toISOString())
      .gte("end_time", startTime.toISOString());

    // Exclude specific event if provided (for editing)
    if (excludeEventId) {
      query = query.neq("id", excludeEventId);
    }

    const { data: conflictingEvents, error } = await query;

    if (error) {
      console.error("Error fetching conflicting events:", error);

      return { success: false, error: error.message };
    }

    // Build availability map
    const availability = courtsResult.data.map((court) => {
      const conflicts =
        conflictingEvents
          ?.filter((event: any) =>
            event.event_courts?.some(
              (ec: any) => ec.court.id === court.id,
            ),
          )
          .map((event: any) => ({
            ...event,
            courts:
              event.event_courts?.map((ec: any) => ({
                id: ec.court.id,
                court_number: ec.court.court_number,
                name: ec.court.name,
                surface_type: ec.court.surface_type,
                is_primary: ec.is_primary,
              })) || [],
          })) || [];

      return {
        court,
        available: conflicts.length === 0,
        conflicts,
      };
    });

    return { success: true, data: availability };
  } catch (error) {
    console.error("Error in checkCourtAvailability:", error);

    return { success: false, error: "Failed to check availability" };
  }
}
