"use client";

import { useMemo } from "react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import clsx from "clsx";

import { Event, EventColors } from "@/types/events";

interface CalendarGridProps {
  date: Date;
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onCellClick?: (date: Date) => void;
}

export function CalendarGrid({
  date,
  events = [],
  onEventClick,
  onCellClick,
}: CalendarGridProps) {
  const calendar = useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    const endDate = new Date(lastDay);

    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [date]);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);

      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const isToday = (day: Date) => {
    const today = new Date();

    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === date.getMonth();
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-default-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendar.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);

          return (
            <Card
              key={index}
              isPressable
              className={clsx(
                "min-h-[120px] border border-dink-gray/30 bg-black/20 p-2 transition-all hover:bg-dink-gray/10",
                !isCurrentMonthDay && "opacity-40",
                isTodayDay && "border-dink-lime bg-dink-lime/5",
              )}
              onPress={() => onCellClick?.(day)}
            >
              <div className="flex flex-col h-full">
                <div
                  className={clsx(
                    "text-sm font-medium mb-1",
                    isTodayDay ? "text-dink-lime" : "text-default-600",
                  )}
                >
                  {day.getDate()}
                </div>

                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Tooltip
                      key={event.id}
                      content={
                        <div className="p-2">
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-xs">
                            {new Date(event.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {new Date(event.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs">
                            {event.current_registrations}/{event.max_capacity}{" "}
                            players
                          </p>
                        </div>
                      }
                    >
                      <Chip
                        className="w-full text-xs cursor-pointer truncate"
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
                    </Tooltip>
                  ))}

                  {dayEvents.length > 3 && (
                    <div className="text-xs text-default-400 text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
