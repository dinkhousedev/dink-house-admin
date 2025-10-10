"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { EventFormData } from "@/types/events";
import { toCSTString, formatCSTDate } from "@/lib/time-utils";

// GET: Fetch all events
export async function getEvents(
  startDate?: Date | string,
  endDate?: Date | string,
) {
  const supabase = await createClient();

  try {
    let query = supabase
      .schema("events")
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
      .neq("event_type", "dupr_open_play") // Exclude open play - fetched separately from instances
      .order("start_time", { ascending: true });

    console.log("[getEvents] Fetching events with date range:", {
      startDate,
      endDate,
    });

    if (startDate) {
      const startStr =
        typeof startDate === "string" ? startDate : toCSTString(startDate);

      query = query.gte("start_time", startStr);
    }
    if (endDate) {
      const endStr =
        typeof endDate === "string" ? endDate : toCSTString(endDate);

      query = query.lte("end_time", endStr);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      return { success: false, error: error.message };
    }

    console.log("[getEvents] Fetched events count:", data?.length || 0);

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
      .schema("events")
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
      .schema("events")
      .from("events")
      .insert({
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_time: formData.start_time, // Already in CST format from frontend
        end_time: formData.end_time, // Already in CST format from frontend
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
      // Deduplicate court IDs to prevent constraint violations
      const uniqueCourtIds = [...new Set(formData.court_ids)];

      console.log("[createEvent] Court IDs received:", formData.court_ids);
      console.log("[createEvent] Unique court IDs:", uniqueCourtIds);

      const courtAssignments = uniqueCourtIds.map((courtId, index) => ({
        event_id: eventData.id,
        court_id: courtId,
        is_primary: index === 0,
      }));

      const { error: courtsError } = await supabase
        .schema("events")
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
      .schema("events")
      .from("events")
      .update({
        title: updates.title,
        description: updates.description,
        event_type: updates.event_type,
        start_time: updates.start_time, // Already in CST format from frontend
        end_time: updates.end_time, // Already in CST format from frontend
        max_capacity: updates.max_capacity,
        min_capacity: updates.min_capacity,
        skill_levels: updates.skill_levels,
        member_only: updates.member_only,
        price_member: updates.price_member,
        price_guest: updates.price_guest,
        equipment_provided: updates.equipment_provided,
        special_instructions: updates.special_instructions,
        updated_at: toCSTString(new Date()),
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
      // Deduplicate court IDs to prevent constraint violations
      const uniqueCourtIds = [...new Set(updates.court_ids)];

      console.log("[updateEvent] Court IDs received:", updates.court_ids);
      console.log("[updateEvent] Unique court IDs:", uniqueCourtIds);

      // Delete existing assignments and wait for completion
      const {
        data: deleteData,
        error: deleteError,
        count,
      } = await supabase
        .schema("events")
        .from("event_courts")
        .delete()
        .eq("event_id", eventId)
        .select();

      console.log("[updateEvent] Delete operation result:", {
        deletedCount: deleteData?.length || 0,
        count,
        error: deleteError,
      });

      if (deleteError) {
        console.error(
          "Error deleting existing court assignments:",
          deleteError,
        );

        return { success: false, error: deleteError.message };
      }

      // Insert new assignments only after delete completes
      if (uniqueCourtIds.length > 0) {
        const courtAssignments = uniqueCourtIds.map((courtId, index) => ({
          event_id: eventId,
          court_id: courtId,
          is_primary: index === 0,
        }));

        console.log(
          "[updateEvent] Court assignments to insert:",
          courtAssignments,
        );

        const { error: courtsError } = await supabase
          .schema("events")
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
    const { error } = await supabase
      .schema("events")
      .from("events")
      .delete()
      .eq("id", eventId);

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
      .schema("events")
      .from("events")
      .update({
        is_cancelled: true,
        cancellation_reason: reason,
        updated_at: toCSTString(new Date()),
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
      .schema("events")
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
      .schema("events")
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
      .schema("events")
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
      .lte("start_time", toCSTString(endTime))
      .gte("end_time", toCSTString(startTime));

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
            event.event_courts?.some((ec: any) => ec.court.id === court.id),
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

// GET: Fetch weekly open play schedule
export async function getWeeklyOpenPlaySchedule() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("get_weekly_schedule", {
      p_include_inactive: false,
    });

    if (error) {
      console.error("Error fetching weekly schedule:", error);

      return { success: false, error: error.message };
    }

    return { success: true, data: data?.schedule || [] };
  } catch (error) {
    console.error("Error in getWeeklyOpenPlaySchedule:", error);

    return { success: false, error: "Failed to fetch weekly schedule" };
  }
}

// GET: Fetch open play schedule for a specific date
export async function getOpenPlayForDate(date: Date) {
  const supabase = await createClient();

  try {
    // Format date in CST for query
    const dateStr = formatCSTDate(date);

    const { data, error } = await supabase.rpc("get_schedule_for_date", {
      p_date: dateStr,
    });

    if (error) {
      console.error("Error fetching schedule for date:", error);

      return { success: false, error: error.message };
    }

    return { success: true, data: data?.sessions || [] };
  } catch (error) {
    console.error("Error in getOpenPlayForDate:", error);

    return { success: false, error: "Failed to fetch schedule for date" };
  }
}

// GET: Fetch open play instances for a date range (for calendar display)
export async function getOpenPlayInstances(
  startDate: Date | string,
  endDate: Date | string,
) {
  const supabase = await createClient();

  try {
    // Format dates as YYYY-MM-DD without timezone conversion
    const formatDateLocal = (date: Date | string) => {
      if (typeof date === "string") {
        // Already a string, extract YYYY-MM-DD
        return date.split("T")[0];
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDateLocal(startDate);
    const endDateStr = formatDateLocal(endDate);

    const { data, error } = await supabase
      .schema("events")
      .from("open_play_instances")
      .select(
        `
        *,
        schedule_block:open_play_schedule_blocks (
          id,
          name,
          description,
          session_type,
          special_event_name,
          price_member,
          price_guest,
          dedicated_skill_label,
          day_of_week,
          start_time,
          end_time,
          court_allocations:open_play_court_allocations (
            court_id,
            skill_level_label,
            skill_level_min,
            skill_level_max,
            court:courts (
              id,
              court_number,
              name
            )
          )
        )
      `,
      )
      .gte("instance_date", startDateStr)
      .lte("instance_date", endDateStr)
      .eq("is_cancelled", false)
      .order("start_time");

    if (error) {
      console.error("Error fetching open play instances:", error);

      return { success: false, error: error.message };
    }

    // Transform to match calendar event format
    // NOTE: Using schedule_block times as source of truth instead of denormalized instance times
    // This ensures calendar always displays current times after schedule block edits
    const instances = data?.map((instance: any) => {
      const scheduleStartTime = instance.schedule_block?.start_time;
      const scheduleEndTime = instance.schedule_block?.end_time;

      // Build full ISO timestamps using instance date + schedule block times
      let startTime = instance.start_time;
      let endTime = instance.end_time;

      if (scheduleStartTime && scheduleEndTime) {
        // Construct ISO strings in Central Time
        // Database times are TIME fields (e.g., '17:00:00'), combine with date for full timestamp
        // Format: YYYY-MM-DDTHH:MM:SS-05:00 (CDT offset - Central Daylight Time)
        startTime = `${instance.instance_date}T${scheduleStartTime}-05:00`;
        endTime = `${instance.instance_date}T${scheduleEndTime}-05:00`;
      }

      return {
        id: instance.id,
        schedule_block_id: instance.schedule_block_id,
        instance_date: instance.instance_date,
        title: instance.schedule_block?.name || "Open Play",
        description: instance.schedule_block?.description,
        event_type: "open_play",
        session_type: instance.schedule_block?.session_type,
        special_event_name: instance.schedule_block?.special_event_name,
        start_time: startTime,
        end_time: endTime,
        price_member: instance.schedule_block?.price_member || 0,
        price_guest: instance.schedule_block?.price_guest || 0,
        dedicated_skill_label: instance.schedule_block?.dedicated_skill_label,
        day_of_week: instance.schedule_block?.day_of_week,
        courts:
          instance.schedule_block?.court_allocations?.map((ca: any) => ({
            id: ca.court?.id,
            court_number: ca.court?.court_number,
            name: ca.court?.name,
            skill_level_label: ca.skill_level_label,
            skill_level_min: ca.skill_level_min,
            skill_level_max: ca.skill_level_max,
          })) || [],
        is_open_play: true,
        is_cancelled: false,
      };
    });

    console.log(
      "[getOpenPlayInstances] Loaded instances:",
      instances?.length || 0,
    );

    return { success: true, data: instances || [] };
  } catch (error) {
    console.error("Error in getOpenPlayInstances:", error);

    return { success: false, error: "Failed to fetch open play instances" };
  }
}

// PUT: Update schedule block (affects all future instances)
export async function updateScheduleBlock(
  blockId: string,
  updates: {
    name?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    price_member?: number;
    price_guest?: number;
    max_capacity?: number;
    special_instructions?: string;
  },
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("update_schedule_block", {
      p_block_id: blockId,
      p_updates: updates,
    });

    if (error) {
      console.error("Error updating schedule block:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateScheduleBlock:", error);

    return { success: false, error: "Failed to update schedule block" };
  }
}

// DELETE: Delete schedule block (removes entire series)
export async function deleteScheduleBlock(blockId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("delete_schedule_block", {
      p_block_id: blockId,
    });

    if (error) {
      console.error("Error deleting schedule block:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data };
  } catch (error) {
    console.error("Error in deleteScheduleBlock:", error);

    return { success: false, error: "Failed to delete schedule block" };
  }
}

// POST: Create schedule override (one-off change to specific instance)
export async function createScheduleOverride(
  blockId: string,
  overrideDate: string,
  isCancelled: boolean,
  reason: string,
  replacementDetails?: {
    name?: string;
    start_time?: string;
    end_time?: string;
    session_type?: string;
    special_instructions?: string;
  },
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("create_schedule_override", {
      p_block_id: blockId,
      p_override_date: overrideDate,
      p_is_cancelled: isCancelled,
      p_reason: reason,
      p_replacement_details: replacementDetails || null,
    });

    if (error) {
      console.error("Error creating schedule override:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data };
  } catch (error) {
    console.error("Error in createScheduleOverride:", error);

    return { success: false, error: "Failed to create schedule override" };
  }
}

// GET: Fetch single schedule block details
export async function getScheduleBlock(blockId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("open_play_schedule_blocks")
      .select(
        `
        *,
        court_allocations:open_play_court_allocations (
          id,
          court_id,
          skill_level_min,
          skill_level_max,
          skill_level_label,
          is_mixed_level,
          sort_order,
          court:courts (
            id,
            court_number,
            name
          )
        )
      `,
      )
      .eq("id", blockId)
      .single();

    if (error) {
      console.error("Error fetching schedule block:", error);

      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getScheduleBlock:", error);

    return { success: false, error: "Failed to fetch schedule block" };
  }
}

// PUT: Toggle schedule block active status
export async function toggleScheduleBlockStatus(
  blockId: string,
  isActive: boolean,
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("open_play_schedule_blocks")
      .update({ is_active: isActive })
      .eq("id", blockId)
      .select()
      .single();

    if (error) {
      console.error("Error toggling schedule block status:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");
    revalidatePath("/dashboard/open-play-playground");

    return { success: true, data };
  } catch (error) {
    console.error("Error in toggleScheduleBlockStatus:", error);

    return { success: false, error: "Failed to toggle schedule block status" };
  }
}

// POST: Clone schedule block to a different day
export async function cloneScheduleBlock(
  blockId: string,
  targetDayOfWeek: number,
) {
  const supabase = await createClient();

  try {
    // Fetch the original block
    const { data: originalBlock, error: fetchError } = await supabase
      .schema("events")
      .from("open_play_schedule_blocks")
      .select(
        `
        *,
        court_allocations:open_play_court_allocations (
          court_id,
          skill_level_min,
          skill_level_max,
          skill_level_label,
          is_mixed_level,
          sort_order
        )
      `,
      )
      .eq("id", blockId)
      .single();

    if (fetchError) {
      console.error("Error fetching original block:", fetchError);

      return { success: false, error: fetchError.message };
    }

    // Create new block with the same properties but different day
    const { data: newBlock, error: createError } = await supabase
      .schema("events")
      .from("open_play_schedule_blocks")
      .insert({
        name: originalBlock.name,
        description: originalBlock.description,
        day_of_week: targetDayOfWeek,
        start_time: originalBlock.start_time,
        end_time: originalBlock.end_time,
        session_type: originalBlock.session_type,
        dedicated_skill_label: originalBlock.dedicated_skill_label,
        special_event_name: originalBlock.special_event_name,
        price_member: originalBlock.price_member,
        price_guest: originalBlock.price_guest,
        max_capacity: originalBlock.max_capacity,
        special_instructions: originalBlock.special_instructions,
        is_active: originalBlock.is_active,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating cloned block:", createError);

      return { success: false, error: createError.message };
    }

    // Clone court allocations if they exist
    if (
      originalBlock.court_allocations &&
      originalBlock.court_allocations.length > 0
    ) {
      const courtAllocations = originalBlock.court_allocations.map(
        (ca: any) => ({
          schedule_block_id: newBlock.id,
          court_id: ca.court_id,
          skill_level_min: ca.skill_level_min,
          skill_level_max: ca.skill_level_max,
          skill_level_label: ca.skill_level_label,
          is_mixed_level: ca.is_mixed_level,
          sort_order: ca.sort_order,
        }),
      );

      const { error: allocError } = await supabase
        .schema("events")
        .from("open_play_court_allocations")
        .insert(courtAllocations);

      if (allocError) {
        console.error("Error cloning court allocations:", allocError);
        // Rollback - delete the created block
        await supabase
          .schema("events")
          .from("open_play_schedule_blocks")
          .delete()
          .eq("id", newBlock.id);

        return { success: false, error: allocError.message };
      }
    }

    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");
    revalidatePath("/dashboard/open-play-playground");

    return { success: true, data: newBlock };
  } catch (error) {
    console.error("Error in cloneScheduleBlock:", error);

    return { success: false, error: "Failed to clone schedule block" };
  }
}

// PUT: Update event time (for drag-and-drop)
export async function updateEventTime(
  eventId: string,
  newStartTime: string,
  newEndTime: string,
  isOpenPlay: boolean = false,
) {
  const supabase = await createClient();

  try {
    // Handle open play instances differently
    if (isOpenPlay) {
      // For open play instances, we need to update the instance in open_play_instances
      // Note: open_play_instances doesn't have updated_at column
      // We use count instead of select to avoid permission issues with related tables
      const { error, count } = await supabase
        .schema("events")
        .from("open_play_instances")
        .update({
          start_time: newStartTime,
          end_time: newEndTime,
        })
        .eq("id", eventId);

      if (error) {
        console.error("Error updating open play instance time:", error);

        return { success: false, error: error.message };
      }

      if (count === 0) {
        return {
          success: false,
          error: "Open play instance not found or could not be updated",
        };
      }

      revalidatePath("/dashboard/session_booking");

      return {
        success: true,
        data: { id: eventId, start_time: newStartTime, end_time: newEndTime },
      };
    }

    // Handle regular events
    const { data, error } = await supabase
      .schema("events")
      .from("events")
      .update({
        start_time: newStartTime, // Already in CST format from drag-drop handler
        end_time: newEndTime, // Already in CST format from drag-drop handler
        updated_at: toCSTString(new Date()),
      })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("Error updating event time:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/session_booking");

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateEventTime:", error);

    return { success: false, error: "Failed to update event time" };
  }
}
