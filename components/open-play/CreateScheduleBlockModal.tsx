"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Icon } from "@iconify/react";

import {
  createScheduleBlock,
  checkScheduleConflicts,
} from "@/app/dashboard/open-play-playground/actions";
import { notify } from "@/lib/notifications";

interface CreateScheduleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  courts: any[];
}

export function CreateScheduleBlockModal({
  isOpen,
  onClose,
  onSuccess,
  courts,
}: CreateScheduleBlockModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    days_of_week: [1] as number[], // Array of selected days
    start_time: "09:00",
    end_time: "11:00",
    session_type: "divided_by_skill",
    special_event_name: "",
    dedicated_skill_min: 3.0,
    dedicated_skill_max: 3.5 as number | undefined,
    dedicated_skill_label: "",
    price_member: 0,
    price_guest: 20.0,
    max_capacity: 20,
    special_instructions: "",
    effective_from: new Date().toISOString().split("T")[0], // Start date
    effective_until: "", // End date (required)
  });
  const [isCustomName, setIsCustomName] = useState(false);

  const sessionNamePresets = [
    {
      value: "Morning Open Play - Beginner (DUPR 2.0-3.0)",
      label: "Morning Open Play - Beginner (DUPR 2.0-3.0)",
    },
    {
      value: "Morning Open Play - Intermediate (DUPR 3.0-4.5)",
      label: "Morning Open Play - Intermediate (DUPR 3.0-4.5)",
    },
    {
      value: "Morning Open Play - Advanced (DUPR 4.5+)",
      label: "Morning Open Play - Advanced (DUPR 4.5+)",
    },
    {
      value: "Afternoon Open Play - Beginner (DUPR 2.0-3.0)",
      label: "Afternoon Open Play - Beginner (DUPR 2.0-3.0)",
    },
    {
      value: "Afternoon Open Play - Intermediate (DUPR 3.0-4.5)",
      label: "Afternoon Open Play - Intermediate (DUPR 3.0-4.5)",
    },
    {
      value: "Afternoon Open Play - Advanced (DUPR 4.5+)",
      label: "Afternoon Open Play - Advanced (DUPR 4.5+)",
    },
    {
      value: "Evening Open Play - Beginner (DUPR 2.0-3.0)",
      label: "Evening Open Play - Beginner (DUPR 2.0-3.0)",
    },
    {
      value: "Evening Open Play - Intermediate (DUPR 3.0-4.5)",
      label: "Evening Open Play - Intermediate (DUPR 3.0-4.5)",
    },
    {
      value: "Evening Open Play - Advanced (DUPR 4.5+)",
      label: "Evening Open Play - Advanced (DUPR 4.5+)",
    },
    {
      value: "Mixed Levels Play (DUPR 2.0-5.0)",
      label: "Mixed Levels Play (DUPR 2.0-5.0)",
    },
    {
      value: "Ladies Night - Intermediate (DUPR 3.0-4.5)",
      label: "Ladies Night - Intermediate (DUPR 3.0-4.5)",
    },
    {
      value: "Ladies Night - Advanced (DUPR 4.5+)",
      label: "Ladies Night - Advanced (DUPR 4.5+)",
    },
    {
      value: "Men's Night - Intermediate (DUPR 3.0-4.5)",
      label: "Men's Night - Intermediate (DUPR 3.0-4.5)",
    },
    {
      value: "Men's Night - Advanced (DUPR 4.5+)",
      label: "Men's Night - Advanced (DUPR 4.5+)",
    },
    {
      value: "Beginner Friendly Session (DUPR 2.0-3.0)",
      label: "Beginner Friendly Session (DUPR 2.0-3.0)",
    },
    {
      value: "Advanced Players Session (DUPR 4.5+)",
      label: "Advanced Players Session (DUPR 4.5+)",
    },
    {
      value: "Weekend Warriors - Mixed (DUPR 2.0-5.0)",
      label: "Weekend Warriors - Mixed (DUPR 2.0-5.0)",
    },
    {
      value: "Social Play Session - All Levels",
      label: "Social Play Session - All Levels",
    },
    { value: "custom", label: "Custom..." },
  ];

  const sessionTypes = [
    {
      value: "divided_by_skill",
      label: "Divided by Skill",
      description: "Courts split among skill levels",
    },
    {
      value: "mixed_levels",
      label: "Mixed Levels",
      description: "All skill levels play together",
    },
    {
      value: "dedicated_skill",
      label: "Dedicated Skill",
      description: "All courts for one skill level",
    },
    {
      value: "special_event",
      label: "Special Event",
      description: "Named events (Ladies Night, etc.)",
    },
  ];

  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  // Parse DUPR ratings from session name
  const parseDUPRRating = (
    sessionName: string,
  ): { min: number; max: number } | null => {
    // Match patterns like (DUPR 2.5-3.0), (DUPR 3.0-3.8), (DUPR 4.0+), (DUPR 2.5-4.0+)
    const duprPattern = /DUPR\s+([\d.]+)(?:-([\d.]+))?\+?/i;
    const match = sessionName.match(duprPattern);

    if (!match) return null;

    const min = parseFloat(match[1]);
    const max = match[2] ? parseFloat(match[2]) : min + 0.5; // If no max, default to min + 0.5

    // Handle open-ended ratings like "4.0+" - set max to 5.0
    if (sessionName.includes("+") && !match[2]) {
      return { min, max: 5.0 };
    }

    return { min, max };
  };

  // Detect skill level label from session name
  const detectSkillLevel = (sessionName: string): string | null => {
    const lowerName = sessionName.toLowerCase();

    if (lowerName.includes("beginner")) return "Beginner";
    if (lowerName.includes("intermediate")) return "Intermediate";
    if (lowerName.includes("advanced")) return "Advanced";

    return null;
  };

  // Detect time of day from session name and return appropriate start time
  const detectTimeOfDay = (sessionName: string): string | null => {
    const lowerName = sessionName.toLowerCase();

    if (lowerName.includes("morning")) return "08:00"; // 8 AM
    if (lowerName.includes("afternoon")) return "12:00"; // 12 PM
    if (lowerName.includes("evening")) return "17:00"; // 5 PM

    return null;
  };

  // Detect session type and populate all related fields
  const detectSessionConfig = (sessionName: string) => {
    const lowerName = sessionName.toLowerCase();
    const duprRating = parseDUPRRating(sessionName);
    const skillLevel = detectSkillLevel(sessionName);
    const timeOfDay = detectTimeOfDay(sessionName);

    // Default values
    let sessionType = "divided_by_skill";
    let dedicatedSkillMin: number | undefined = undefined;
    let dedicatedSkillMax: number | undefined = undefined;
    let dedicatedSkillLabel: string | undefined = undefined;
    let specialEventName: string | undefined = undefined;
    let startTime = timeOfDay || "09:00"; // Use detected time or default to 9 AM
    let endTime = "11:00";

    // Calculate end time (2 hours after start)
    if (timeOfDay) {
      const [hours, minutes] = startTime.split(":");
      const endHours = (parseInt(hours) + 2) % 24;

      endTime = `${endHours.toString().padStart(2, "0")}:${minutes}`;
    }

    // Mixed Levels Detection
    if (
      lowerName.includes("mixed") ||
      lowerName.includes("all levels") ||
      lowerName.includes("social play")
    ) {
      sessionType = "mixed_levels";
    }
    // Special Event Detection (Ladies Night, Men's Night, Weekend Warriors)
    else if (
      lowerName.includes("ladies night") ||
      lowerName.includes("men's night") ||
      lowerName.includes("weekend warriors")
    ) {
      sessionType = "special_event";
      specialEventName = sessionName.split("(")[0].trim(); // Extract event name before DUPR

      // For special events with specific skill levels, still set dedicated skill fields
      if (duprRating && skillLevel) {
        dedicatedSkillMin = duprRating.min;
        dedicatedSkillMax = duprRating.max;
        dedicatedSkillLabel = skillLevel;
      }
    }
    // Dedicated Skill Detection (single skill level)
    else if (duprRating && skillLevel) {
      sessionType = "dedicated_skill";
      dedicatedSkillMin = duprRating.min;
      dedicatedSkillMax = duprRating.max;
      dedicatedSkillLabel = skillLevel;
    }

    return {
      session_type: sessionType,
      dedicated_skill_min: dedicatedSkillMin,
      dedicated_skill_max: dedicatedSkillMax,
      dedicated_skill_label: dedicatedSkillLabel,
      special_event_name: specialEventName,
      start_time: startTime,
      end_time: endTime,
    };
  };

  // Check for conflicts when scheduling fields change
  const checkForConflicts = async () => {
    // Only check if we have the required fields
    if (
      formData.days_of_week.length === 0 ||
      !formData.start_time ||
      !formData.end_time ||
      !formData.effective_from ||
      !formData.effective_until
    ) {
      setConflicts(null);

      return;
    }

    const courtAllocations = generateCourtAllocations();

    // Don't check if no courts allocated (mixed sessions)
    if (courtAllocations.length === 0) {
      setConflicts(null);

      return;
    }

    setCheckingConflicts(true);
    try {
      const result = await checkScheduleConflicts({
        days_of_week: formData.days_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        effective_from: formData.effective_from,
        effective_until: formData.effective_until,
        court_allocations: courtAllocations,
      });

      if (result.success && result.has_conflicts) {
        setConflicts(result.conflicts || []);
      } else {
        setConflicts(null);
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
      setConflicts(null);
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Trigger conflict checking when relevant fields change
  useEffect(() => {
    // Debounce the conflict check to avoid too many API calls
    const timeoutId = setTimeout(() => {
      checkForConflicts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    formData.days_of_week,
    formData.start_time,
    formData.end_time,
    formData.effective_from,
    formData.effective_until,
    formData.name,
  ]);

  // Generate court allocations based on session name
  const generateCourtAllocations = () => {
    const indoorCourts = courts.filter(
      (court) => court.environment === "indoor",
    );
    const sessionName = formData.name.toLowerCase();

    // For Beginner sessions: all courts assigned to Beginner (2.0-3.0)
    if (sessionName.includes("beginner")) {
      return indoorCourts.map((court, index) => ({
        court_id: court.id,
        skill_level_min: 2.0,
        skill_level_max: 3.0,
        skill_level_label: "Beginner (2.0-3.0)",
        is_mixed_level: false,
        sort_order: index,
      }));
    }

    // For Intermediate sessions: all courts assigned to Intermediate (3.0-4.5)
    if (sessionName.includes("intermediate")) {
      return indoorCourts.map((court, index) => ({
        court_id: court.id,
        skill_level_min: 3.0,
        skill_level_max: 4.5,
        skill_level_label: "Intermediate (3.0-4.5)",
        is_mixed_level: false,
        sort_order: index,
      }));
    }

    // For Advanced sessions: all courts assigned to Advanced (4.5+)
    if (sessionName.includes("advanced")) {
      return indoorCourts.map((court, index) => ({
        court_id: court.id,
        skill_level_min: 4.5,
        skill_level_max: undefined,
        skill_level_label: "Advanced (4.5+)",
        is_mixed_level: false,
        sort_order: index,
      }));
    }

    // For Mixed sessions: NO court allocations (empty array)
    // Courts will be allocated dynamically after signups close
    if (sessionName.includes("mixed")) {
      return [];
    }

    // Default: return empty array for safety
    return [];
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      notify.warning("Please enter a name for the schedule block");

      return;
    }

    if (formData.days_of_week.length === 0) {
      notify.warning("Please select at least one day of the week");

      return;
    }

    if (!formData.effective_until) {
      notify.warning("Please select an end date to prevent infinite schedules");

      return;
    }

    // Validate date range
    if (
      new Date(formData.effective_until) < new Date(formData.effective_from)
    ) {
      notify.warning("End date must be after start date");

      return;
    }

    // Generate court allocations based on session name
    const courtAllocations = generateCourtAllocations();

    // Note: Mixed sessions can have 0 court allocations (allocated dynamically later)
    // So we don't validate courtAllocations.length here

    setLoading(true);
    try {
      const result = await createScheduleBlock({
        ...formData,
        court_allocations: courtAllocations,
      });

      if (result.success) {
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          name: "",
          description: "",
          days_of_week: [1],
          start_time: "09:00",
          end_time: "11:00",
          session_type: "divided_by_skill",
          special_event_name: "",
          dedicated_skill_min: 3.0,
          dedicated_skill_max: 3.5,
          dedicated_skill_label: "",
          price_member: 0,
          price_guest: 20.0,
          max_capacity: 20,
          special_instructions: "",
          effective_from: new Date().toISOString().split("T")[0],
          effective_until: "",
        });
        setIsCustomName(false);
        notify.success("Schedule block created successfully");
      } else {
        notify.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating schedule block:", error);
      notify.error("Failed to create schedule block");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="bg-black/95 border border-dink-gray"
      isOpen={isOpen}
      scrollBehavior="inside"
      size="3xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-dink-white flex items-center gap-2">
                <Icon icon="solar:add-circle-bold" width={24} />
                Create New Schedule Block
              </h3>
              <p className="text-sm text-dink-white/60">
                Define a recurring weekly open play session
              </p>
            </ModalHeader>

            <Divider className="bg-dink-gray/30" />

            <ModalBody className="py-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-dink-white flex items-center gap-2">
                    <Icon icon="solar:info-circle-linear" width={18} />
                    Basic Information
                  </h4>

                  {!isCustomName ? (
                    <Select
                      isRequired
                      label="Session Name"
                      labelPlacement="outside"
                      placeholder="Select a session name"
                      selectedKeys={formData.name ? [formData.name] : []}
                      variant="bordered"
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setIsCustomName(true);
                          setFormData({ ...formData, name: "" });
                        } else {
                          // Auto-detect all session configuration from name
                          const sessionConfig = detectSessionConfig(
                            e.target.value,
                          );

                          setFormData({
                            ...formData,
                            name: e.target.value,
                            session_type: sessionConfig.session_type,
                            dedicated_skill_min:
                              sessionConfig.dedicated_skill_min ||
                              formData.dedicated_skill_min,
                            dedicated_skill_max:
                              sessionConfig.dedicated_skill_max ||
                              formData.dedicated_skill_max,
                            dedicated_skill_label:
                              sessionConfig.dedicated_skill_label ||
                              formData.dedicated_skill_label,
                            special_event_name:
                              sessionConfig.special_event_name ||
                              formData.special_event_name,
                            start_time:
                              sessionConfig.start_time || formData.start_time,
                            end_time:
                              sessionConfig.end_time || formData.end_time,
                          });
                        }
                      }}
                    >
                      {sessionNamePresets.map((preset) => (
                        <SelectItem key={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        isRequired
                        label="Custom Session Name"
                        labelPlacement="outside"
                        placeholder="e.g., Morning Open Play"
                        value={formData.name}
                        variant="bordered"
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => {
                          setIsCustomName(false);
                          setFormData({ ...formData, name: "" });
                        }}
                      >
                        ← Back to Presets
                      </Button>
                    </div>
                  )}

                  <Textarea
                    label="Description"
                    labelPlacement="outside"
                    placeholder="Enter description (optional)"
                    value={formData.description}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <Divider className="bg-dink-gray/20" />

                {/* Timing */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-dink-white flex items-center gap-2">
                    <Icon icon="solar:clock-circle-linear" width={18} />
                    Schedule
                  </h4>

                  {/* Days of Week - Multi-select Checkboxes */}
                  <div className="space-y-2">
                    <div className="text-sm text-dink-white">
                      Days of Week <span className="text-red-500">*</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <label
                          key={day.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            formData.days_of_week.includes(day.value)
                              ? "bg-dink-lime/20 border-dink-lime text-dink-lime"
                              : "bg-dink-gray/10 border-dink-gray/30 text-dink-white/70 hover:border-dink-gray"
                          }`}
                        >
                          <input
                            checked={formData.days_of_week.includes(day.value)}
                            className="w-4 h-4"
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  days_of_week: [
                                    ...formData.days_of_week,
                                    day.value,
                                  ].sort(),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  days_of_week: formData.days_of_week.filter(
                                    (d) => d !== day.value,
                                  ),
                                });
                              }
                            }}
                          />
                          <span className="text-sm font-medium">
                            {day.label.slice(0, 3)}
                          </span>
                        </label>
                      ))}
                    </div>
                    {formData.days_of_week.length > 0 && (
                      <p className="text-xs text-dink-white/60">
                        Selected:{" "}
                        {formData.days_of_week
                          .map(
                            (d) =>
                              daysOfWeek.find((day) => day.value === d)?.label,
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      isRequired
                      label="Start Date"
                      labelPlacement="outside"
                      type="date"
                      value={formData.effective_from}
                      variant="bordered"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          effective_from: e.target.value,
                        })
                      }
                    />
                    <Input
                      isRequired
                      label="End Date"
                      labelPlacement="outside"
                      type="date"
                      value={formData.effective_until}
                      variant="bordered"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          effective_until: e.target.value,
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-dink-white/60">
                    Schedule blocks will be created for all selected days within
                    this date range
                  </p>

                  <div className="space-y-4">
                    <Input
                      isRequired
                      description="End time will be automatically set to 2 hours after start time. Times are in CST (24-hour format)."
                      label="Start Time (CST 24-hour)"
                      labelPlacement="outside"
                      placeholder="14:00"
                      type="time"
                      value={formData.start_time}
                      variant="bordered"
                      onChange={(e) => {
                        const startTime = e.target.value;

                        // Validate 24-hour format
                        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime)) {
                          return;
                        }
                        // Calculate end time as 2 hours after start time
                        const [hours, minutes] = startTime.split(":");
                        const endHours = (parseInt(hours) + 2) % 24;
                        const endTime = `${endHours.toString().padStart(2, "0")}:${minutes}`;

                        setFormData({
                          ...formData,
                          start_time: startTime,
                          end_time: endTime,
                        });
                      }}
                    />
                    <div className="flex items-center gap-2 px-4 py-3 bg-dink-gray/10 rounded-lg border border-dink-gray/30">
                      <Icon
                        className="text-dink-lime"
                        icon="solar:clock-circle-bold"
                        width={20}
                      />
                      <div>
                        <p className="text-sm text-dink-white/80">
                          Session Duration: 2 Hours
                        </p>
                        <p className="text-xs text-dink-white/60">
                          End time: {formData.end_time} CST
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider className="bg-dink-gray/20" />

                {/* Session Type */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-dink-white flex items-center gap-2">
                    <Icon icon="solar:layers-bold" width={18} />
                    Session Type
                  </h4>

                  <Select
                    isRequired
                    description="Auto-selected based on session name"
                    label="Session Type"
                    labelPlacement="outside"
                    selectedKeys={[formData.session_type]}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, session_type: e.target.value })
                    }
                  >
                    {sessionTypes.map((type) => (
                      <SelectItem
                        key={type.value}
                        description={type.description}
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>

                  {formData.session_type === "special_event" && (
                    <Input
                      isRequired
                      description="Auto-populated from session name"
                      label="Special Event Name"
                      labelPlacement="outside"
                      placeholder="e.g., Ladies Night, Sunset Social"
                      value={formData.special_event_name}
                      variant="bordered"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          special_event_name: e.target.value,
                        })
                      }
                    />
                  )}

                  {formData.session_type === "dedicated_skill" && (
                    <>
                      <Input
                        isRequired
                        description="Auto-detected from session name"
                        label="Skill Level Label"
                        labelPlacement="outside"
                        placeholder="e.g., Beginner, Intermediate, Advanced"
                        value={formData.dedicated_skill_label}
                        variant="bordered"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dedicated_skill_label: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          description="From DUPR rating"
                          label="Min Skill Level"
                          labelPlacement="outside"
                          type="number"
                          value={formData.dedicated_skill_min.toString()}
                          variant="bordered"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dedicated_skill_min:
                                parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <Input
                          description="From DUPR rating"
                          label="Max Skill Level"
                          labelPlacement="outside"
                          type="number"
                          value={formData.dedicated_skill_max?.toString() || ""}
                          variant="bordered"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dedicated_skill_max:
                                parseFloat(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                <Divider className="bg-dink-gray/20" />

                {/* Pricing */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-dink-white flex items-center gap-2">
                    <Icon icon="solar:dollar-linear" width={18} />
                    Pricing
                  </h4>

                  <Input
                    label="Price (Guests Only - Members Play FREE)"
                    labelPlacement="outside"
                    startContent={<span className="text-default-400">$</span>}
                    type="number"
                    value={formData.price_guest.toString()}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_guest: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-dink-white/60">
                    Members always play for free. This price applies to guest
                    players only.
                  </p>
                </div>

                <Divider className="bg-dink-gray/20" />

                {/* Court Allocation Info */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <Icon
                      className="text-blue-400 mt-0.5"
                      icon="solar:info-circle-bold"
                      width={20}
                    />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-blue-300">
                        Court Allocation Info
                      </h4>
                      <div className="text-xs text-dink-white/70 space-y-1">
                        <p>
                          <strong>Single-Level Sessions</strong> (Beginner,
                          Intermediate, Advanced): All indoor courts
                          automatically assigned to that skill level.
                        </p>
                        <p>
                          <strong>Mixed Sessions</strong>: Courts allocated
                          dynamically after signup closes, balanced by player
                          DUPR scores.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider className="bg-dink-gray/20" />

                {/* Conflict Warning */}
                {checkingConflicts && (
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-3">
                      <Icon
                        className="text-yellow-400 animate-spin"
                        icon="solar:refresh-linear"
                        width={20}
                      />
                      <p className="text-sm text-yellow-300">
                        Checking for scheduling conflicts...
                      </p>
                    </div>
                  </div>
                )}

                {!checkingConflicts && conflicts && conflicts.length > 0 && (
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                    <div className="flex items-start gap-3">
                      <Icon
                        className="text-red-400 mt-0.5"
                        icon="solar:danger-triangle-bold"
                        width={20}
                      />
                      <div className="space-y-2 flex-1">
                        <h4 className="text-sm font-semibold text-red-300">
                          Scheduling Conflicts Detected
                        </h4>
                        <p className="text-xs text-dink-white/80">
                          The following events overlap with your selected
                          time/courts:
                        </p>
                        <div className="space-y-2 mt-2">
                          {conflicts.map((conflict, idx) => {
                            const dayName = [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ][conflict.day_of_week];

                            return (
                              <div
                                key={idx}
                                className="p-3 bg-black/20 rounded border border-red-500/20"
                              >
                                <p className="text-sm font-semibold text-red-300 mb-1">
                                  {dayName}
                                </p>
                                {conflict.conflicting_events.map(
                                  (event: any, eventIdx: number) => (
                                    <div
                                      key={eventIdx}
                                      className="text-xs text-dink-white/70 ml-2"
                                    >
                                      • {event.title} (
                                      {event.recurrence_pattern?.start_time} -{" "}
                                      {event.recurrence_pattern?.end_time})
                                    </div>
                                  ),
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-red-300 mt-3">
                          ⚠️ You cannot create this schedule block due to these
                          conflicts. Please adjust the days, times, or date
                          range.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!checkingConflicts && !conflicts && formData.name && (
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <Icon
                        className="text-green-400"
                        icon="solar:check-circle-bold"
                        width={20}
                      />
                      <p className="text-sm text-green-300">
                        No scheduling conflicts detected
                      </p>
                    </div>
                  </div>
                )}

                <Divider className="bg-dink-gray/20" />

                {/* Special Instructions */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-dink-white flex items-center gap-2">
                    <Icon icon="solar:notes-linear" width={18} />
                    Additional Details
                  </h4>

                  <Textarea
                    label="Special Instructions"
                    labelPlacement="outside"
                    placeholder="Any special instructions for players or staff"
                    value={formData.special_instructions}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        special_instructions: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </ModalBody>

            <Divider className="bg-dink-gray/30" />

            <ModalFooter>
              <Button color="danger" variant="light" onPress={closeModal}>
                Cancel
              </Button>
              <Button
                className="bg-dink-lime text-black font-semibold"
                isDisabled={
                  !formData.name.trim() ||
                  formData.days_of_week.length === 0 ||
                  !formData.effective_until ||
                  (conflicts && conflicts.length > 0) ||
                  checkingConflicts
                }
                isLoading={loading}
                startContent={
                  <Icon icon="solar:check-circle-linear" width={20} />
                }
                onPress={handleSubmit}
              >
                Create Schedule Blocks
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
