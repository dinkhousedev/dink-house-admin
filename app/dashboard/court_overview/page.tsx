"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Icon } from "@iconify/react";
import { format, parseISO } from "date-fns";

import {
  getEvents,
  getCourts,
  getOpenPlayInstances,
} from "@/app/dashboard/session_booking/actions";
import { Event, Court, EventColors } from "@/types/events";
import { OpenPlayEditModal } from "@/components/events/OpenPlayEditModal";
import { EventEditModal } from "@/components/events/EventEditModal";

interface CourtWithBookings extends Court {
  bookings: Event[];
}

export default function CourtOverviewPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courts, setCourts] = useState<CourtWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState<CourtWithBookings | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);

  // Open Play Edit Modal State
  const [isOpenPlayEditOpen, setIsOpenPlayEditOpen] = useState(false);
  const [editOpenPlayId, setEditOpenPlayId] = useState<string | null>(null);
  const [editOpenPlayInstanceDate, setEditOpenPlayInstanceDate] = useState<
    string | null
  >(null);
  const [editOpenPlayMode, setEditOpenPlayMode] = useState<
    "series" | "instance"
  >("series");

  // Event Edit Modal State
  const [isEventEditOpen, setIsEventEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  // Open Play Choice Modal State
  const [isOpenPlayChoiceModalOpen, setIsOpenPlayChoiceModalOpen] =
    useState(false);
  const [pendingOpenPlayEvent, setPendingOpenPlayEvent] =
    useState<Event | null>(null);

  const indoorCourts = courts
    .filter((court) => court.environment === "indoor")
    .slice(0, 5);

  const outdoorCourts = courts
    .filter((court) => court.environment === "outdoor")
    .slice(0, 5);

  useEffect(() => {
    fetchCourtsAndBookings();
  }, [selectedDate]);

  const fetchCourtsAndBookings = async () => {
    setLoading(true);
    try {
      // Format date as YYYY-MM-DD to avoid timezone conversion issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Create ISO timestamp strings for the selected day (no timezone conversion)
      const startOfDayStr = `${dateStr}T00:00:00`;
      const endOfDayStr = `${dateStr}T23:59:59`;

      // Fetch courts, regular events, AND open play sessions
      const [courtsResult, eventsResult, openPlayResult] = await Promise.all([
        getCourts(),
        getEvents(startOfDayStr, endOfDayStr),
        getOpenPlayInstances(dateStr, dateStr),
      ]);

      if (courtsResult.success && courtsResult.data) {
        const regularEvents = eventsResult.data || [];
        const openPlaySessions = openPlayResult.data || [];

        // Merge both event types
        const allEvents = [...regularEvents, ...openPlaySessions];

        console.log("[CourtOverview] Regular events:", regularEvents.length);
        console.log(
          "[CourtOverview] Open play sessions:",
          openPlaySessions.length,
        );

        const courtsWithBookings = courtsResult.data.map((court) => {
          const courtBookings =
            allEvents.filter((event) =>
              event.courts?.some(
                (c: any) => c.court_number === court.court_number,
              ),
            ) || [];

          return {
            ...court,
            bookings: courtBookings.sort(
              (a, b) =>
                new Date(a.start_time).getTime() -
                new Date(b.start_time).getTime(),
            ),
          };
        });

        setCourts(courtsWithBookings);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourtClick = (court: CourtWithBookings) => {
    setSelectedCourt(court);
    setModalOpen(true);
  };

  const handleSetupEvent = () => {
    const params = new URLSearchParams({
      court: selectedCourt?.court_number.toString() || "",
      date: selectedDate.toISOString(),
    });

    router.push(`/dashboard/session_booking?${params}`);
  };

  const handleBookingChipClick = (event: Event, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Check if this is an open play event
    if (event.event_type === "open_play" || (event as any).is_open_play) {
      // Show modal to ask user if they want to edit series or just this instance
      setPendingOpenPlayEvent(event);
      setIsOpenPlayChoiceModalOpen(true);
    } else {
      setSelectedEvent(event);
      setEventDetailsOpen(true);
    }
  };

  const handleEditOpenPlaySeries = () => {
    if (!pendingOpenPlayEvent) return;

    setEditOpenPlayId((pendingOpenPlayEvent as any).schedule_block_id);
    setEditOpenPlayInstanceDate(
      (pendingOpenPlayEvent as any).instance_date ||
        new Date(pendingOpenPlayEvent.start_time).toISOString().split("T")[0],
    );
    setEditOpenPlayMode("series");
    setIsOpenPlayEditOpen(true);
    setIsOpenPlayChoiceModalOpen(false);
    setPendingOpenPlayEvent(null);
  };

  const handleEditOpenPlayInstance = () => {
    if (!pendingOpenPlayEvent) return;

    setEditOpenPlayId((pendingOpenPlayEvent as any).schedule_block_id);
    setEditOpenPlayInstanceDate(
      (pendingOpenPlayEvent as any).instance_date ||
        new Date(pendingOpenPlayEvent.start_time).toISOString().split("T")[0],
    );
    setEditOpenPlayMode("instance");
    setIsOpenPlayEditOpen(true);
    setIsOpenPlayChoiceModalOpen(false);
    setPendingOpenPlayEvent(null);
  };

  const handleEditEvent = () => {
    // Close the details modal and open the edit modal
    setEventDetailsOpen(false);
    setEditEvent(selectedEvent);
    setIsEventEditOpen(true);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return days[dayOfWeek] || "Unknown";
  };

  const CourtCard = ({
    court,
    isIndoor,
  }: {
    court: CourtWithBookings;
    isIndoor: boolean;
  }) => {
    const hasBookings = court.bookings.length > 0;

    // Use generic Indoor/Outdoor image for now
    const imagePath = isIndoor ? "/images/Indoor.png" : "/images/Outdoor.png";

    return (
      <Card
        isPressable
        className="relative cursor-pointer hover:scale-105 transition-transform border-2 border-dink-gray/50 bg-black/60"
        onPress={() => handleCourtClick(court)}
      >
        <div className="absolute inset-0 opacity-30 rounded-lg overflow-hidden">
          <img
            alt={`Court ${court.court_number}`}
            className="w-full h-full object-cover"
            src={imagePath}
          />
        </div>
        <CardBody className="relative z-10 p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-dink-lime drop-shadow-lg">
                {court.court_number}
              </h3>
              <span className="text-xs text-dink-white/80 font-medium">
                Court
              </span>
            </div>
            {hasBookings && (
              <Chip color="success" size="sm" variant="flat">
                {court.bookings.length} Events
              </Chip>
            )}
          </div>

          <div className="text-sm text-dink-white/70 mb-3">
            {court.name || `${isIndoor ? "Indoor" : "Outdoor"} Court`}
          </div>

          {/* Booking Time Chips */}
          {hasBookings && (
            <div className="flex flex-col gap-1">
              {court.bookings.slice(0, 2).map((booking) => (
                <Chip
                  key={booking.id}
                  className="cursor-pointer w-full"
                  size="sm"
                  style={{
                    backgroundColor: `${EventColors[booking.event_type]}20`,
                    color: EventColors[booking.event_type],
                    borderColor: `${EventColors[booking.event_type]}50`,
                  }}
                  variant="bordered"
                  onClick={(e) => handleBookingChipClick(booking, e)}
                >
                  <div className="flex items-center justify-between w-full text-xs">
                    <span>
                      {new Date(booking.start_time).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Chicago",
                        },
                      )}
                    </span>
                    <span className="mx-1">-</span>
                    <span>
                      {new Date(booking.end_time).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: "America/Chicago",
                      })}
                    </span>
                  </div>
                </Chip>
              ))}
              {court.bookings.length > 2 && (
                <Chip size="sm" variant="flat">
                  +{court.bookings.length - 2} more
                </Chip>
              )}
            </div>
          )}

          {!hasBookings && (
            <div className="mt-1 text-sm text-dink-white/50">
              No bookings today
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  // Get week dates for chip navigation
  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);

    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);

      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  const weekDates = getWeekDates();
  const isToday = (date: Date) => {
    const today = new Date();

    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-black/40 border border-dink-gray">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold text-dink-white">
                Court Overview
              </h1>
              <p className="text-dink-white/60">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-dink-gray/20"
                size="sm"
                variant="flat"
                onPress={() => {
                  const newDate = new Date(selectedDate);

                  newDate.setDate(newDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
              >
                <Icon icon="solar:arrow-left-linear" width={16} />
                Prev Week
              </Button>

              <Button
                className="bg-dink-gray/20"
                size="sm"
                variant="flat"
                onPress={() => setSelectedDate(new Date())}
              >
                Today
              </Button>

              <Button
                className="bg-dink-gray/20"
                size="sm"
                variant="flat"
                onPress={() => {
                  const newDate = new Date(selectedDate);

                  newDate.setDate(newDate.getDate() + 7);
                  setSelectedDate(newDate);
                }}
              >
                Next Week
                <Icon icon="solar:arrow-right-linear" width={16} />
              </Button>
            </div>
          </div>

          {/* Week Date Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {weekDates.map((date) => (
              <Chip
                key={date.toISOString()}
                className={`cursor-pointer !min-w-[140px] !max-w-none !h-auto ${
                  date.toDateString() === selectedDate.toDateString()
                    ? "bg-dink-lime text-black font-semibold"
                    : isToday(date)
                      ? "border-dink-lime border-2"
                      : ""
                }`}
                classNames={{
                  content: "!max-w-none w-full",
                }}
                size="lg"
                variant={
                  date.toDateString() === selectedDate.toDateString()
                    ? "solid"
                    : "bordered"
                }
                onClick={() => setSelectedDate(date)}
              >
                <div className="flex flex-col items-center py-1 px-2 w-full">
                  <div className="text-xs opacity-80 whitespace-nowrap">
                    {format(date, "EEE, MMM")}
                  </div>
                  <div className="text-lg font-bold">{format(date, "d")}</div>
                </div>
              </Chip>
            ))}
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spinner color="primary" size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="bg-black/40 border border-dink-gray">
            <CardHeader>
              <h2 className="text-xl font-semibold text-dink-white flex items-center gap-2">
                <Icon icon="solar:home-bold" width={24} />
                Indoor Courts
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {indoorCourts.map((court) => (
                  <CourtCard key={court.id} court={court} isIndoor={true} />
                ))}
                {indoorCourts.length < 5 &&
                  Array.from({ length: 5 - indoorCourts.length }).map(
                    (_, i) => (
                      <Card
                        key={`placeholder-indoor-${i}`}
                        className="border-2 border-dink-gray/20 bg-black/20"
                      >
                        <CardBody className="p-4">
                          <div className="text-center text-dink-white/30">
                            Court {indoorCourts.length + i + 1}
                            <div className="text-xs mt-1">Not Available</div>
                          </div>
                        </CardBody>
                      </Card>
                    ),
                  )}
              </div>
            </CardBody>
          </Card>

          <Card className="bg-black/40 border border-dink-gray">
            <CardHeader>
              <h2 className="text-xl font-semibold text-dink-white flex items-center gap-2">
                <Icon icon="solar:sun-bold" width={24} />
                Outdoor Courts
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {outdoorCourts.map((court) => (
                  <CourtCard key={court.id} court={court} isIndoor={false} />
                ))}
                {outdoorCourts.length < 5 &&
                  Array.from({ length: 5 - outdoorCourts.length }).map(
                    (_, i) => (
                      <Card
                        key={`placeholder-outdoor-${i}`}
                        className="border-2 border-dink-gray/20 bg-black/20"
                      >
                        <CardBody className="p-4">
                          <div className="text-center text-dink-white/30">
                            Court {outdoorCourts.length + i + 6}
                            <div className="text-xs mt-1">Not Available</div>
                          </div>
                        </CardBody>
                      </Card>
                    ),
                  )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Court Timeline Modal */}
      <Modal
        className="bg-black/95 border border-dink-gray"
        isOpen={modalOpen}
        size="2xl"
        onOpenChange={setModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-dink-white">
                    Court {selectedCourt?.court_number} - {selectedCourt?.name}
                  </h3>
                  <Chip
                    color={
                      selectedCourt?.status === "available"
                        ? "success"
                        : "warning"
                    }
                    size="sm"
                    variant="flat"
                  >
                    {selectedCourt?.status}
                  </Chip>
                </div>
                <p className="text-sm text-dink-white/60">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              </ModalHeader>

              <Divider className="bg-dink-gray/30" />

              <ModalBody>
                <ScrollShadow className="h-[400px]">
                  {selectedCourt?.bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-dink-white/50">
                      <Icon icon="solar:calendar-linear" width={48} />
                      <p className="mt-4">
                        No bookings scheduled for this court today
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCourt?.bookings.map((booking) => (
                        <Card
                          key={booking.id}
                          isPressable
                          className="bg-dink-gray/20 border border-dink-gray/30 cursor-pointer hover:bg-dink-gray/30"
                          onPress={() => handleBookingChipClick(booking)}
                        >
                          <CardBody className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-dink-white">
                                  {booking.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Chip
                                    className="text-black"
                                    size="sm"
                                    style={{
                                      backgroundColor:
                                        EventColors[booking.event_type],
                                    }}
                                  >
                                    {booking.event_type
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </Chip>
                                  <span className="text-xs text-dink-white/60">
                                    {booking.current_registrations}/
                                    {booking.max_capacity} players
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-dink-lime">
                                  {new Date(
                                    booking.start_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    timeZone: "America/Chicago",
                                  })}
                                </div>
                                <div className="text-xs text-dink-white/60">
                                  {new Date(
                                    booking.end_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    timeZone: "America/Chicago",
                                  })}
                                </div>
                              </div>
                            </div>

                            {booking.description && (
                              <p className="text-sm text-dink-white/70 mt-2">
                                {booking.description}
                              </p>
                            )}

                            <div className="flex gap-2 mt-3">
                              {booking.skill_levels &&
                                booking.skill_levels.length > 0 && (
                                  <div className="flex gap-1">
                                    {booking.skill_levels.map((level) => (
                                      <Chip
                                        key={level}
                                        size="sm"
                                        variant="flat"
                                      >
                                        {level}
                                      </Chip>
                                    ))}
                                  </div>
                                )}
                              {booking.member_only && (
                                <Chip color="warning" size="sm" variant="flat">
                                  Members Only
                                </Chip>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollShadow>
              </ModalBody>

              <Divider className="bg-dink-gray/30" />

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  className="bg-dink-lime text-black font-semibold"
                  startContent={
                    <Icon icon="solar:add-circle-bold" width={20} />
                  }
                  onPress={handleSetupEvent}
                >
                  Set Up Event
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        className="bg-black/95 border border-dink-gray"
        isOpen={eventDetailsOpen}
        size="3xl"
        onOpenChange={setEventDetailsOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-dink-white">
                    {selectedEvent?.title}
                  </h3>
                  <Chip
                    className="text-black"
                    size="sm"
                    style={{
                      backgroundColor: selectedEvent
                        ? EventColors[selectedEvent.event_type]
                        : "#999",
                    }}
                  >
                    {selectedEvent?.event_type.replace("_", " ").toUpperCase()}
                  </Chip>
                </div>
                <p className="text-sm text-dink-white/60">
                  {selectedEvent &&
                    `${format(parseISO(selectedEvent.start_time), "EEEE, MMMM d, yyyy")} • ${new Date(
                      selectedEvent.start_time,
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "America/Chicago",
                    })} - ${new Date(selectedEvent.end_time).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: "America/Chicago",
                      },
                    )}`}
                </p>
              </ModalHeader>

              <Divider className="bg-dink-gray/30" />

              <ModalBody>
                <ScrollShadow className="h-[500px]">
                  <div className="space-y-6">
                    {/* Description */}
                    {selectedEvent?.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-dink-white mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-dink-white/70">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}

                    {/* Capacity & Registration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-dink-white mb-2">
                          Capacity
                        </h4>
                        <div className="text-sm text-dink-white/70">
                          {selectedEvent?.current_registrations}/
                          {selectedEvent?.max_capacity} players registered
                          <br />
                          Min: {selectedEvent?.min_capacity} players
                          <br />
                          Waitlist: {selectedEvent?.waitlist_capacity}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-dink-white mb-2">
                          Pricing
                        </h4>
                        <div className="text-sm text-dink-white/70">
                          Member: ${selectedEvent?.price_member}
                          <br />
                          Guest: ${selectedEvent?.price_guest}
                        </div>
                      </div>
                    </div>

                    {/* Courts */}
                    <div>
                      <h4 className="text-sm font-semibold text-dink-white mb-2">
                        Courts
                      </h4>
                      <div className="flex gap-2">
                        {selectedEvent?.courts.map((court) => (
                          <Chip key={court.id} size="sm" variant="flat">
                            Court {court.court_number}
                            {court.is_primary && " (Primary)"}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {/* Skill Levels */}
                    {selectedEvent?.skill_levels &&
                      selectedEvent.skill_levels.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-dink-white mb-2">
                            Skill Levels
                          </h4>
                          <div className="flex gap-2 flex-wrap">
                            {selectedEvent.skill_levels.map((level) => (
                              <Chip key={level} size="sm" variant="bordered">
                                {level}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Setup Requirements */}
                    {selectedEvent?.setup_requirements && (
                      <div>
                        <h4 className="text-sm font-semibold text-dink-white mb-2">
                          Setup Requirements
                        </h4>
                        {selectedEvent.setup_requirements.equipment?.length >
                          0 && (
                          <div className="mb-2">
                            <p className="text-xs text-dink-white/60">
                              Equipment:
                            </p>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {selectedEvent.setup_requirements.equipment.map(
                                (item, i) => (
                                  <Chip
                                    key={i}
                                    color="success"
                                    size="sm"
                                    variant="dot"
                                  >
                                    {item}
                                  </Chip>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                        {selectedEvent.setup_requirements.staffing?.length >
                          0 && (
                          <div className="mb-2">
                            <p className="text-xs text-dink-white/60">
                              Staffing:
                            </p>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {selectedEvent.setup_requirements.staffing.map(
                                (item, i) => (
                                  <Chip
                                    key={i}
                                    color="primary"
                                    size="sm"
                                    variant="dot"
                                  >
                                    {item}
                                  </Chip>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Special Instructions */}
                    {selectedEvent?.special_instructions && (
                      <div>
                        <h4 className="text-sm font-semibold text-dink-white mb-2">
                          Special Instructions
                        </h4>
                        <p className="text-sm text-dink-white/70">
                          {selectedEvent.special_instructions}
                        </p>
                      </div>
                    )}

                    {/* Staff Notes */}
                    {selectedEvent?.staff_notes && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <h4 className="text-sm font-semibold text-yellow-500 mb-2 flex items-center gap-2">
                          <Icon icon="solar:notes-linear" width={16} />
                          Staff Notes (Internal Only)
                        </h4>
                        <p className="text-sm text-dink-white/70">
                          {selectedEvent.staff_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollShadow>
              </ModalBody>

              <Divider className="bg-dink-gray/30" />

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  className="bg-dink-lime text-black font-semibold"
                  startContent={<Icon icon="solar:pen-bold" width={20} />}
                  onPress={handleEditEvent}
                >
                  Edit Event
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Open Play Edit Modal */}
      {editOpenPlayId && (
        <OpenPlayEditModal
          instanceDate={editOpenPlayInstanceDate || undefined}
          isOpen={isOpenPlayEditOpen}
          mode={editOpenPlayMode}
          scheduleBlockId={editOpenPlayId}
          onClose={() => {
            setIsOpenPlayEditOpen(false);
            setEditOpenPlayId(null);
            setEditOpenPlayInstanceDate(null);
          }}
          onSuccess={() => {
            fetchCourtsAndBookings();
          }}
        />
      )}

      {/* Event Edit Modal */}
      <EventEditModal
        event={editEvent}
        isOpen={isEventEditOpen}
        onClose={() => {
          setIsEventEditOpen(false);
          setEditEvent(null);
        }}
        onSuccess={() => {
          fetchCourtsAndBookings();
        }}
      />

      {/* Open Play Choice Modal */}
      <Modal
        className="bg-black/95 border border-dink-gray"
        isOpen={isOpenPlayChoiceModalOpen}
        size="lg"
        onOpenChange={(open) => {
          setIsOpenPlayChoiceModalOpen(open);
          if (!open) setPendingOpenPlayEvent(null);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-dink-white">
                  Edit this open play session:
                </h3>
              </ModalHeader>

              <Divider className="bg-dink-gray/30" />

              <ModalBody className="py-6">
                <div className="space-y-4">
                  <Card className="bg-dink-lime/10 border border-dink-lime">
                    <CardBody className="p-4">
                      <p className="text-lg font-semibold text-dink-white text-center">
                        {pendingOpenPlayEvent?.title}
                      </p>
                    </CardBody>
                  </Card>

                  <div className="space-y-2 text-dink-white/70">
                    <p className="text-sm">
                      Choose how you want to edit this open play session:
                    </p>
                  </div>
                </div>
              </ModalBody>

              <Divider className="bg-dink-gray/30" />

              <ModalFooter className="flex-col gap-2">
                <Button
                  className="w-full bg-dink-lime text-black font-semibold h-auto py-4"
                  size="lg"
                  startContent={<Icon icon="solar:calendar-bold" width={24} />}
                  onPress={handleEditOpenPlaySeries}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-base">
                      Edit ALL{" "}
                      {pendingOpenPlayEvent &&
                        getDayName((pendingOpenPlayEvent as any).day_of_week)}
                      s
                    </span>
                    <span className="text-xs opacity-80">(Series)</span>
                  </div>
                </Button>
                <Button
                  className="w-full bg-dink-gray/20 text-dink-white font-semibold h-auto py-4"
                  size="lg"
                  startContent={
                    <Icon icon="solar:calendar-linear" width={24} />
                  }
                  variant="bordered"
                  onPress={handleEditOpenPlayInstance}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-base">Edit only this date</span>
                    <span className="text-xs opacity-80">
                      (
                      {(pendingOpenPlayEvent as any)?.instance_date ||
                        (pendingOpenPlayEvent
                          ? new Date(
                              pendingOpenPlayEvent.start_time,
                            ).toLocaleDateString()
                          : "")}
                      )
                    </span>
                  </div>
                </Button>
                <Button
                  className="w-full mt-2"
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
