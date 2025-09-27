"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { DatePicker } from "@heroui/date-picker";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { parseDate, getLocalTimeZone } from "@internationalized/date";

import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { CourtTimeline } from "@/components/calendar/CourtTimeline";
import { EventTemplates } from "@/components/events/EventTemplates";
import { QuickEventModal } from "@/components/events/QuickEventModal";
import { CalendarView, type CalendarViewOptions } from "@/types/events";

export default function SessionBookingPage() {
  const [viewOptions, setViewOptions] = useState<CalendarViewOptions>({
    view: "month",
    date: new Date(),
  });

  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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

  const handleQuickCreate = (date: Date, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time || null);
    setIsQuickCreateOpen(true);
  };

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
    <div className="flex gap-6 p-6">
      {/* Main Calendar Area */}
      <div className="flex-1">
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

              <div className="flex gap-2">
                <Chip color="success" size="sm" variant="dot">
                  <span className="text-xs">Scramble</span>
                </Chip>
                <Chip className="bg-blue-500" size="sm" variant="dot">
                  <span className="text-xs">DUPR</span>
                </Chip>
                <Chip className="bg-orange-500" size="sm" variant="dot">
                  <span className="text-xs">Open Play</span>
                </Chip>
                <Chip color="danger" size="sm" variant="dot">
                  <span className="text-xs">Tournament</span>
                </Chip>
              </div>
            </div>
          </CardHeader>

          <CardBody className="overflow-hidden p-0">
            {/* Calendar Views */}
            {viewOptions.view === "month" && (
              <CalendarGrid
                date={viewOptions.date}
                onCellClick={handleQuickCreate}
                onEventClick={(event) => {
                  /* Handle event click */
                }}
              />
            )}
            {viewOptions.view === "week" && (
              <WeekView
                date={viewOptions.date}
                onEventClick={(event) => {
                  /* Handle event click */
                }}
                onSlotClick={handleQuickCreate}
              />
            )}
            {viewOptions.view === "day" && (
              <DayView
                date={viewOptions.date}
                onEventClick={(event) => {
                  /* Handle event click */
                }}
                onSlotClick={handleQuickCreate}
              />
            )}
            {viewOptions.view === "courts" && (
              <CourtTimeline
                date={viewOptions.date}
                onEventClick={(event) => {
                  /* Handle event click */
                }}
                onSlotClick={(court, time) => {
                  /* Handle court slot click */
                }}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Sidebar with Templates */}
      <div className="w-80">
        <EventTemplates
          onTemplateSelect={(template) => {
            /* Handle template select */
          }}
        />
      </div>

      {/* Quick Create Modal */}
      <QuickEventModal
        defaultDate={selectedDate}
        defaultTime={selectedTime}
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </div>
  );
}
