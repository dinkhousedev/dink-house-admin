"use client";

import { useMemo } from "react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Divider } from "@heroui/divider";
import clsx from "clsx";

import { Event, EventColors } from "@/types/events";

interface DayViewProps {
  date: Date;
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (date: Date, time: string) => void;
}

export function DayView({
  date,
  events = [],
  onEventClick,
  onSlotClick,
}: DayViewProps) {
  const timeSlots = useMemo(() => {
    const slots = [];

    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    return slots;
  }, []);

  const dayEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);

      return eventDate.toDateString() === date.toDateString();
    });
  }, [events, date]);

  const getEventsForSlot = (timeSlot: string) => {
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = new Date(date);

    slotTime.setHours(hour, minute, 0, 0);
    const slotEndTime = new Date(slotTime);

    slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

    return dayEvents.filter((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      return eventStart < slotEndTime && eventEnd > slotTime;
    });
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

  return (
    <div className="flex h-[700px]">
      {/* Time column */}
      <ScrollShadow className="flex-1 overflow-auto">
        <div className="pr-4">
          {timeSlots.map((timeSlot) => {
            const slotEvents = getEventsForSlot(timeSlot);
            const isCurrent = isCurrentTime(timeSlot);

            return (
              <div key={timeSlot} className="flex border-b border-dink-gray/10">
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
                    "flex-1 min-h-[60px] p-2 hover:bg-dink-gray/5 cursor-pointer transition-colors text-left w-full",
                    isCurrent && "bg-dink-lime/10",
                  )}
                  type="button"
                  onClick={() => onSlotClick?.(date, timeSlot)}
                >
                  <div className="flex gap-2 flex-wrap">
                    {slotEvents.map((event) => (
                      <Card
                        key={event.id}
                        isPressable
                        className="flex-1 min-w-[200px] p-3 border"
                        style={{
                          borderColor: EventColors[event.event_type],
                          backgroundColor: `${EventColors[event.event_type]}10`,
                        }}
                        onPress={() => onEventClick?.(event)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4
                            className="font-semibold text-sm"
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
                            {event.event_type}
                          </Chip>
                        </div>

                        <div className="space-y-1 text-xs text-default-500">
                          <div>
                            {new Date(event.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {new Date(event.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div>
                            Courts:{" "}
                            {event.courts.map((c) => c.court_number).join(", ")}
                          </div>
                          <div>
                            {event.current_registrations}/{event.max_capacity}{" "}
                            players
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {event.skill_levels.slice(0, 3).map((level) => (
                              <Chip key={level} size="sm" variant="flat">
                                {level}
                              </Chip>
                            ))}
                            {event.skill_levels.length > 3 && (
                              <Chip size="sm" variant="flat">
                                +{event.skill_levels.length - 3}
                              </Chip>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </ScrollShadow>

      {/* Summary sidebar */}
      <div className="w-80 border-l border-dink-gray/30 p-4">
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
              {dayEvents.reduce((sum, e) => sum + e.max_capacity, 0)}
            </div>
          </Card>

          <Card className="p-3 bg-dink-gray/10">
            <div className="text-xs text-default-500 mb-1">
              Registered Players
            </div>
            <div className="text-2xl font-bold text-dink-white">
              {dayEvents.reduce((sum, e) => sum + e.current_registrations, 0)}
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
