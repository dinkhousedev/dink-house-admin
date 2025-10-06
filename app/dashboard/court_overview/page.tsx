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

import { getEvents, getCourts } from "@/app/dashboard/session_booking/actions";
import { Event, Court, EventColors } from "@/types/events";

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

  const indoorCourts = courts
    .filter(
      (court) => court.surface_type === "indoor" || court.court_number <= 5,
    )
    .slice(0, 5);

  const outdoorCourts = courts
    .filter(
      (court) => court.surface_type !== "indoor" || court.court_number > 5,
    )
    .slice(0, 5);

  useEffect(() => {
    fetchCourtsAndBookings();
  }, [selectedDate]);

  const fetchCourtsAndBookings = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);

      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);

      endOfDay.setHours(23, 59, 59, 999);

      const [courtsResult, eventsResult] = await Promise.all([
        getCourts(),
        getEvents(startOfDay, endOfDay),
      ]);

      if (courtsResult.success && courtsResult.data) {
        const courtsWithBookings = courtsResult.data.map((court) => {
          const courtBookings =
            eventsResult.data?.filter((event) =>
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

  const handleBookingChipClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEventDetailsOpen(true);
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
              <Chip
                color="success"
                size="sm"
                variant="flat"
              >
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
                      {format(parseISO(booking.start_time), "h:mm a")}
                    </span>
                    <span className="mx-1">-</span>
                    <span>
                      {format(parseISO(booking.end_time), "h:mm a")}
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
                className={`cursor-pointer min-w-[100px] ${
                  date.toDateString() === selectedDate.toDateString()
                    ? "bg-dink-lime text-black font-semibold"
                    : isToday(date)
                      ? "border-dink-lime border-2"
                      : ""
                }`}
                size="lg"
                variant={
                  date.toDateString() === selectedDate.toDateString()
                    ? "solid"
                    : "bordered"
                }
                onClick={() => setSelectedDate(date)}
              >
                <div className="flex flex-col items-center py-1">
                  <div className="text-xs opacity-80">
                    {format(date, "EEE")}
                  </div>
                  <div className="text-lg font-bold">
                    {format(date, "d")}
                  </div>
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
                          onPress={() => handleBookingChipClick(booking, {} as any)}
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
                                  {format(
                                    parseISO(booking.start_time),
                                    "h:mm a",
                                  )}
                                </div>
                                <div className="text-xs text-dink-white/60">
                                  {format(parseISO(booking.end_time), "h:mm a")}
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
                    `${format(parseISO(selectedEvent.start_time), "EEEE, MMMM d, yyyy • h:mm a")} - ${format(parseISO(selectedEvent.end_time), "h:mm a")}`}
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
                    <div>
                      <h4 className="text-sm font-semibold text-dink-white mb-2">
                        Skill Levels
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {selectedEvent?.skill_levels.map((level) => (
                          <Chip key={level} size="sm" variant="bordered">
                            {level}
                          </Chip>
                        ))}
                      </div>
                    </div>

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
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
