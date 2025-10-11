"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// GET: Fetch all recurring events (schedule blocks) with court allocations
export async function getAllScheduleBlocks(includeInactive = false) {
  const supabase = await createClient();

  try {
    console.log(
      "[getAllScheduleBlocks] Starting query, includeInactive:",
      includeInactive,
    );

    // Query events table where is_recurring = true
    let query = supabase
      .schema("events")
      .from("events")
      .select("*")
      .eq("is_recurring", true)
      .order("start_time");

    if (!includeInactive) {
      console.log("[getAllScheduleBlocks] Filtering by is_published = true");
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "[getAllScheduleBlocks] Error fetching recurring events:",
        error,
      );

      return { success: false, error: error.message };
    }

    // Transform data to match expected format
    const blocks = data?.map((event) => ({
      id: event.id,
      name: event.title,
      description: event.description,
      day_of_week: event.recurrence_pattern?.day_of_week,
      start_time: event.recurrence_pattern?.start_time,
      end_time: event.recurrence_pattern?.end_time,
      session_type: event.session_type,
      special_event_name: event.special_event_name,
      dedicated_skill_label: event.dedicated_skill_label,
      price_member: event.price_member,
      price_guest: event.price_guest,
      max_capacity: event.max_capacity,
      special_instructions: event.special_instructions,
      is_active: event.is_published,
      effective_from: event.effective_from,
      effective_until: event.effective_until,
      court_allocations: event.court_allocations || [],
      created_at: event.created_at,
      updated_at: event.updated_at,
    }));

    console.log(
      "[getAllScheduleBlocks] Query successful. Returned blocks:",
      blocks?.length || 0,
    );

    return { success: true, data: blocks || [] };
  } catch (error) {
    console.error("Error in getAllScheduleBlocks:", error);

    return { success: false, error: "Failed to fetch schedule blocks" };
  }
}

// POST: Create new recurring event (schedule block) with court allocations
export async function createScheduleBlock(formData: {
  name: string;
  description?: string;
  days_of_week: number[]; // Array for multi-day support
  start_time: string;
  end_time: string;
  session_type: string;
  special_event_name?: string;
  dedicated_skill_min?: number;
  dedicated_skill_max?: number;
  dedicated_skill_label?: string;
  price_member: number;
  price_guest: number;
  max_capacity?: number;
  special_instructions?: string;
  effective_from: string;
  effective_until: string;
  court_allocations: Array<{
    court_id: string;
    court_number?: number;
    skill_level_min: number;
    skill_level_max?: number;
    skill_level_label: string;
    is_mixed_level?: boolean;
    sort_order?: number;
  }>;
}) {
  const supabase = await createClient();

  try {
    console.log("[createScheduleBlock] Creating recurring events with data:", {
      name: formData.name,
      days_of_week: formData.days_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      session_type: formData.session_type,
      court_allocations_count: formData.court_allocations?.length || 0,
      effective_from: formData.effective_from,
      effective_until: formData.effective_until,
    });

    // Check for scheduling conflicts before creating
    const conflictCheck = await checkScheduleConflicts({
      days_of_week: formData.days_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      effective_from: formData.effective_from,
      effective_until: formData.effective_until,
      court_allocations: formData.court_allocations,
    });

    if (!conflictCheck.success) {
      return {
        success: false,
        error: `Conflict check failed: ${conflictCheck.error}`,
      };
    }

    if (conflictCheck.has_conflicts) {
      // Build detailed error message
      const conflictDetails = conflictCheck.conflicts
        ?.map((conflict) => {
          const dayName = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ][conflict.day_of_week];
          const eventNames = conflict.conflicting_events
            .map((e) => `"${e.title}"`)
            .join(", ");

          return `${dayName}: ${eventNames}`;
        })
        .join("; ");

      console.log(
        "[createScheduleBlock] Conflicts detected, blocking creation:",
        conflictDetails,
      );

      return {
        success: false,
        error: `Scheduling conflict detected. The following events overlap with your selected time/courts: ${conflictDetails}`,
        conflicts: conflictCheck.conflicts,
      };
    }

    const createdEvents = [];

    // Create one recurring event for each day of week
    for (const dayOfWeek of formData.days_of_week) {
      // Calculate next occurrence of this day of week
      const today = new Date();
      const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
      const nextOccurrence = new Date(today);

      nextOccurrence.setDate(today.getDate() + daysUntilTarget);

      // Parse time components
      const [startHour, startMinute] = formData.start_time
        .split(":")
        .map(Number);
      const [endHour, endMinute] = formData.end_time.split(":").map(Number);

      // Set start time
      const startDateTime = new Date(nextOccurrence);

      startDateTime.setHours(startHour, startMinute, 0, 0);

      // Set end time
      const endDateTime = new Date(nextOccurrence);

      endDateTime.setHours(endHour, endMinute, 0, 0);

      // Build recurrence pattern
      const recurrencePattern = {
        day_of_week: dayOfWeek,
        start_time: formData.start_time,
        end_time: formData.end_time,
        effective_from: formData.effective_from,
        effective_until: formData.effective_until,
      };

      // Enrich court allocations with court numbers
      const enrichedAllocations = await Promise.all(
        formData.court_allocations.map(async (alloc) => {
          if (!alloc.court_number) {
            const { data: court } = await supabase
              .schema("events")
              .from("courts")
              .select("court_number")
              .eq("id", alloc.court_id)
              .single();

            return {
              ...alloc,
              court_number: court?.court_number || 0,
            };
          }

          return alloc;
        }),
      );

      // Insert recurring event
      const { data, error } = await supabase
        .schema("events")
        .from("events")
        .insert({
          title: formData.name,
          description: formData.description,
          event_type: "event_scramble", // Default, can be changed
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          max_capacity: formData.max_capacity || 20,
          price_member: formData.price_member,
          price_guest: formData.price_guest,
          special_instructions: formData.special_instructions,
          is_recurring: true,
          recurrence_pattern: recurrencePattern,
          session_type: formData.session_type,
          special_event_name: formData.special_event_name,
          dedicated_skill_label: formData.dedicated_skill_label,
          court_allocations: enrichedAllocations,
          player_registrations: [],
          effective_from: formData.effective_from,
          effective_until: formData.effective_until,
          is_published: true,
          is_cancelled: false,
        })
        .select()
        .single();

      if (error) {
        console.error(
          `[createScheduleBlock] Error creating event for day ${dayOfWeek}:`,
          error,
        );

        return { success: false, error: error.message };
      }

      createdEvents.push(data);

      // TODO: Generate instances for this recurring event
      // This would call a function to create open_play_instances rows
      console.log(`[createScheduleBlock] Created recurring event: ${data.id}`);
    }

    revalidatePath("/dashboard/open-play-playground");
    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data: createdEvents };
  } catch (error) {
    console.error("Error in createScheduleBlock:", error);

    return { success: false, error: "Failed to create schedule blocks" };
  }
}

// PUT: Toggle recurring event active status
export async function toggleScheduleBlockStatus(
  blockId: string,
  isActive: boolean,
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("events")
      .update({
        is_published: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", blockId)
      .eq("is_recurring", true)
      .select()
      .single();

    if (error) {
      console.error("Error toggling recurring event status:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/open-play-playground");
    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data };
  } catch (error) {
    console.error("Error in toggleScheduleBlockStatus:", error);

    return { success: false, error: "Failed to toggle schedule block status" };
  }
}

// POST: Clone recurring event to another day
export async function cloneScheduleBlock(
  blockId: string,
  targetDayOfWeek: number,
  newStartTime?: string,
) {
  const supabase = await createClient();

  try {
    // Fetch the original recurring event
    const { data: originalBlock, error: fetchError } = await supabase
      .schema("events")
      .from("events")
      .select("*")
      .eq("id", blockId)
      .eq("is_recurring", true)
      .single();

    if (fetchError || !originalBlock) {
      return { success: false, error: "Failed to fetch original block" };
    }

    // Extract data from original block
    const startTime =
      newStartTime || originalBlock.recurrence_pattern?.start_time;
    const endTime = originalBlock.recurrence_pattern?.end_time;

    // Create new recurring event with same settings but different day
    const result = await createScheduleBlock({
      name: `${originalBlock.title} (Copy)`,
      description: originalBlock.description,
      days_of_week: [targetDayOfWeek],
      start_time: startTime,
      end_time: endTime,
      session_type: originalBlock.session_type,
      special_event_name: originalBlock.special_event_name,
      dedicated_skill_label: originalBlock.dedicated_skill_label,
      price_member: originalBlock.price_member,
      price_guest: originalBlock.price_guest,
      max_capacity: originalBlock.max_capacity,
      special_instructions: originalBlock.special_instructions,
      effective_from: new Date().toISOString().split("T")[0],
      effective_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      court_allocations: originalBlock.court_allocations || [],
    });

    return result;
  } catch (error) {
    console.error("Error in cloneScheduleBlock:", error);

    return { success: false, error: "Failed to clone schedule block" };
  }
}

// POST: Bulk activate/deactivate recurring events
export async function bulkToggleScheduleBlocks(
  blockIds: string[],
  isActive: boolean,
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("events")
      .update({
        is_published: isActive,
        updated_at: new Date().toISOString(),
      })
      .in("id", blockIds)
      .eq("is_recurring", true)
      .select();

    if (error) {
      console.error("Error bulk toggling recurring events:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/open-play-playground");
    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data };
  } catch (error) {
    console.error("Error in bulkToggleScheduleBlocks:", error);

    return { success: false, error: "Failed to bulk toggle schedule blocks" };
  }
}

// POST: Create date range override for recurring events
export async function createDateRangeOverride(
  blockIds: string[],
  startDate: string,
  endDate: string,
  isCancelled: boolean,
  reason: string,
) {
  const supabase = await createClient();

  try {
    const results = [];

    // Get all dates in the range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }

    // Create override for each block and each date
    for (const blockId of blockIds) {
      for (const date of dates) {
        // Update or create instances with cancellation
        const { data, error } = await supabase
          .schema("events")
          .from("open_play_instances")
          .update({
            is_cancelled: isCancelled,
          })
          .eq("schedule_block_id", blockId)
          .eq("instance_date", date)
          .select();

        if (error) {
          console.error(
            `Error creating override for ${blockId} on ${date}:`,
            error,
          );
        } else {
          results.push(data);
        }
      }
    }

    revalidatePath("/dashboard/open-play-playground");
    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data: results };
  } catch (error) {
    console.error("Error in createDateRangeOverride:", error);

    return { success: false, error: "Failed to create date range override" };
  }
}

// DELETE: Bulk delete recurring events
export async function bulkDeleteScheduleBlocks(blockIds: string[]) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("events")
      .delete()
      .in("id", blockIds)
      .eq("is_recurring", true);

    if (error) {
      console.error("Error bulk deleting recurring events:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/open-play-playground");
    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data };
  } catch (error) {
    console.error("Error in bulkDeleteScheduleBlocks:", error);

    return { success: false, error: "Failed to bulk delete schedule blocks" };
  }
}

// CHECK: Detect scheduling conflicts before creating new events
export async function checkScheduleConflicts(formData: {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_until: string;
  court_allocations: Array<{ court_id: string }>;
}) {
  const supabase = await createClient();

  try {
    console.log("[checkScheduleConflicts] Checking for conflicts with:", {
      days_of_week: formData.days_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      court_ids: formData.court_allocations.map((c) => c.court_id),
    });

    const conflicts: Array<{
      day_of_week: number;
      conflicting_events: any[];
    }> = [];

    // Check each day of week for conflicts
    for (const dayOfWeek of formData.days_of_week) {
      // Query for recurring events on the same day
      const { data: recurringEvents, error: recurringError } = await supabase
        .schema("events")
        .from("events")
        .select("*")
        .eq("is_recurring", true)
        .eq("is_published", true)
        .eq("is_cancelled", false);

      if (recurringError) {
        console.error(
          "[checkScheduleConflicts] Error fetching recurring events:",
          recurringError,
        );

        return { success: false, error: recurringError.message };
      }

      // Filter events that match the day of week
      const sameDayEvents = recurringEvents?.filter((event) => {
        const eventDayOfWeek = event.recurrence_pattern?.day_of_week;

        return eventDayOfWeek === dayOfWeek;
      });

      if (!sameDayEvents || sameDayEvents.length === 0) continue;

      // Check for time overlaps
      const newStart = formData.start_time;
      const newEnd = formData.end_time;

      const overlappingEvents = sameDayEvents.filter((event) => {
        const existingStart = event.recurrence_pattern?.start_time;
        const existingEnd = event.recurrence_pattern?.end_time;

        if (!existingStart || !existingEnd) return false;

        // Check if time ranges overlap
        // Two ranges [A,B] and [C,D] overlap if: A < D AND C < B
        const overlaps = newStart < existingEnd && existingStart < newEnd;

        if (!overlaps) return false;

        // Check if date ranges overlap
        const newStartDate = new Date(formData.effective_from);
        const newEndDate = new Date(formData.effective_until);
        const existingStartDate = event.effective_from
          ? new Date(event.effective_from)
          : null;
        const existingEndDate = event.effective_until
          ? new Date(event.effective_until)
          : null;

        // If existing event has no date range, assume it overlaps
        if (!existingStartDate || !existingEndDate) return true;

        // Check date range overlap
        const dateOverlaps =
          newStartDate <= existingEndDate && existingStartDate <= newEndDate;

        if (!dateOverlaps) return false;

        // Check for court conflicts
        const existingCourtIds = (event.court_allocations || []).map(
          (alloc: any) => alloc.court_id,
        );
        const newCourtIds = formData.court_allocations.map((c) => c.court_id);

        // Check if any courts overlap
        const courtOverlap = newCourtIds.some((courtId) =>
          existingCourtIds.includes(courtId),
        );

        return courtOverlap;
      });

      if (overlappingEvents.length > 0) {
        conflicts.push({
          day_of_week: dayOfWeek,
          conflicting_events: overlappingEvents,
        });
      }
    }

    console.log(
      "[checkScheduleConflicts] Found conflicts:",
      conflicts.length > 0 ? conflicts : "None",
    );

    return {
      success: true,
      has_conflicts: conflicts.length > 0,
      conflicts: conflicts,
    };
  } catch (error) {
    console.error("Error in checkScheduleConflicts:", error);

    return { success: false, error: "Failed to check schedule conflicts" };
  }
}

// GET: Fetch all courts
export async function getAllCourts() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("courts")
      .select("*")
      .order("court_number");

    if (error) {
      console.error("Error fetching courts:", error);

      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in getAllCourts:", error);

    return { success: false, error: "Failed to fetch courts" };
  }
}

// PUT: Update court allocations for a recurring event
export async function updateCourtAllocations(
  eventId: string,
  courtAllocations: Array<{
    court_id: string;
    court_number?: number;
    skill_level_min: number;
    skill_level_max?: number;
    skill_level_label: string;
    is_mixed_level?: boolean;
    sort_order?: number;
  }>,
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("events")
      .update({
        court_allocations: courtAllocations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("Error updating court allocations:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/open-play-playground");

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateCourtAllocations:", error);

    return { success: false, error: "Failed to update court allocations" };
  }
}
