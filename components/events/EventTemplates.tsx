"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Icon } from "@iconify/react";

import { EventTemplate, EventColors } from "@/types/events";

// Mock templates - replace with actual data
const mockTemplates: EventTemplate[] = [
  {
    id: "1",
    name: "Tuesday Night Scramble",
    description: "Popular weekly scramble format",
    event_type: "event_scramble",
    duration_minutes: 120,
    max_capacity: 16,
    min_capacity: 8,
    skill_levels: ["2.5", "3.0", "3.5", "4.0"],
    price_member: 15,
    price_guest: 20,
    equipment_provided: true,
    is_active: true,
    times_used: 47,
  },
  {
    id: "2",
    name: "DUPR Friday Night",
    description: "Official DUPR-rated matches",
    event_type: "dupr_open_play",
    duration_minutes: 180,
    max_capacity: 12,
    min_capacity: 4,
    skill_levels: ["3.0", "3.5", "4.0", "4.5", "5.0"],
    price_member: 20,
    price_guest: 25,
    equipment_provided: false,
    is_active: true,
    times_used: 32,
  },
  {
    id: "3",
    name: "Beginner Open Play",
    description: "Relaxed open play for beginners",
    event_type: "open_play",
    duration_minutes: 120,
    max_capacity: 20,
    min_capacity: 4,
    skill_levels: ["2.0", "2.5", "3.0"],
    price_member: 10,
    price_guest: 15,
    equipment_provided: true,
    is_active: true,
    times_used: 28,
  },
  {
    id: "4",
    name: "Weekend Tournament",
    description: "Competitive weekend tournament",
    event_type: "dupr_tournament",
    duration_minutes: 480,
    max_capacity: 32,
    min_capacity: 16,
    skill_levels: ["3.5", "4.0", "4.5", "5.0", "5.0+"],
    price_member: 50,
    price_guest: 60,
    equipment_provided: false,
    is_active: true,
    times_used: 12,
  },
];

interface EventTemplatesProps {
  onTemplateSelect?: (template: EventTemplate) => void;
}

export function EventTemplates({ onTemplateSelect }: EventTemplatesProps) {
  const handleDragStart = (e: React.DragEvent, template: EventTemplate) => {
    e.dataTransfer.setData("template", JSON.stringify(template));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Card className="h-full border border-dink-gray bg-black/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-dink-white">
            Event Templates
          </h3>
          <Button
            className="bg-dink-gray/20"
            size="sm"
            startContent={<Icon icon="solar:add-circle-linear" width={16} />}
            variant="flat"
          >
            New
          </Button>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <ScrollShadow className="h-[600px]">
          <div className="space-y-2 p-4">
            {mockTemplates.map((template) => (
              <Card
                key={template.id}
                draggable
                isPressable
                className="border border-dink-gray/30 bg-black/20 cursor-move hover:bg-dink-gray/10 transition-colors"
                onDragStart={(e) => handleDragStart(e, template)}
                onPress={() => onTemplateSelect?.(template)}
              >
                <CardBody className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: `${EventColors[template.event_type]}20`,
                        color: EventColors[template.event_type],
                        borderColor: EventColors[template.event_type],
                        borderWidth: "1px",
                      }}
                      variant="flat"
                    >
                      {template.event_type.replace("_", " ")}
                    </Chip>
                    <Icon
                      className="text-default-400"
                      icon="solar:drag-vertical-linear"
                      width={16}
                    />
                  </div>

                  <h4 className="font-semibold text-sm text-dink-white mb-1">
                    {template.name}
                  </h4>
                  <p className="text-xs text-default-400 mb-2">
                    {template.description}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-default-500">Duration</span>
                      <span className="text-dink-white">
                        {Math.floor(template.duration_minutes / 60)}h{" "}
                        {template.duration_minutes % 60 > 0 &&
                          `${template.duration_minutes % 60}m`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-default-500">Capacity</span>
                      <span className="text-dink-white">
                        {template.min_capacity}-{template.max_capacity} players
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-default-500">Skill Levels</span>
                      <span className="text-dink-white">
                        {template.skill_levels[0]} -{" "}
                        {
                          template.skill_levels[
                            template.skill_levels.length - 1
                          ]
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-default-500">Pricing</span>
                      <span className="text-dink-white">
                        ${template.price_member} / ${template.price_guest}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-dink-gray/20">
                    <div className="flex gap-2">
                      {template.equipment_provided && (
                        <Chip color="success" size="sm" variant="dot">
                          <span className="text-xs">Equipment</span>
                        </Chip>
                      )}
                    </div>
                    <span className="text-xs text-default-400">
                      Used {template.times_used}x
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </ScrollShadow>

        <div className="p-4 border-t border-dink-gray/30">
          <p className="text-xs text-default-400 text-center">
            Drag templates onto the calendar to create events
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
