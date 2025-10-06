"use client";

import { useMemo, useState, useEffect } from "react";
import { Card } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Avatar } from "@heroui/avatar";
import clsx from "clsx";

import { Event, EventColors, Court } from "@/types/events";
import { getCourts, getEvents } from "@/app/dashboard/session_booking/actions";

interface CourtTimelineProps {
  date: Date;
  courts?: Court[];
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onSlotClick?: (court: Court, time: string) => void;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const startOfDay = new Date(date);

        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);

        endOfDay.setHours(23, 59, 59, 999);

        const [courtsResult, eventsResult] = await Promise.all([
          getCourts(),
          getEvents(startOfDay, endOfDay),
        ]);

        if (courtsResult.success && courtsResult.data) {
          setCourts(courtsResult.data);
        }
        if (eventsResult.success && eventsResult.data) {
          setEvents(eventsResult.data);
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

    return events.find((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      return (
        eventStart.toDateString() === date.toDateString() &&
        event.courts.some((c) => c.court_number === court.court_number) &&
        eventStart < slotEndTime &&
        eventEnd > slotTime
      );
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

  return (
    <ScrollShadow className="h-[700px] overflow-auto">
      <div className="min-w-[1400px]">
        {/* Time header */}
        <div className="flex border-b border-dink-gray/30 sticky top-0 bg-black z-10">
          <div className="w-48 p-3 text-sm font-medium text-default-500 border-r border-dink-gray/30">
            Courts / Time
          </div>
          <div className="flex-1 flex">
            {timeSlots.map((time) => (
              <div
                key={time}
                className={clsx(
                  "flex-1 p-2 text-center text-xs text-default-500 border-r border-dink-gray/10",
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
          <div key={court.id} className="flex border-b border-dink-gray/10">
            <div className="w-48 p-3 border-r border-dink-gray/30 bg-black/40">
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
                const isCurrent = isCurrentHour(time);

                // Skip rendering if this slot is covered by a previous event
                const prevTime = index > 0 ? timeSlots[index - 1] : null;
                const prevEvent = prevTime
                  ? getEventForCourtAndTime(court, prevTime)
                  : null;

                if (prevEvent && event && prevEvent.id === event.id) {
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
                        className="m-1 h-[calc(100%-8px)] p-2 border cursor-pointer"
                        style={{
                          borderColor: EventColors[event.event_type],
                          backgroundColor: `${EventColors[event.event_type]}15`,
                        }}
                        onPress={() => onEventClick?.(event)}
                      >
                        <div className="flex flex-col h-full">
                          <div
                            className="text-xs font-semibold truncate"
                            style={{ color: EventColors[event.event_type] }}
                          >
                            {event.title}
                          </div>
                          <div className="text-xs text-default-400">
                            {new Date(event.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            -
                            {new Date(event.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-default-400">
                            {event.current_registrations}/{event.max_capacity}
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                }

                return (
                  <button
                    key={time}
                    className={clsx(
                      "flex-1 min-h-[80px] border-r border-dink-gray/10 hover:bg-dink-gray/5 cursor-pointer transition-colors",
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
