"use client";

import { useMemo } from "react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import clsx from "clsx";

import { Event, EventColors } from "@/types/events";

interface CalendarGridProps {
  date: Date;
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onCellClick?: (date: Date) => void;
  onShowMore?: (date: Date) => void;
}

export function CalendarGrid({
  date,
  events = [],
  onEventClick,
  onCellClick,
  onShowMore,
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
    // First filter events for this day
    const dayEvents = events.filter((event) => {
      // Parse event time and convert to local timezone for comparison
      const eventDate = new Date(event.start_time);

      // Get local date components (browser's timezone)
      const eventLocalDate = new Date(
        eventDate.toLocaleString("en-US", { timeZone: "America/Chicago" }),
      );

      return (
        eventLocalDate.getDate() === day.getDate() &&
        eventLocalDate.getMonth() === day.getMonth() &&
        eventLocalDate.getFullYear() === day.getFullYear()
      );
    });

    // Deduplicate by unique event ID to prevent duplicate display
    // This is a defensive measure in case backend sends duplicates
    const seen = new Set<string>();

    return dayEvents.filter((event) => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);

      return true;
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
      <div className="grid grid-cols-7 gap-2 mb-2">
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
      <div className="grid grid-cols-7 gap-2">
        {calendar.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);

          return (
            <Card
              key={index}
              className={clsx(
                "min-h-[140px] border border-dink-gray/50 bg-black/20 p-3 transition-all",
                !isCurrentMonthDay && "opacity-40",
                isTodayDay && "border-dink-lime bg-dink-lime/5",
              )}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={clsx(
                      "text-sm font-medium",
                      isTodayDay ? "text-dink-lime" : "text-default-600",
                    )}
                  >
                    {day.getDate()}
                  </div>
                  {isCurrentMonthDay && (
                    <Button
                      isIconOnly
                      className="h-5 w-5 min-w-5 bg-dink-lime/20 hover:bg-dink-lime/30 transition-colors"
                      size="sm"
                      variant="flat"
                      onPress={() => onCellClick?.(day)}
                    >
                      <Icon
                        className="text-dink-lime"
                        icon="solar:add-circle-bold"
                        width={14}
                      />
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Tooltip
                      key={event.id}
                      content={
                        <div className="p-2">
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-xs">
                            {new Date(event.start_time).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Chicago",
                              },
                            )}
                            {" - "}
                            {new Date(event.end_time).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Chicago",
                              },
                            )}
                          </p>
                          <p className="text-xs">
                            {event.current_registrations}/{event.max_capacity}{" "}
                            players
                          </p>
                        </div>
                      }
                    >
                      <Chip
                        className="w-full text-[10px] cursor-pointer"
                        size="sm"
                        style={{
                          backgroundColor: `${EventColors[event.event_type]}20`,
                          borderColor: EventColors[event.event_type],
                          borderWidth: "1px",
                          whiteSpace: "normal",
                          height: "auto",
                          minHeight: "20px",
                        }}
                        variant="flat"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <span
                          className="block leading-tight py-0.5"
                          style={{
                            color: EventColors[event.event_type],
                            wordBreak: "break-word",
                          }}
                        >
                          {event.title}
                        </span>
                      </Chip>
                    </Tooltip>
                  ))}

                  {dayEvents.length > 3 && (
                    <div
                      className="text-xs text-dink-lime hover:text-dink-lime/80 text-center w-full py-1 transition-colors font-medium cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowMore?.(day);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onShowMore?.(day);
                        }
                      }}
                    >
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
