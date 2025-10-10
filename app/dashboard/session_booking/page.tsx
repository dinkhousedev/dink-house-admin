"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { DatePicker } from "@heroui/date-picker";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Divider } from "@heroui/divider";
import { Icon } from "@iconify/react";
import { parseDate, getLocalTimeZone } from "@internationalized/date";

import { getEvents, getOpenPlayInstances } from "./actions";

import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { CourtTimeline } from "@/components/calendar/CourtTimeline";
import { StaffBookingModal } from "@/components/events/StaffBookingModal";
import { OpenPlayEditModal } from "@/components/events/OpenPlayEditModal";
import { CalendarView, type CalendarViewOptions, Event } from "@/types/events";

export default function SessionBookingPage() {
  const [viewOptions, setViewOptions] = useState<CalendarViewOptions>({
    view: "month",
    date: new Date(),
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Open Play Edit Modal State
  const [isOpenPlayEditOpen, setIsOpenPlayEditOpen] = useState(false);
  const [editOpenPlayId, setEditOpenPlayId] = useState<string | null>(null);
  const [editOpenPlayInstanceDate, setEditOpenPlayInstanceDate] = useState<
    string | null
  >(null);
  const [editOpenPlayMode, setEditOpenPlayMode] = useState<
    "series" | "instance"
  >("series");

  // Open Play Choice Modal State
  const [isOpenPlayChoiceModalOpen, setIsOpenPlayChoiceModalOpen] =
    useState(false);
  const [pendingOpenPlayEvent, setPendingOpenPlayEvent] = useState<any>(null);

  const handleViewChange = (view: CalendarView) => {
    setViewOptions((prev) => ({ ...prev, view }));
  };

  const handleDateChange = (date: any) => {
    if (date) {
      setViewOptions((prev) => ({
        ...prev,
        date: date.toDate(getLocalTimeZone()),
      }));
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(viewOptions.date);

    switch (viewOptions.view) {
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "day":
      case "courts":
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setViewOptions((prev) => ({ ...prev, date: newDate }));
  };

  const handleNext = () => {
    const newDate = new Date(viewOptions.date);

    switch (viewOptions.view) {
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "day":
      case "courts":
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setViewOptions((prev) => ({ ...prev, date: newDate }));
  };

  const handleToday = () => {
    setViewOptions((prev) => ({ ...prev, date: new Date() }));
  };

  const handleQuickCreate = (date: Date, time?: string, court?: string) => {
    setSelectedDate(date);
    setSelectedTime(time || null);
    setSelectedCourt(court || null);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    // Refresh calendar data
    fetchEvents();
  };

  const handleEventClick = (event: any) => {
    // Check if this is an open play event
    if (event.event_type === "open_play" || event.is_open_play) {
      // Show modal to ask user if they want to edit series or just this instance
      setPendingOpenPlayEvent(event);
      setIsOpenPlayChoiceModalOpen(true);
    } else {
      // Handle regular event click (could open event details modal)
      console.log("Regular event clicked:", event);
    }
  };

  const handleEditOpenPlaySeries = () => {
    if (!pendingOpenPlayEvent) return;

    setEditOpenPlayId(pendingOpenPlayEvent.schedule_block_id);
    setEditOpenPlayInstanceDate(
      pendingOpenPlayEvent.instance_date ||
        new Date(pendingOpenPlayEvent.start_time).toISOString().split("T")[0],
    );
    setEditOpenPlayMode("series");
    setIsOpenPlayEditOpen(true);
    setIsOpenPlayChoiceModalOpen(false);
    setPendingOpenPlayEvent(null);
  };

  const handleEditOpenPlayInstance = () => {
    if (!pendingOpenPlayEvent) return;

    setEditOpenPlayId(pendingOpenPlayEvent.schedule_block_id);
    setEditOpenPlayInstanceDate(
      pendingOpenPlayEvent.instance_date ||
        new Date(pendingOpenPlayEvent.start_time).toISOString().split("T")[0],
    );
    setEditOpenPlayMode("instance");
    setIsOpenPlayEditOpen(true);
    setIsOpenPlayChoiceModalOpen(false);
    setPendingOpenPlayEvent(null);
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

  // Fetch events when view or date changes
  useEffect(() => {
    fetchEvents();
  }, [viewOptions.view, viewOptions.date]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const startOfMonth = new Date(viewOptions.date);

      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(viewOptions.date);

      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Fetch both regular events and open play instances
      const [eventsResult, openPlayResult] = await Promise.all([
        getEvents(startOfMonth, endOfMonth),
        getOpenPlayInstances(startOfMonth, endOfMonth),
      ]);

      const regularEvents =
        eventsResult.success && eventsResult.data ? eventsResult.data : [];
      const openPlaySessions =
        openPlayResult.success && openPlayResult.data
          ? openPlayResult.data
          : [];

      // Merge both into a single array for display
      const allEvents = [...regularEvents, ...openPlaySessions] as Event[];

      console.log(
        "[SessionBookingPage] Loaded regular events:",
        regularEvents.length,
      );
      console.log(
        "[SessionBookingPage] Loaded open play sessions:",
        openPlaySessions.length,
      );
      console.log(
        "[SessionBookingPage] Total calendar items:",
        allEvents.length,
      );

      setEvents(allEvents);
    } catch (error) {
      console.error("[SessionBookingPage] Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  const getDateRangeDisplay = () => {
    const date = viewOptions.date;
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
    };

    switch (viewOptions.view) {
      case "month":
        return date.toLocaleDateString("en-US", options);
      case "week": {
        const startOfWeek = new Date(date);

        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);

        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return `${startOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${endOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      }
      case "day":
      case "courts":
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }
  };

  return (
    <div className="p-6">
      {/* Main Calendar Area */}
      <div>
        <Card className="border border-dink-gray bg-black/40">
          <CardHeader className="flex flex-col gap-4 pb-4">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  isIconOnly
                  className="bg-dink-gray/20"
                  variant="flat"
                  onPress={handlePrevious}
                >
                  <Icon icon="solar:arrow-left-linear" width={20} />
                </Button>
                <Button
                  isIconOnly
                  className="bg-dink-gray/20"
                  variant="flat"
                  onPress={handleNext}
                >
                  <Icon icon="solar:arrow-right-linear" width={20} />
                </Button>
                <Button
                  className="bg-dink-gray/20"
                  variant="flat"
                  onPress={handleToday}
                >
                  Today
                </Button>
                <h2 className="text-xl font-semibold text-dink-white">
                  {getDateRangeDisplay()}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <DatePicker
                  className="w-40"
                  size="sm"
                  value={parseDate(
                    viewOptions.date.toISOString().split("T")[0],
                  )}
                  variant="bordered"
                  onChange={handleDateChange}
                />

                <Button
                  className="bg-dink-lime text-dink-black"
                  color="primary"
                  startContent={
                    <Icon icon="solar:add-circle-linear" width={20} />
                  }
                  onPress={() => handleQuickCreate(new Date())}
                >
                  New Event
                </Button>
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex items-center justify-between">
              <Tabs
                classNames={{
                  tabList: "bg-dink-gray/20",
                  cursor: "bg-dink-lime",
                  tab: "text-dink-white data-[selected=true]:text-dink-black",
                }}
                color="primary"
                selectedKey={viewOptions.view}
                variant="solid"
                onSelectionChange={(key) =>
                  handleViewChange(key as CalendarView)
                }
              >
                <Tab key="month" title="Month" />
                <Tab key="week" title="Week" />
                <Tab key="day" title="Day" />
                <Tab key="courts" title="Courts" />
              </Tabs>

              <div className="flex gap-2 flex-wrap">
                <Chip color="success" size="sm" variant="dot">
                  <span className="text-xs">Scramble</span>
                </Chip>
                <Chip className="bg-blue-500" size="sm" variant="dot">
                  <span className="text-xs">DUPR Open Play</span>
                </Chip>
                <Chip className="bg-indigo-600" size="sm" variant="dot">
                  <span className="text-xs">DUPR Tournament</span>
                </Chip>
                <Chip color="danger" size="sm" variant="dot">
                  <span className="text-xs">Tournament</span>
                </Chip>
                <Chip className="bg-purple-500" size="sm" variant="dot">
                  <span className="text-xs">League</span>
                </Chip>
                <Chip className="bg-green-500" size="sm" variant="dot">
                  <span className="text-xs">Clinic</span>
                </Chip>
                <Chip
                  className="bg-dink-lime/80 text-black font-semibold"
                  size="sm"
                  variant="dot"
                >
                  <span className="text-xs">Open Play Schedule</span>
                </Chip>
              </div>
            </div>
          </CardHeader>

          <CardBody className="overflow-hidden p-0">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-default-500">Loading events...</div>
                </div>
              </div>
            ) : (
              <>
                {/* Calendar Views */}
                {viewOptions.view === "month" && (
                  <CalendarGrid
                    date={viewOptions.date}
                    events={events}
                    onCellClick={handleQuickCreate}
                    onEventClick={handleEventClick}
                  />
                )}
                {viewOptions.view === "week" && (
                  <WeekView
                    date={viewOptions.date}
                    events={events}
                    onEventClick={handleEventClick}
                    onSlotClick={handleQuickCreate}
                  />
                )}
                {viewOptions.view === "day" && (
                  <DayView
                    date={viewOptions.date}
                    events={events}
                    onEventClick={handleEventClick}
                    onSlotClick={handleQuickCreate}
                  />
                )}
                {viewOptions.view === "courts" && (
                  <CourtTimeline
                    date={viewOptions.date}
                    events={events}
                    onEventClick={handleEventClick}
                    onSlotClick={(court, time) => {
                      handleQuickCreate(viewOptions.date, time, court.id);
                    }}
                  />
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Staff Booking Modal */}
      <StaffBookingModal
        defaultCourt={selectedCourt}
        defaultDate={selectedDate}
        defaultTime={selectedTime}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />

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
            fetchEvents();
          }}
        />
      )}

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
                        getDayName(pendingOpenPlayEvent.day_of_week)}
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
                      {pendingOpenPlayEvent?.instance_date ||
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
