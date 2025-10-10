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
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Checkbox, CheckboxGroup } from "@heroui/checkbox";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { parseDate, parseTime } from "@internationalized/date";

import {
  EventType,
  EventColors,
  SkillLevel,
  CourtAvailabilityResponse,
  EventFormData,
} from "@/types/events";
import {
  checkCourtAvailability,
  createEvent,
} from "@/app/dashboard/session_booking/actions";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notifications";

interface Player {
  id: string;
  account_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  membership_level: string;
}

interface StaffBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date | null;
  defaultTime?: string | null;
  defaultCourt?: string | null;
  selectedPlayer?: Player | null;
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

export function StaffBookingModal({
  isOpen,
  onClose,
  defaultDate,
  defaultTime,
  defaultCourt,
  selectedPlayer,
  onSuccess,
}: StaffBookingModalProps) {
  // Supabase client
  const supabase = createClient();

  // Player selection (for court bookings)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    selectedPlayer?.account_id || "",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("online");

  // Form state
  const [eventType, setEventType] = useState<EventType>("private_lesson");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    defaultDate ? parseDate(defaultDate.toISOString().split("T")[0]) : null,
  );
  const [startTime, setStartTime] = useState(
    defaultTime ? parseTime(defaultTime) : parseTime("18:00"),
  );
  const [endTime, setEndTime] = useState(parseTime("20:00"));

  // Court selection
  const [courtAvailability, setCourtAvailability] = useState<
    CourtAvailabilityResponse[]
  >([]);
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Capacity and requirements
  const [maxCapacity, setMaxCapacity] = useState(16);
  const [minCapacity, setMinCapacity] = useState(4);
  const [waitlistCapacity, setWaitlistCapacity] = useState(5);
  const [selectedSkillLevels, setSelectedSkillLevels] = useState<SkillLevel[]>([
    "2.5",
    "3.0",
    "3.5",
    "4.0",
  ]);
  const [memberOnly, setMemberOnly] = useState(false);

  // Pricing
  const [priceMember, setPriceMember] = useState(15);
  const [priceGuest, setPriceGuest] = useState(20);

  // Setup & logistics
  const [equipmentProvided, setEquipmentProvided] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "Balls",
  ]);
  const [selectedStaffing, setSelectedStaffing] = useState<string[]>([]);
  const [otherSetupRequirements, setOtherSetupRequirements] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [staffNotes, setStaffNotes] = useState("");

  // Registration settings
  const [registrationDeadline, setRegistrationDeadline] = useState<any>(null);
  const [checkInTime, setCheckInTime] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);

  // Fetch players if no player is pre-selected
  useEffect(() => {
    if (isOpen && !selectedPlayer) {
      fetchPlayers();
    }
  }, [isOpen]);

  // Update selected player ID when prop changes
  useEffect(() => {
    if (selectedPlayer) {
      setSelectedPlayerId(selectedPlayer.account_id);
    }
  }, [selectedPlayer]);

  // Check court availability when date/time changes
  useEffect(() => {
    if (date && startTime && endTime) {
      checkAvailability();
    }
  }, [date, startTime, endTime]);

  async function fetchPlayers() {
    try {
      const { data, error } = await supabase
        .from("players")
        .select(
          "id, account_id, first_name, last_name, email, phone, membership_level",
        )
        .order("first_name");

      if (error) throw error;
      if (data) setAvailablePlayers(data as Player[]);
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  }

  const checkAvailability = async () => {
    if (!date || !startTime || !endTime) return;

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

      const result = await checkCourtAvailability(startDateTime, endDateTime);

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
    if (!date || !startTime || !endTime || selectedCourtIds.length === 0) {
      return;
    }

    // For court bookings (private_lesson), require player selection
    if (eventType === "private_lesson" && !selectedPlayerId) {
      notify.warning("Please select a player for the court booking");

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

      // If this is a court booking (private_lesson), create booking differently
      if (eventType === "private_lesson") {
        await createCourtBooking(startDateTime, endDateTime);
      } else {
        // Regular event creation
        const formData: EventFormData = {
          title:
            title ||
            `${eventType.replace("_", " ").toUpperCase()} - ${date.toString()}`,
          description,
          event_type: eventType,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          check_in_time: checkInTime
            ? new Date(
                date.year,
                date.month - 1,
                date.day,
                checkInTime.hour,
                checkInTime.minute,
              ).toISOString()
            : undefined,
          court_ids: selectedCourtIds,
          max_capacity: maxCapacity,
          min_capacity: minCapacity,
          waitlist_capacity: waitlistCapacity,
          skill_levels: selectedSkillLevels,
          member_only: memberOnly,
          price_member: priceMember,
          price_guest: priceGuest,
          equipment_provided: equipmentProvided,
          special_instructions: specialInstructions,
          staff_notes: staffNotes,
          setup_requirements: {
            equipment: selectedEquipment,
            staffing: selectedStaffing,
            other: otherSetupRequirements ? [otherSetupRequirements] : [],
          },
          registration_deadline: registrationDeadline
            ? new Date(
                registrationDeadline.year,
                registrationDeadline.month - 1,
                registrationDeadline.day,
                registrationDeadline.hour || 23,
                registrationDeadline.minute || 59,
              ).toISOString()
            : undefined,
        };

        const result = await createEvent(formData);

        if (result.success) {
          onSuccess?.();
          onClose();
          resetForm();
          notify.success("Event created successfully");
        } else {
          console.error("Error creating event:", result.error);
          notify.error(`Failed to create event: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("Error submitting:", error);
      notify.error("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const createCourtBooking = async (startDateTime: Date, endDateTime: Date) => {
    try {
      // Get current admin user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create event first
      const playerName = selectedPlayer
        ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}`
        : availablePlayers.find((p) => p.account_id === selectedPlayerId)
            ?.first_name || "Guest";

      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          title: title || `Court Booking - ${playerName}`,
          event_type: "private_lesson",
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          max_capacity: 4,
          price_member: priceMember,
          is_published: false,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Link courts to event
      const courtLinks = selectedCourtIds.map((courtId, index) => ({
        event_id: event.id,
        court_id: courtId,
        is_primary: index === 0,
      }));

      await supabase.from("event_courts").insert(courtLinks);

      // Create booking via RPC
      const { data: booking, error: bookingError } = await supabase.rpc(
        "create_court_booking",
        {
          p_event_id: event.id,
          p_player_id: selectedPlayerId,
          p_amount: priceMember,
          p_booked_by_staff: true,
          p_staff_user_id: user?.id,
          p_booking_source: "admin_dashboard",
          p_notes: staffNotes || null,
        },
      );

      if (bookingError) throw bookingError;

      // If payment method is not online, mark as completed
      if (paymentMethod !== "online") {
        await supabase.rpc("update_booking_payment", {
          p_booking_id: booking.id,
          p_payment_status: "completed",
          p_stripe_payment_intent_id: null,
          p_stripe_session_id: null,
        });
      }

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating court booking:", error);
      throw error;
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedCourtIds([]);
    setStaffNotes("");
    setSpecialInstructions("");
    setOtherSetupRequirements("");
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
          <h2 className="text-xl font-semibold text-dink-white">
            Create Court Booking
          </h2>
          <p className="text-sm text-default-500">
            Staff booking with full event details
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
                  placeholder={`${eventType.replace("_", " ").toUpperCase()} Session`}
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

              {/* Player Selection (for court bookings) */}
              {eventType === "private_lesson" && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-dink-white">
                      Player Selection
                    </h3>
                    {selectedPlayer ? (
                      <Card className="bg-dink-lime/10 border border-dink-lime">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-dink-white">
                                {selectedPlayer.first_name}{" "}
                                {selectedPlayer.last_name}
                              </p>
                              <p className="text-xs text-default-500">
                                {selectedPlayer.email ||
                                  selectedPlayer.phone ||
                                  ""}
                              </p>
                            </div>
                            <Chip color="primary" size="sm" variant="flat">
                              {selectedPlayer.membership_level}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    ) : (
                      <Select
                        classNames={{
                          trigger: "bg-[#151515] border border-dink-gray",
                        }}
                        label="Select Player/Guest"
                        placeholder="Choose a player..."
                        selectedKeys={
                          selectedPlayerId ? [selectedPlayerId] : []
                        }
                        variant="bordered"
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                      >
                        {availablePlayers.map((player) => (
                          <SelectItem
                            key={player.account_id}
                            textValue={`${player.first_name} ${player.last_name}`}
                          >
                            <div className="flex flex-col">
                              <span>
                                {player.first_name} {player.last_name}
                              </span>
                              <span className="text-xs text-default-500">
                                {player.email || player.phone} -{" "}
                                {player.membership_level}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                    <Select
                      classNames={{
                        trigger: "bg-[#151515] border border-dink-gray",
                      }}
                      label="Payment Method"
                      placeholder="Select payment method"
                      selectedKeys={[paymentMethod]}
                      variant="bordered"
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <SelectItem key="online">Online (Stripe)</SelectItem>
                      <SelectItem key="terminal">Card Terminal</SelectItem>
                      <SelectItem key="cash">Cash</SelectItem>
                      <SelectItem key="comp">Comp (Free)</SelectItem>
                    </Select>
                  </div>

                  <Divider className="bg-dink-gray/30" />
                </>
              )}

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

                {/* Outdoor Courts */}
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
                  <label className="text-sm text-default-500 mb-2 block">
                    Waitlist Capacity: {waitlistCapacity}
                  </label>
                  <Slider
                    color="primary"
                    maxValue={20}
                    minValue={0}
                    step={1}
                    value={waitlistCapacity}
                    onChange={(value) => setWaitlistCapacity(value as number)}
                  />
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
                  label="Other Setup Requirements"
                  placeholder="Any other setup needs..."
                  value={otherSetupRequirements}
                  variant="bordered"
                  onValueChange={setOtherSetupRequirements}
                />
                <Textarea
                  label="Special Instructions (Client-Visible)"
                  placeholder="Instructions for participants..."
                  value={specialInstructions}
                  variant="bordered"
                  onValueChange={setSpecialInstructions}
                />
                <Textarea
                  label="Staff Notes (Internal Only)"
                  placeholder="Internal notes for staff..."
                  value={staffNotes}
                  variant="bordered"
                  onValueChange={setStaffNotes}
                />
              </div>

              <Divider className="bg-dink-gray/30" />

              {/* Registration Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dink-white">
                  Registration Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label="Registration Deadline"
                    value={registrationDeadline}
                    variant="bordered"
                    onChange={setRegistrationDeadline}
                  />
                  <TimeInput
                    hourCycle={24}
                    label="Check-in Time"
                    value={checkInTime}
                    variant="bordered"
                    onChange={setCheckInTime}
                  />
                </div>
              </div>
            </div>
          </ScrollShadow>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-dink-lime text-black font-semibold"
            isDisabled={
              !date || !startTime || !endTime || selectedCourtIds.length === 0
            }
            isLoading={submitting}
            startContent={<Icon icon="solar:add-circle-bold" width={20} />}
            onPress={handleSubmit}
          >
            Create Booking
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
