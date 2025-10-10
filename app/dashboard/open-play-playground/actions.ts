"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// GET: Fetch all active schedule blocks with court allocations
export async function getAllScheduleBlocks(includeInactive = false) {
  const supabase = await createClient();

  try {
    let query = supabase
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
            name,
            environment
          )
        )
      `,
      )
      .order("day_of_week")
      .order("start_time");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching schedule blocks:", error);

      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in getAllScheduleBlocks:", error);

    return { success: false, error: "Failed to fetch schedule blocks" };
  }
}

// POST: Create new schedule block with court allocations
export async function createScheduleBlock(formData: {
  name: string;
  description?: string;
  days_of_week: number[]; // Changed to array for multi-day support
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
  effective_from: string; // Start date
  effective_until: string; // End date (required)
  court_allocations: Array<{
    court_id: string;
    skill_level_min: number;
    skill_level_max?: number;
    skill_level_label: string;
    is_mixed_level?: boolean;
    sort_order?: number;
  }>;
}) {
  const supabase = await createClient();

  try {
    // Use the new multi-day function
    const { data, error } = await supabase
      .schema("api")
      .rpc("create_schedule_blocks_multi_day", {
        p_name: formData.name,
        p_days_of_week: formData.days_of_week,
        p_start_time: formData.start_time,
        p_end_time: formData.end_time,
        p_session_type: formData.session_type,
        p_court_allocations: formData.court_allocations,
        p_effective_from: formData.effective_from,
        p_effective_until: formData.effective_until,
        p_description: formData.description || null,
        p_special_event_name: formData.special_event_name || null,
        p_dedicated_skill_min: formData.dedicated_skill_min || null,
        p_dedicated_skill_max: formData.dedicated_skill_max || null,
        p_dedicated_skill_label: formData.dedicated_skill_label || null,
        p_price_member: formData.price_member,
        p_price_guest: formData.price_guest,
        p_max_capacity: formData.max_capacity || 20,
        p_special_instructions: formData.special_instructions || null,
      });

    if (error) {
      console.error("Error creating schedule blocks:", error);

      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/open-play-playground");
    revalidatePath("/dashboard/session_booking");
    revalidatePath("/dashboard/court_overview");

    return { success: true, data };
  } catch (error) {
    console.error("Error in createScheduleBlock:", error);

    return { success: false, error: "Failed to create schedule blocks" };
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
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", blockId)
      .select()
      .single();

    if (error) {
      console.error("Error toggling schedule block status:", error);

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

// POST: Clone schedule block to another day
export async function cloneScheduleBlock(
  blockId: string,
  targetDayOfWeek: number,
  newStartTime?: string,
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

    if (fetchError || !originalBlock) {
      return { success: false, error: "Failed to fetch original block" };
    }

    // Create new block with same settings but different day
    const result = await createScheduleBlock({
      name: `${originalBlock.name} (Copy)`,
      description: originalBlock.description,
      days_of_week: [targetDayOfWeek],
      start_time: newStartTime || originalBlock.start_time,
      end_time: originalBlock.end_time,
      session_type: originalBlock.session_type,
      special_event_name: originalBlock.special_event_name,
      dedicated_skill_min: originalBlock.dedicated_skill_min,
      dedicated_skill_max: originalBlock.dedicated_skill_max,
      dedicated_skill_label: originalBlock.dedicated_skill_label,
      price_member: originalBlock.price_member,
      price_guest: originalBlock.price_guest,
      max_capacity: originalBlock.max_capacity,
      special_instructions: originalBlock.special_instructions,
      effective_from: new Date().toISOString().split("T")[0],
      effective_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 90 days from now
      court_allocations: originalBlock.court_allocations || [],
    });

    return result;
  } catch (error) {
    console.error("Error in cloneScheduleBlock:", error);

    return { success: false, error: "Failed to clone schedule block" };
  }
}

// POST: Bulk activate/deactivate schedule blocks
export async function bulkToggleScheduleBlocks(
  blockIds: string[],
  isActive: boolean,
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("events")
      .from("open_play_schedule_blocks")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .in("id", blockIds)
      .select();

    if (error) {
      console.error("Error bulk toggling schedule blocks:", error);

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

// POST: Create date range override for schedule blocks
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
        const { data, error } = await supabase
          .schema("api")
          .rpc("create_schedule_override", {
            p_block_id: blockId,
            p_override_date: date,
            p_is_cancelled: isCancelled,
            p_reason: reason,
            p_replacement_details: null,
          });

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

// DELETE: Bulk delete schedule blocks
export async function bulkDeleteScheduleBlocks(blockIds: string[]) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .schema("api")
      .rpc("bulk_delete_schedule_blocks", {
        p_block_ids: blockIds,
      });

    if (error) {
      console.error("Error bulk deleting schedule blocks:", error);

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
