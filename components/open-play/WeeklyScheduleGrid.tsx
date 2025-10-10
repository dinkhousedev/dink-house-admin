"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Icon } from "@iconify/react";

import { ScheduleBlockCard } from "./ScheduleBlockCard";

interface WeeklyScheduleGridProps {
  scheduleBlocks: any[];
  courts: any[];
  selectedBlockIds: string[];
  viewMode: "grid" | "list";
  onBlockSelect: (blockId: string, selected: boolean) => void;
  onRefresh: () => void;
}

export function WeeklyScheduleGrid({
  scheduleBlocks,
  courts,
  selectedBlockIds,
  viewMode,
  onBlockSelect,
  onRefresh,
}: WeeklyScheduleGridProps) {
  const daysOfWeek = [
    { day: 0, name: "Sunday", short: "Sun" },
    { day: 1, name: "Monday", short: "Mon" },
    { day: 2, name: "Tuesday", short: "Tue" },
    { day: 3, name: "Wednesday", short: "Wed" },
    { day: 4, name: "Thursday", short: "Thu" },
    { day: 5, name: "Friday", short: "Fri" },
    { day: 6, name: "Saturday", short: "Sat" },
  ];

  const getBlocksForDay = (dayOfWeek: number) => {
    return scheduleBlocks
      .filter((block) => block.day_of_week === dayOfWeek)
      .sort((a, b) => {
        const timeA = a.start_time.split(":").map(Number);
        const timeB = b.start_time.split(":").map(Number);

        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case "divided_by_skill":
        return "bg-blue-500/20 border-blue-500/50 text-blue-400";
      case "mixed_levels":
        return "bg-green-500/20 border-green-500/50 text-green-400";
      case "dedicated_skill":
        return "bg-purple-500/20 border-purple-500/50 text-purple-400";
      case "special_event":
        return "bg-dink-lime/20 border-dink-lime/50 text-dink-lime";
      default:
        return "bg-gray-500/20 border-gray-500/50 text-gray-400";
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="bg-black/40 border border-dink-gray">
        <CardHeader>
          <h3 className="text-xl font-semibold text-dink-white">
            All Schedule Blocks
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {scheduleBlocks.length === 0 ? (
              <div className="text-center py-12 text-dink-white/50">
                <Icon
                  className="mx-auto mb-4"
                  icon="solar:calendar-linear"
                  width={64}
                />
                <p>No schedule blocks found</p>
                <p className="text-sm mt-2">
                  Create your first block to get started
                </p>
              </div>
            ) : (
              scheduleBlocks.map((block) => (
                <ScheduleBlockCard
                  key={block.id}
                  courts={courts}
                  isSelected={selectedBlockIds.includes(block.id)}
                  scheduleBlock={block}
                  onRefresh={onRefresh}
                  onSelect={(selected) => onBlockSelect(block.id, selected)}
                />
              ))
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
      {daysOfWeek.map(({ day, name, short }) => {
        const blocksForDay = getBlocksForDay(day);

        return (
          <Card
            key={day}
            className="bg-black/40 border border-dink-gray min-h-[400px]"
          >
            <CardHeader className="flex flex-col gap-2 pb-3">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-bold text-dink-white">{name}</h3>
                <span className="text-xs text-dink-white/60 font-mono">
                  {blocksForDay.length}
                </span>
              </div>
              <div className="w-full h-1 bg-dink-lime/20 rounded-full" />
            </CardHeader>

            <CardBody className="space-y-3">
              {blocksForDay.length === 0 ? (
                <div className="text-center py-8 text-dink-white/30">
                  <Icon
                    className="mx-auto mb-2"
                    icon="solar:calendar-linear"
                    width={32}
                  />
                  <p className="text-xs">No blocks</p>
                </div>
              ) : (
                blocksForDay.map((block) => (
                  <ScheduleBlockCard
                    key={block.id}
                    compact
                    courts={courts}
                    isSelected={selectedBlockIds.includes(block.id)}
                    scheduleBlock={block}
                    onRefresh={onRefresh}
                    onSelect={(selected) => onBlockSelect(block.id, selected)}
                  />
                ))
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
