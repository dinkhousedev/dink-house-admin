"use client";

import { useMemo, useState, useEffect } from "react";
import { Card } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import clsx from "clsx";

import { Event, EventColors, Court } from "@/types/events";
import {
  getCourts,
  getEvents,
  getCourtAllocationsForDate,
} from "@/app/dashboard/session_booking/actions";

interface CourtTimelineProps {
  date: Date;
  courts?: Court[];
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (court: Court, time: string) => void;
}

interface CourtAllocation {
  schedule_block_id: string;
  schedule_block_name: string;
  start_time: string;
  end_time: string;
  session_type: string;
  court_id: string;
  court_number: number;
  court_name: string;
  surface_type: string;
  skill_level_min: string;
  skill_level_max: string;
  skill_level_label: string;
  is_mixed_level: boolean;
  sort_order: number;
}

export function CourtTimeline({
  date,
  courts: propCourts,
  events: propEvents,
  onEventClick,
  onSlotClick,
}: CourtTimelineProps) {
  const [courts, setCourts] = useState<Court[]>(propCourts || []);
  const [events, setEvents] = useState<Event[]>(propEvents || []);
  const [allocations, setAllocations] = useState<CourtAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      console.log(
        "[CourtTimeline] Starting data fetch for date:",
        date.toISOString(),
      );
      try {
        const startOfDay = new Date(date);

        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);

        endOfDay.setHours(23, 59, 59, 999);

        console.log("[CourtTimeline] Date range:", {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
        });

        const [courtsResult, eventsResult, allocationsResult] =
          await Promise.all([
            getCourts(),
            getEvents(startOfDay, endOfDay),
            getCourtAllocationsForDate(date),
          ]);

        console.log("[CourtTimeline] Fetch results:", {
          courtsSuccess: courtsResult.success,
          eventsSuccess: eventsResult.success,
          allocationsSuccess: allocationsResult.success,
        });

        if (courtsResult.success && courtsResult.data) {
          setCourts(courtsResult.data);
          console.log(
            "[CourtTimeline] Loaded courts:",
            courtsResult.data.length,
          );
        }
        if (eventsResult.success && eventsResult.data) {
          setEvents(eventsResult.data);
          console.log(
            "[CourtTimeline] Loaded events:",
            eventsResult.data.length,
          );
          console.log(
            "[CourtTimeline] Events sample:",
            eventsResult.data.slice(0, 2),
          );
        }
        if (allocationsResult.success && allocationsResult.data) {
          setAllocations(allocationsResult.data);
          console.log(
            "[CourtTimeline] Loaded allocations:",
            allocationsResult.data.length,
          );
          console.log(
            "[CourtTimeline] Allocations sample:",
            allocationsResult.data.slice(0, 5),
          );
        }
      } catch (error) {
        console.error("Error fetching court timeline data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!propCourts || !propEvents) {
      fetchData();
    } else {
      setCourts(propCourts);
      setEvents(propEvents);
      setLoading(false);
    }
  }, [date, propCourts, propEvents]);

  const timeSlots = useMemo(() => {
    const slots = [];

    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }

    return slots;
  }, []);

  const getEventForCourtAndTime = (court: Court, time: string) => {
    const [hour] = time.split(":").map(Number);
    const slotTime = new Date(date);

    slotTime.setHours(hour, 0, 0, 0);
    const slotEndTime = new Date(slotTime);

    slotEndTime.setHours(hour + 1);

    const foundEvent = events.find((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      const dateMatch = eventStart.toDateString() === date.toDateString();
      const courtMatch = event.courts?.some(
        (c) => c.court_number === court.court_number,
      );
      const timeMatch = eventStart < slotEndTime && eventEnd > slotTime;

      // Debug first event check
      if (events.indexOf(event) === 0 && time === "06:00") {
        console.log(
          `[CourtTimeline] Checking event "${event.title}" for court ${court.court_number} at ${time}:`,
          {
            dateMatch,
            courtMatch,
            timeMatch,
            eventStart: eventStart.toISOString(),
            eventEnd: eventEnd.toISOString(),
            eventCourts: event.courts,
            slotTime: slotTime.toISOString(),
            slotEndTime: slotEndTime.toISOString(),
          },
        );
      }

      return dateMatch && courtMatch && timeMatch;
    });

    return foundEvent;
  };

  const getAllocationForCourtAndTime = (court: Court, time: string) => {
    const [hour, minute] = time.split(":").map(Number);

    return allocations.find((allocation) => {
      if (allocation.court_id !== court.id) return false;

      // Parse start and end times (format: HH:MM:SS)
      const [startHour, startMin] = allocation.start_time
        .split(":")
        .map(Number);
      const [endHour, endMin] = allocation.end_time.split(":").map(Number);

      // Check if the time slot falls within the allocation time range
      const slotMinutes = hour * 60 + minute;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
  };

  const calculateEventSpan = (event: Event) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return Math.ceil(durationHours);
  };

  const isCurrentHour = (time: string) => {
    const now = new Date();

    if (date.toDateString() !== now.toDateString()) return false;

    const [hour] = time.split(":").map(Number);

    return hour === now.getHours();
  };

  if (loading) {
    return (
      <div className="h-[700px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-default-500">Loading court timeline...</div>
        </div>
      </div>
    );
  }

  // Debug: Log what we have
  console.log("[CourtTimeline] Rendering with:", {
    courts: courts.length,
    events: events.length,
    allocations: allocations.length,
    date: date.toISOString(),
  });

  return (
    <ScrollShadow className="h-[700px] overflow-auto">
      <div className="min-w-[1400px]">
        {/* Time header */}
        <div className="flex border-b border-dink-gray/60 sticky top-0 bg-black z-10">
          <div className="w-48 p-3 text-sm font-medium text-default-500 border-r border-dink-gray/60">
            Courts / Time
          </div>
          <div className="flex-1 flex">
            {timeSlots.map((time) => (
              <div
                key={time}
                className={clsx(
                  "flex-1 p-2 text-center text-xs text-default-500 border-r border-dink-gray/40",
                  isCurrentHour(time) &&
                    "bg-dink-lime/10 text-dink-lime font-semibold",
                )}
              >
                {time}
              </div>
            ))}
          </div>
        </div>

        {/* Courts */}
        {courts.map((court) => (
          <div key={court.id} className="flex border-b border-dink-gray/40">
            <div className="w-48 p-3 border-r border-dink-gray/60 bg-black/40">
              <div className="flex items-center gap-2">
                <Avatar
                  className={clsx(
                    court.surface_type === "indoor"
                      ? "bg-blue-500/20 text-blue-500"
                      : "bg-green-500/20 text-green-500",
                  )}
                  name={court.court_number.toString()}
                  size="sm"
                />
                <div>
                  <div className="text-sm font-medium text-dink-white">
                    {court.name}
                  </div>
                  <div className="text-xs text-default-500">
                    {court.surface_type} • {court.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex relative">
              {timeSlots.map((time, index) => {
                const event = getEventForCourtAndTime(court, time);
                const allocation = getAllocationForCourtAndTime(court, time);
                const isCurrent = isCurrentHour(time);

                // Skip rendering if this slot is covered by a previous event
                const prevTime = index > 0 ? timeSlots[index - 1] : null;
                const prevEvent = prevTime
                  ? getEventForCourtAndTime(court, prevTime)
                  : null;
                const prevAllocation = prevTime
                  ? getAllocationForCourtAndTime(court, prevTime)
                  : null;

                if (prevEvent && event && prevEvent.id === event.id) {
                  return null;
                }

                // Skip rendering if covered by previous allocation
                if (
                  prevAllocation &&
                  allocation &&
                  prevAllocation.schedule_block_id ===
                    allocation.schedule_block_id &&
                  prevAllocation.court_id === allocation.court_id
                ) {
                  return null;
                }

                if (event) {
                  const span = calculateEventSpan(event);

                  return (
                    <div
                      key={time}
                      className="absolute h-full"
                      style={{
                        left: `${(index / timeSlots.length) * 100}%`,
                        width: `${(span / timeSlots.length) * 100}%`,
                      }}
                    >
                      <Card
                        isPressable
                        className="m-1 h-[calc(100%-8px)] border cursor-pointer overflow-hidden"
                        style={{
                          borderColor: EventColors[event.event_type],
                          backgroundColor: `${EventColors[event.event_type]}15`,
                        }}
                        onPress={() => onEventClick?.(event)}
                      >
                        <div className="flex flex-col h-full p-2 justify-between">
                          <div>
                            <div
                              className="text-xs font-semibold leading-tight line-clamp-2 mb-1"
                              style={{ color: EventColors[event.event_type] }}
                            >
                              {event.title}
                            </div>
                            <div className="text-[10px] text-default-400 font-medium">
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
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-[10px] text-default-400">
                              {event.current_registrations}/{event.max_capacity}{" "}
                              players
                            </div>
                            {span >= 2 && (
                              <Chip
                                size="sm"
                                style={{
                                  backgroundColor:
                                    EventColors[event.event_type],
                                  color: "#000",
                                  fontSize: "9px",
                                  height: "18px",
                                  minHeight: "18px",
                                }}
                                variant="flat"
                              >
                                {event.event_type.replace(/_/g, " ")}
                              </Chip>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                }

                // Show court allocation if exists
                if (allocation) {
                  // Calculate span for allocation
                  const [startHour, startMin] = allocation.start_time
                    .split(":")
                    .map(Number);
                  const [endHour, endMin] = allocation.end_time
                    .split(":")
                    .map(Number);
                  const durationMinutes =
                    endHour * 60 + endMin - (startHour * 60 + startMin);
                  const durationHours = Math.ceil(durationMinutes / 60);

                  return (
                    <div
                      key={time}
                      className="absolute h-full"
                      style={{
                        left: `${(index / timeSlots.length) * 100}%`,
                        width: `${(durationHours / timeSlots.length) * 100}%`,
                      }}
                    >
                      <div className="m-1 h-[calc(100%-8px)] border-2 border-dink-lime/40 bg-dink-lime/10 rounded-lg p-2 flex flex-col justify-center">
                        <div className="text-xs font-semibold text-dink-lime mb-1">
                          {allocation.schedule_block_name}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Chip
                            className="bg-dink-lime/30 text-dink-white"
                            size="sm"
                            variant="flat"
                          >
                            <span className="text-[10px] font-medium">
                              {allocation.skill_level_label}
                            </span>
                          </Chip>
                        </div>
                        <div className="text-[9px] text-default-400 mt-1">
                          {allocation.start_time.slice(0, 5)} -{" "}
                          {allocation.end_time.slice(0, 5)}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={time}
                    className={clsx(
                      "flex-1 min-h-[80px] border-r border-dink-gray/40 hover:bg-dink-gray/5 cursor-pointer transition-colors",
                      isCurrent && "bg-dink-lime/5",
                    )}
                    type="button"
                    onClick={() => onSlotClick?.(court, time)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 p-4 bg-black/60">
          <div className="text-xs text-default-500">Event Types:</div>
          {Object.entries(EventColors)
            .slice(0, 4)
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-default-400 capitalize">
                  {type.replace("_", " ")}
                </span>
              </div>
            ))}
        </div>
      </div>
    </ScrollShadow>
  );
}
