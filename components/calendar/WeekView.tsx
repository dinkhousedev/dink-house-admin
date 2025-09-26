"use client";

import { useMemo } from "react";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import clsx from "clsx";

import { Event, EventColors } from "@/types/events";

interface WeekViewProps {
  date: Date;
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (date: Date, time: string) => void;
}

export function WeekView({
  date,
  events = [],
  onEventClick,
  onSlotClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(date);

    startOfWeek.setDate(date.getDate() - date.getDay());

    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);

      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  }, [date]);

  const timeSlots = useMemo(() => {
    const slots = [];

    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    return slots;
  }, []);

  const getEventsForSlot = (day: Date, timeSlot: string) => {
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = new Date(day);

    slotTime.setHours(hour, minute, 0, 0);
    const slotEndTime = new Date(slotTime);

    slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

    return events.filter((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      return (
        eventStart.toDateString() === day.toDateString() &&
        eventStart < slotEndTime &&
        eventEnd > slotTime
      );
    });
  };

  const isToday = (day: Date) => {
    const today = new Date();

    return day.toDateString() === today.toDateString();
  };

  const isCurrentTime = (timeSlot: string) => {
    const now = new Date();
    const [hour, minute] = timeSlot.split(":").map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return (
      hour === currentHour &&
      ((minute === 0 && currentMinute < 30) ||
        (minute === 30 && currentMinute >= 30))
    );
  };

  return (
    <ScrollShadow className="h-[700px] overflow-auto">
      <div className="min-w-[1000px]">
        {/* Header with day names */}
        <div className="grid grid-cols-8 border-b border-dink-gray/30 sticky top-0 bg-black z-10">
          <div className="p-3 text-xs font-medium text-default-500">Time</div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={clsx(
                "p-3 text-center border-l border-dink-gray/30",
                isToday(day) && "bg-dink-lime/10",
              )}
            >
              <div className="text-xs text-default-500">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div
                className={clsx(
                  "text-lg font-semibold",
                  isToday(day) ? "text-dink-lime" : "text-dink-white",
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {timeSlots.map((timeSlot) => (
          <div
            key={timeSlot}
            className="grid grid-cols-8 border-b border-dink-gray/10"
          >
            <div
              className={clsx(
                "p-2 text-xs text-default-500 border-r border-dink-gray/30",
                isCurrentTime(timeSlot) && "text-dink-lime font-semibold",
              )}
            >
              {timeSlot}
            </div>
            {weekDays.map((day, dayIndex) => {
              const slotEvents = getEventsForSlot(day, timeSlot);

              return (
                <button
                  key={dayIndex}
                  className={clsx(
                    "p-1 min-h-[60px] border-l border-dink-gray/10 hover:bg-dink-gray/5 cursor-pointer transition-colors text-left w-full",
                    isToday(day) && "bg-dink-lime/5",
                    isToday(day) &&
                      isCurrentTime(timeSlot) &&
                      "bg-dink-lime/10",
                  )}
                  type="button"
                  onClick={() => onSlotClick?.(day, timeSlot)}
                >
                  <div className="space-y-1">
                    {slotEvents.map((event) => (
                      <Chip
                        key={event.id}
                        className="w-full text-xs cursor-pointer"
                        size="sm"
                        style={{
                          backgroundColor: `${EventColors[event.event_type]}20`,
                          borderColor: EventColors[event.event_type],
                          borderWidth: "1px",
                        }}
                        variant="flat"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <span
                          className="truncate"
                          style={{ color: EventColors[event.event_type] }}
                        >
                          {event.title}
                        </span>
                      </Chip>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollShadow>
  );
}
