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
import { Input, Textarea } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { TimeInput } from "@heroui/date-input";
import { Chip } from "@heroui/chip";
import { Slider } from "@heroui/slider";
import { Switch } from "@heroui/switch";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { parseDate, parseTime } from "@internationalized/date";

import {
  EventType,
  EventColors,
  SkillLevel,
  CourtAvailabilityResponse,
  Event,
} from "@/types/events";
import {
  checkCourtAvailability,
  updateEvent,
  deleteEvent,
} from "@/app/dashboard/session_booking/actions";
import { notify } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onSuccess?: () => void;
}

const eventTypes: { key: EventType; label: string; icon: string }[] = [
  { key: "event_scramble", label: "Scramble", icon: "solar:game-linear" },
  {
    key: "dupr_open_play",
    label: "DUPR Open Play",
    icon: "solar:chart-square-linear",
  },
  {
    key: "dupr_tournament",
    label: "DUPR Tournament",
    icon: "solar:trophy-linear",
  },
  {
    key: "non_dupr_tournament",
    label: "Non-DUPR Tournament",
    icon: "solar:trophy-linear",
  },
  {
    key: "open_play",
    label: "Open Play",
    icon: "solar:users-group-rounded-outline",
  },
  { key: "league", label: "League", icon: "solar:cup-linear" },
  { key: "clinic", label: "Clinic", icon: "solar:education-linear" },
  { key: "private_lesson", label: "Private Lesson", icon: "solar:user-linear" },
];

const skillLevelOptions: SkillLevel[] = [
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
  "5.0+",
];

const equipmentOptions = [
  "Balls",
  "Paddles",
  "Nets",
  "Scoreboards",
  "First Aid Kit",
];

const staffingOptions = [
  "Referee",
  "Scorekeeper",
  "Check-in Desk",
  "Equipment Manager",
];

export function EventEditModal({
  isOpen,
  onClose,
  event,
  onSuccess,
}: EventEditModalProps) {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  // Form state
  const [eventType, setEventType] = useState<EventType>("event_scramble");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<any>(null);
  const [startTime, setStartTime] = useState<any>(null);
  const [endTime, setEndTime] = useState<any>(null);

  // Court selection
  const [courtAvailability, setCourtAvailability] = useState<
    CourtAvailabilityResponse[]
  >([]);
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Capacity and requirements
  const [maxCapacity, setMaxCapacity] = useState(16);
  const [minCapacity, setMinCapacity] = useState(4);
  const [selectedSkillLevels, setSelectedSkillLevels] = useState<SkillLevel[]>(
    [],
  );
  const [memberOnly, setMemberOnly] = useState(false);

  // Pricing
  const [priceMember, setPriceMember] = useState(15);
  const [priceGuest, setPriceGuest] = useState(20);

  // Setup & logistics
  const [equipmentProvided, setEquipmentProvided] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedStaffing, setSelectedStaffing] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load event data when modal opens
  useEffect(() => {
    if (isOpen && event) {
      loadEventData(event);
    }
  }, [isOpen, event]);

  // Check court availability when date/time changes
  useEffect(() => {
    if (date && startTime && endTime) {
      checkAvailability();
    }
  }, [date, startTime, endTime]);

  const loadEventData = (eventData: Event) => {
    setEventType(eventData.event_type);
    setTitle(eventData.title);
    setDescription(eventData.description || "");

    // Parse dates and times
    const startDate = new Date(eventData.start_time);
    const endDate = new Date(eventData.end_time);

    setDate(parseDate(startDate.toISOString().split("T")[0]));
    setStartTime(
      parseTime(
        `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`,
      ),
    );
    setEndTime(
      parseTime(
        `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`,
      ),
    );

    // Set court IDs
    if (eventData.courts && eventData.courts.length > 0) {
      setSelectedCourtIds(eventData.courts.map((c) => c.id));
    }

    // Capacity
    setMaxCapacity(eventData.max_capacity || 16);
    setMinCapacity(eventData.min_capacity || 4);
    setSelectedSkillLevels(eventData.skill_levels || []);
    setMemberOnly(eventData.member_only || false);

    // Pricing
    setPriceMember(eventData.price_member || 15);
    setPriceGuest(eventData.price_guest || 20);

    // Setup
    setEquipmentProvided(eventData.equipment_provided || false);
    setSpecialInstructions(eventData.special_instructions || "");

    // Parse setup requirements if available
    if (eventData.setup_requirements) {
      setSelectedEquipment(eventData.setup_requirements.equipment || []);
      setSelectedStaffing(eventData.setup_requirements.staffing || []);
    }
  };

  const checkAvailability = async () => {
    if (!date || !startTime || !endTime || !event) return;

    setCheckingAvailability(true);
    try {
      const startDateTime = new Date(
        date.year,
        date.month - 1,
        date.day,
        startTime.hour,
        startTime.minute,
      );
      const endDateTime = new Date(
        date.year,
        date.month - 1,
        date.day,
        endTime.hour,
        endTime.minute,
      );

      const result = await checkCourtAvailability(
        startDateTime,
        endDateTime,
        event.id,
      );

      if (result.success && result.data) {
        setCourtAvailability(result.data);
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCourtToggle = (courtId: string) => {
    setSelectedCourtIds((prev) =>
      prev.includes(courtId)
        ? prev.filter((id) => id !== courtId)
        : [...prev, courtId],
    );
  };

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime || !event) {
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = new Date(
        date.year,
        date.month - 1,
        date.day,
        startTime.hour,
        startTime.minute,
      );
      const endDateTime = new Date(
        date.year,
        date.month - 1,
        date.day,
        endTime.hour,
        endTime.minute,
      );

      const updates = {
        title,
        description,
        event_type: eventType,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        court_ids: selectedCourtIds,
        max_capacity: maxCapacity,
        min_capacity: minCapacity,
        skill_levels: selectedSkillLevels,
        member_only: memberOnly,
        price_member: priceMember,
        price_guest: priceGuest,
        equipment_provided: equipmentProvided,
        special_instructions: specialInstructions,
        setup_requirements: {
          equipment: selectedEquipment,
          staffing: selectedStaffing,
          other: [],
        },
      };

      const result = await updateEvent(event.id, updates);

      if (result.success) {
        onSuccess?.();
        onClose();
        notify.success("Event updated successfully");
      } else {
        console.error("Error updating event:", result.error);
        notify.error("Failed to update event. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      notify.error("Failed to update event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    const confirmed = await confirm({
      title: "Delete Event",
      message: `Are you sure you want to delete "${event.title}"?\n\nThis action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    setDeleting(true);
    try {
      const result = await deleteEvent(event.id);

      if (result.success) {
        onSuccess?.();
        onClose();
        notify.success("Event deleted successfully");
      } else {
        console.error("Error deleting event:", result.error);
        notify.error("Failed to delete event. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      notify.error("Failed to delete event. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const indoorCourts = courtAvailability.filter(
    (ca) => ca.court.surface_type === "indoor",
  );
  const outdoorCourts = courtAvailability.filter(
    (ca) => ca.court.surface_type !== "indoor",
  );

  return (
    <Modal
      classNames={{
        body: "py-6",
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border border-dink-gray bg-black/95",
        header: "border-b border-dink-gray",
        footer: "border-t border-dink-gray",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-dink-white">Edit Event</h2>
          <p className="text-sm text-default-500">
            Update event details and settings
          </p>
        </ModalHeader>

        <ModalBody>
          <ScrollShadow className="h-[600px]">
            <div className="space-y-6">
              {/* Event Type & Title */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dink-white">
                  Event Type & Title
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {eventTypes.map((type) => (
                    <Button
                      key={type.key}
                      className={
                        eventType === type.key
                          ? "border-2"
                          : "border border-dink-gray"
                      }
                      size="sm"
                      style={
                        eventType === type.key
                          ? {
                              backgroundColor: EventColors[type.key],
                              borderColor: EventColors[type.key],
                              color: "#000",
                            }
                          : {}
                      }
                      variant={eventType === type.key ? "solid" : "bordered"}
                      onPress={() => setEventType(type.key)}
                    >
                      <Icon icon={type.icon} width={16} />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
                <Input
                  label="Event Title"
                  placeholder="Event title"
                  value={title}
                  variant="bordered"
                  onValueChange={setTitle}
                />
                <Textarea
                  label="Description"
                  placeholder="Describe this event..."
                  value={description}
                  variant="bordered"
                  onValueChange={setDescription}
                />
              </div>

              <Divider className="bg-dink-gray/30" />

              {/* Date & Time */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dink-white">
                  Date & Time
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <DatePicker
                    label="Date"
                    value={date}
                    variant="bordered"
                    onChange={setDate}
                  />
                  <TimeInput
                    hourCycle={24}
                    label="Start Time"
                    value={startTime}
                    variant="bordered"
                    onChange={(value) => value && setStartTime(value)}
                  />
                  <TimeInput
                    hourCycle={24}
                    label="End Time"
                    value={endTime}
                    variant="bordered"
                    onChange={(value) => value && setEndTime(value)}
                  />
                </div>
              </div>

              <Divider className="bg-dink-gray/30" />

              {/* Court Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dink-white">
                    Court Selection
                  </h3>
                  {checkingAvailability && (
                    <span className="text-xs text-default-500">
                      Checking availability...
                    </span>
                  )}
                </div>

                {/* Indoor Courts */}
                {indoorCourts.length > 0 && (
                  <div>
                    <p className="text-xs text-default-500 mb-2 flex items-center gap-2">
                      <Icon icon="solar:home-bold" width={16} />
                      Indoor Courts
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {indoorCourts.map((ca) => (
                        <Card
                          key={ca.court.id}
                          isPressable
                          className={`cursor-pointer transition-all ${
                            selectedCourtIds.includes(ca.court.id)
                              ? "border-2 border-dink-lime bg-dink-lime/10"
                              : ca.available
                                ? "border border-green-500/50 bg-green-500/5"
                                : "border border-red-500/50 bg-red-500/5"
                          }`}
                          onPress={() => handleCourtToggle(ca.court.id)}
                        >
                          <CardBody className="p-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-dink-white">
                                {ca.court.court_number}
                              </div>
                              <div className="text-xs text-default-500">
                                {ca.available ? "Available" : "Conflict"}
                              </div>
                              {ca.conflicts.length > 0 && (
                                <div className="text-xs text-red-500 mt-1">
                                  {ca.conflicts.length} event(s)
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outdoor Courts */}
                {outdoorCourts.length > 0 && (
                  <div>
                    <p className="text-xs text-default-500 mb-2 flex items-center gap-2">
                      <Icon icon="solar:sun-bold" width={16} />
                      Outdoor Courts
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {outdoorCourts.map((ca) => (
                        <Card
                          key={ca.court.id}
                          isPressable
                          className={`cursor-pointer transition-all ${
                            selectedCourtIds.includes(ca.court.id)
                              ? "border-2 border-dink-lime bg-dink-lime/10"
                              : ca.available
                                ? "border border-green-500/50 bg-green-500/5"
                                : "border border-red-500/50 bg-red-500/5"
                          }`}
                          onPress={() => handleCourtToggle(ca.court.id)}
                        >
                          <CardBody className="p-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-dink-white">
                                {ca.court.court_number}
                              </div>
                              <div className="text-xs text-default-500">
                                {ca.available ? "Available" : "Conflict"}
                              </div>
                              {ca.conflicts.length > 0 && (
                                <div className="text-xs text-red-500 mt-1">
                                  {ca.conflicts.length} event(s)
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Divider className="bg-dink-gray/30" />

              {/* Capacity & Requirements */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dink-white">
                  Capacity & Skill Requirements
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-default-500 mb-2 block">
                      Max Capacity: {maxCapacity} players
                    </label>
                    <Slider
                      color="primary"
                      maxValue={32}
                      minValue={1}
                      step={1}
                      value={maxCapacity}
                      onChange={(value) => setMaxCapacity(value as number)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-default-500 mb-2 block">
                      Min Capacity: {minCapacity} players
                    </label>
                    <Slider
                      color="primary"
                      maxValue={32}
                      minValue={1}
                      step={1}
                      value={minCapacity}
                      onChange={(value) => setMinCapacity(value as number)}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-default-500 mb-2 block">
                    Skill Levels
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillLevelOptions.map((level) => (
                      <Chip
                        key={level}
                        className="cursor-pointer"
                        color={
                          selectedSkillLevels.includes(level)
                            ? "primary"
                            : "default"
                        }
                        variant={
                          selectedSkillLevels.includes(level)
                            ? "solid"
                            : "bordered"
                        }
                        onClick={() => {
                          setSelectedSkillLevels((prev) =>
                            prev.includes(level)
                              ? prev.filter((l) => l !== level)
                              : [...prev, level],
                          );
                        }}
                      >
                        {level}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Switch
                  color="primary"
                  isSelected={memberOnly}
                  onValueChange={setMemberOnly}
                >
                  Members Only
                </Switch>
              </div>

              <Divider className="bg-dink-gray/30" />

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dink-white">
                  Pricing
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Member Price"
                    startContent={<span className="text-default-500">$</span>}
                    type="number"
                    value={priceMember.toString()}
                    variant="bordered"
                    onValueChange={(value) =>
                      setPriceMember(parseFloat(value) || 0)
                    }
                  />
                  <Input
                    label="Guest Price"
                    startContent={<span className="text-default-500">$</span>}
                    type="number"
                    value={priceGuest.toString()}
                    variant="bordered"
                    onValueChange={(value) =>
                      setPriceGuest(parseFloat(value) || 0)
                    }
                  />
                </div>
              </div>

              <Divider className="bg-dink-gray/30" />

              {/* Setup & Logistics */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dink-white">
                  Setup & Logistics
                </h3>
                <Switch
                  color="primary"
                  isSelected={equipmentProvided}
                  onValueChange={setEquipmentProvided}
                >
                  Equipment Provided
                </Switch>
                {equipmentProvided && (
                  <CheckboxGroup
                    label="Equipment Checklist"
                    size="sm"
                    value={selectedEquipment}
                    onValueChange={(value) =>
                      setSelectedEquipment(value as string[])
                    }
                  >
                    {equipmentOptions.map((item) => (
                      <Checkbox key={item} value={item}>
                        {item}
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                )}
                <CheckboxGroup
                  label="Staffing Requirements"
                  size="sm"
                  value={selectedStaffing}
                  onValueChange={(value) =>
                    setSelectedStaffing(value as string[])
                  }
                >
                  {staffingOptions.map((item) => (
                    <Checkbox key={item} value={item}>
                      {item}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
                <Textarea
                  label="Special Instructions (Client-Visible)"
                  placeholder="Instructions for participants..."
                  value={specialInstructions}
                  variant="bordered"
                  onValueChange={setSpecialInstructions}
                />
              </div>
            </div>
          </ScrollShadow>
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            isLoading={deleting}
            startContent={
              <Icon icon="solar:trash-bin-trash-linear" width={20} />
            }
            variant="light"
            onPress={handleDelete}
          >
            Delete Event
          </Button>
          <div className="flex-1" />
          <Button color="default" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-dink-lime text-black font-semibold"
            isDisabled={!date || !startTime || !endTime}
            isLoading={submitting}
            startContent={<Icon icon="solar:check-circle-bold" width={20} />}
            onPress={handleSubmit}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
      {ConfirmDialogComponent}
    </Modal>
  );
}
