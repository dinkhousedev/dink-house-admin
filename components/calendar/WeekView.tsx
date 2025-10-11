"use client";

import { useMemo, useState, DragEvent } from "react";
import { Card } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import clsx from "clsx";

import { DraggableEvent } from "./DraggableEvent";

import { Event, EventColors } from "@/types/events";

interface WeekViewProps {
  date: Date;
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (date: Date, time: string) => void;
  onEventDrop?: (event: Event, newDate: Date, newTime: string) => Promise<void>;
}

export function WeekView({
  date,
  events = [],
  onEventClick,
  onSlotClick,
  onEventDrop,
}: WeekViewProps) {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
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

    // Filter events that START within this 30-minute slot for this day using CST timezone
    const slotEvents = events.filter((event) => {
      const eventStart = new Date(event.start_time);

      // Extract event time in CST
      const eventCSTStr = eventStart.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const [datePart, timePart] = eventCSTStr.split(", ");
      const [eventMonth, eventDay, eventYear] = datePart.split("/");
      const [eventHour, eventMinute] = timePart.split(":").map(Number);

      // Check if event is on the same day and within the 30-minute slot
      const dayMatch =
        eventYear === day.getFullYear().toString() &&
        eventMonth === String(day.getMonth() + 1).padStart(2, "0") &&
        eventDay === String(day.getDate()).padStart(2, "0");

      const timeMatch =
        eventHour === hour &&
        eventMinute >= minute &&
        eventMinute < minute + 30;

      return dayMatch && timeMatch;
    });

    // Deduplicate by unique event ID to prevent duplicate display
    // This is a defensive measure in case backend sends duplicates
    const seen = new Set<string>();

    return slotEvents.filter((event) => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);

      return true;
    });
  };

  // Calculate how many 30-minute slots an event spans
  const calculateEventSpan = (event: Event) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    return Math.ceil(durationMinutes / 30); // Number of 30-minute slots
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

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (day: Date, timeSlot: string) => {
    const slotKey = `${day.toISOString()}-${timeSlot}`;

    setDragOverSlot(slotKey);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (
    e: DragEvent<HTMLButtonElement>,
    day: Date,
    timeSlot: string,
  ) => {
    e.preventDefault();
    setDragOverSlot(null);

    try {
      const eventData = e.dataTransfer.getData("application/json");

      if (!eventData) return;

      const event: Event = JSON.parse(eventData);

      if (onEventDrop) {
        await onEventDrop(event, day, timeSlot);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  return (
    <ScrollShadow className="h-[700px] overflow-auto">
      <div className="min-w-[1000px] relative">
        {/* Header with day names */}
        <div className="grid grid-cols-8 border-b border-dink-gray/60 sticky top-0 bg-black z-20">
          <div className="p-3 text-xs font-medium text-default-500">Time</div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={clsx(
                "p-3 text-center border-l border-dink-gray/60",
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

        {/* Time slots grid */}
        {timeSlots.map((timeSlot) => (
          <div
            key={timeSlot}
            className="grid grid-cols-8 border-b border-dink-gray/40"
          >
            <div
              className={clsx(
                "p-2 text-xs text-default-500 border-r border-dink-gray/60",
                isCurrentTime(timeSlot) && "text-dink-lime font-semibold",
              )}
            >
              {timeSlot}
            </div>
            {weekDays.map((day, dayIndex) => {
              const slotKey = `${day.toISOString()}-${timeSlot}`;
              const isDropTarget = dragOverSlot === slotKey;

              return (
                <button
                  key={dayIndex}
                  className={clsx(
                    "p-1 h-[60px] border-l border-dink-gray/40 hover:bg-dink-gray/5 cursor-pointer transition-colors text-left w-full",
                    isToday(day) && "bg-dink-lime/5",
                    isToday(day) &&
                      isCurrentTime(timeSlot) &&
                      "bg-dink-lime/10",
                    isDropTarget && "bg-dink-lime/20 ring-2 ring-dink-lime",
                  )}
                  type="button"
                  onClick={() => onSlotClick?.(day, timeSlot)}
                  onDragEnter={() => handleDragEnter(day, timeSlot)}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day, timeSlot)}
                />
              );
            })}
          </div>
        ))}

        {/* Render events with absolute positioning overlaying the grid */}
        {weekDays.map((day, dayIndex) => {
          // Calculate column position
          const columnWidth = 100 / 8; // 8 columns total (1 time + 7 days)
          const leftPosition = `${(dayIndex + 1) * columnWidth}%`;
          const columnWidthPercent = `${columnWidth}%`;

          return (
            <div key={`events-${dayIndex}`}>
              {timeSlots.map((timeSlot, slotIndex) => {
                const slotEvents = getEventsForSlot(day, timeSlot);

                return slotEvents.map((event) => {
                  const span = calculateEventSpan(event);
                  // Height includes borders: span * 61px (60px + 1px border) - 4px for padding
                  const heightInPx = span * 61 - 5;

                  // Calculate precise position based on actual start time in CST
                  const eventStart = new Date(event.start_time);

                  // Extract time components in CST timezone
                  const eventCSTStr = eventStart.toLocaleString("en-US", {
                    timeZone: "America/Chicago",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });

                  const [eventHour, eventMinute] = eventCSTStr
                    .split(":")
                    .map(Number);

                  // Calculate minutes from 6:00 AM (grid start)
                  const minutesFromStart = (eventHour - 6) * 60 + eventMinute;

                  // Calculate position: header (~58px) + (minutes / 30) slots * 61px per slot
                  // Header includes p-3 padding + content + 1px border
                  // Using 61px per slot to account for 60px height + 1px border between rows
                  const topPosition = 58 + (minutesFromStart / 30) * 61;

                  return (
                    <div
                      key={`${event.id}-${day.toISOString()}`}
                      className="absolute"
                      style={{
                        top: `${topPosition}px`,
                        left: leftPosition,
                        width: columnWidthPercent,
                        height: `${heightInPx}px`,
                        zIndex: 10,
                        padding: "2px",
                      }}
                    >
                      <DraggableEvent event={event}>
                        <Card
                          isPressable
                          className="w-full h-full cursor-move border overflow-hidden"
                          style={{
                            backgroundColor: `${EventColors[event.event_type]}15`,
                            borderColor: EventColors[event.event_type],
                          }}
                          onPress={() => onEventClick?.(event)}
                        >
                          <div className="p-2 h-full flex flex-col">
                            <div
                              className="text-xs font-semibold leading-tight line-clamp-2"
                              style={{
                                color: EventColors[event.event_type],
                              }}
                            >
                              {event.title}
                            </div>
                            <div className="text-[10px] text-default-500 mt-1">
                              {new Date(event.start_time).toLocaleTimeString(
                                "en-US",
                                {
                                  timeZone: "America/Chicago",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )}
                            </div>
                            {span >= 2 &&
                              event.courts &&
                              event.courts.length > 0 && (
                                <div className="text-[10px] text-default-400 mt-0.5 truncate">
                                  Courts:{" "}
                                  {event.courts
                                    .map((c) => c.court_number)
                                    .join(", ")}
                                </div>
                              )}
                            {span >= 3 && (
                              <div className="text-[10px] text-default-400 mt-0.5">
                                {event.current_registrations}/
                                {event.max_capacity}
                              </div>
                            )}
                          </div>
                        </Card>
                      </DraggableEvent>
                    </div>
                  );
                });
              })}
            </div>
          );
        })}
      </div>
    </ScrollShadow>
  );
}
