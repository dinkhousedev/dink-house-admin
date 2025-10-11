"use client";

import { useMemo, useState, DragEvent } from "react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Divider } from "@heroui/divider";
import clsx from "clsx";

import { DraggableEvent } from "./DraggableEvent";

import { Event, EventColors } from "@/types/events";

interface DayViewProps {
  date: Date;
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (date: Date, time: string) => void;
  onEventDrop?: (event: Event, newDate: Date, newTime: string) => Promise<void>;
}

export function DayView({
  date,
  events = [],
  onEventClick,
  onSlotClick,
  onEventDrop,
}: DayViewProps) {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const timeSlots = useMemo(() => {
    const slots = [];

    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    return slots;
  }, []);

  const dayEvents = useMemo(() => {
    // First filter events for this day
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start_time);

      return eventDate.toDateString() === date.toDateString();
    });

    // Deduplicate by unique event ID to prevent duplicate display
    // This is a defensive measure in case backend sends duplicates
    const seen = new Set<string>();

    return filteredEvents.filter((event) => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);

      return true;
    });
  }, [events, date]);

  const getEventsForSlot = (timeSlot: string) => {
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotStart = new Date(date);

    slotStart.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotStart);

    slotEnd.setMinutes(slotStart.getMinutes() + 30);

    // Return events that START within this 30-minute slot
    return dayEvents.filter((event) => {
      const eventStart = new Date(event.start_time);

      return eventStart >= slotStart && eventStart < slotEnd;
    });
  };

  // Calculate how many 30-minute slots an event spans
  const calculateEventSpan = (event: Event) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    return Math.ceil(durationMinutes / 30); // Number of 30-minute slots
  };

  const isCurrentTime = (timeSlot: string) => {
    const now = new Date();

    if (date.toDateString() !== now.toDateString()) return false;

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

  const handleDragEnter = (timeSlot: string) => {
    setDragOverSlot(timeSlot);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (
    e: DragEvent<HTMLButtonElement>,
    timeSlot: string,
  ) => {
    e.preventDefault();
    setDragOverSlot(null);

    try {
      const eventData = e.dataTransfer.getData("application/json");

      if (!eventData) return;

      const event: Event = JSON.parse(eventData);

      if (onEventDrop) {
        await onEventDrop(event, date, timeSlot);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  return (
    <div className="flex h-[700px]">
      {/* Time column */}
      <ScrollShadow className="flex-1 overflow-auto">
        <div className="pr-4 relative">
          <div className="relative">
            {/* Render the grid structure */}
            {timeSlots.map((timeSlot, slotIndex) => {
              const isCurrent = isCurrentTime(timeSlot);
              const isDropTarget = dragOverSlot === timeSlot;

              return (
                <div
                  key={timeSlot}
                  className="flex border-b border-dink-gray/40"
                >
                  <div
                    className={clsx(
                      "w-20 py-3 px-2 text-sm text-default-500 text-right",
                      isCurrent && "text-dink-lime font-semibold",
                    )}
                  >
                    {timeSlot}
                  </div>

                  <button
                    className={clsx(
                      "flex-1 h-[60px] p-2 hover:bg-dink-gray/5 cursor-pointer transition-colors text-left w-full",
                      isCurrent && "bg-dink-lime/10",
                      isDropTarget && "bg-dink-lime/20 ring-2 ring-dink-lime",
                    )}
                    type="button"
                    onClick={() => onSlotClick?.(date, timeSlot)}
                    onDragEnter={() => handleDragEnter(timeSlot)}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, timeSlot)}
                  />
                </div>
              );
            })}

            {/* Render events with absolute positioning overlaying the grid */}
            {timeSlots.map((timeSlot, slotIndex) => {
              const slotEvents = getEventsForSlot(timeSlot);

              return slotEvents.map((event) => {
                const span = calculateEventSpan(event);
                const heightInPx = span * 60 - 4; // 60px per slot

                // Calculate precise position based on actual start time
                const eventStart = new Date(event.start_time);
                const dayStart = new Date(date);

                dayStart.setHours(6, 0, 0, 0); // Grid starts at 6:00 AM

                const minutesFromStart =
                  (eventStart.getTime() - dayStart.getTime()) / (1000 * 60);
                const topPosition = (minutesFromStart / 30) * 60; // 60px per 30-min slot

                // Debug logging
                console.log("[DayView] Event:", event.title);
                console.log("[DayView] Start:", event.start_time);
                console.log("[DayView] End:", event.end_time);
                console.log("[DayView] Span (slots):", span);
                console.log("[DayView] Height (px):", heightInPx);
                console.log("[DayView] Top position:", topPosition);

                return (
                  <div
                    key={event.id}
                    className="absolute"
                    style={{
                      top: `${topPosition}px`,
                      left: "84px", // Width of time column (80px + 4px padding)
                      right: "16px",
                      height: `${heightInPx}px`,
                      zIndex: 10,
                    }}
                  >
                    <DraggableEvent event={event}>
                      <Card
                        isPressable
                        className="w-full h-full cursor-move border overflow-hidden"
                        style={{
                          borderColor: EventColors[event.event_type],
                          backgroundColor: `${EventColors[event.event_type]}15`,
                        }}
                        onPress={() => onEventClick?.(event)}
                      >
                        <div className="p-3 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-2 flex-shrink-0">
                            <h4
                              className="font-semibold text-sm leading-tight flex-1 pr-2"
                              style={{ color: EventColors[event.event_type] }}
                            >
                              {event.title}
                            </h4>
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: EventColors[event.event_type],
                                color: "#000",
                              }}
                              variant="flat"
                            >
                              {event.event_type.replace(/_/g, " ")}
                            </Chip>
                          </div>

                          <div className="space-y-1 text-xs text-default-500 flex-1 overflow-hidden">
                            <div className="font-medium text-default-400">
                              {new Date(event.start_time).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                              {" - "}
                              {new Date(event.end_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {event.courts && event.courts.length > 0 && (
                              <div className="text-default-400">
                                Courts:{" "}
                                {event.courts
                                  .map((c) => c.court_number)
                                  .sort((a, b) => a - b)
                                  .join(", ")}
                              </div>
                            )}
                            <div className="text-default-400">
                              {event.current_registrations}/{event.max_capacity}{" "}
                              players
                            </div>
                            {event.skill_levels &&
                              event.skill_levels.length > 0 &&
                              span >= 4 && (
                                <div className="flex gap-1 flex-wrap mt-2">
                                  {event.skill_levels
                                    .slice(0, 3)
                                    .map((level) => (
                                      <Chip
                                        key={level}
                                        className="bg-dink-gray/30"
                                        size="sm"
                                        variant="flat"
                                      >
                                        {level}
                                      </Chip>
                                    ))}
                                  {event.skill_levels.length > 3 && (
                                    <Chip
                                      className="bg-dink-gray/30"
                                      size="sm"
                                      variant="flat"
                                    >
                                      +{event.skill_levels.length - 3}
                                    </Chip>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </Card>
                    </DraggableEvent>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </ScrollShadow>

      {/* Summary sidebar */}
      <div className="w-80 border-l border-dink-gray/60 p-4">
        <h3 className="text-lg font-semibold text-dink-white mb-4">
          Day Summary
        </h3>

        <div className="space-y-4">
          <Card className="p-3 bg-dink-gray/10">
            <div className="text-xs text-default-500 mb-1">Total Events</div>
            <div className="text-2xl font-bold text-dink-lime">
              {dayEvents.length}
            </div>
          </Card>

          <Card className="p-3 bg-dink-gray/10">
            <div className="text-xs text-default-500 mb-1">Total Capacity</div>
            <div className="text-2xl font-bold text-dink-white">
              {dayEvents.reduce(
                (sum, e) => sum + (Number(e.max_capacity) || 0),
                0,
              )}
            </div>
          </Card>

          <Card className="p-3 bg-dink-gray/10">
            <div className="text-xs text-default-500 mb-1">
              Registered Players
            </div>
            <div className="text-2xl font-bold text-dink-white">
              {dayEvents.reduce(
                (sum, e) => sum + (Number(e.current_registrations) || 0),
                0,
              )}
            </div>
          </Card>

          <Divider />

          <div>
            <h4 className="text-sm font-semibold text-default-600 mb-2">
              Events by Type
            </h4>
            <div className="space-y-2">
              {Object.entries(
                dayEvents.reduce(
                  (acc, event) => {
                    acc[event.event_type] = (acc[event.event_type] || 0) + 1;

                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              ).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <Chip
                    size="sm"
                    style={{
                      backgroundColor: `${EventColors[type as keyof typeof EventColors]}20`,
                      color: EventColors[type as keyof typeof EventColors],
                    }}
                    variant="flat"
                  >
                    {type}
                  </Chip>
                  <span className="text-sm text-default-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
