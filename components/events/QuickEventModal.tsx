"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { TimeInput } from "@heroui/date-input";
import { Chip } from "@heroui/chip";
import { Slider } from "@heroui/slider";
import { Switch } from "@heroui/switch";
import { Icon } from "@iconify/react";
import { parseDate, parseTime } from "@internationalized/date";

import { EventType, EventColors } from "@/types/events";

interface QuickEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date | null;
  defaultTime?: string | null;
  onSubmit?: (data: any) => void;
}

const eventTypes: { key: EventType; label: string; icon: string }[] = [
  { key: "scramble", label: "Scramble", icon: "solar:game-linear" },
  { key: "dupr", label: "DUPR", icon: "solar:chart-square-linear" },
  {
    key: "open_play",
    label: "Open Play",
    icon: "solar:users-group-rounded-outline",
  },
  { key: "tournament", label: "Tournament", icon: "solar:trophy-linear" },
  { key: "league", label: "League", icon: "solar:cup-linear" },
  { key: "clinic", label: "Clinic", icon: "solar:education-linear" },
  { key: "private_lesson", label: "Private Lesson", icon: "solar:user-linear" },
];

export function QuickEventModal({
  isOpen,
  onClose,
  defaultDate,
  defaultTime,
  onSubmit,
}: QuickEventModalProps) {
  const [selectedType, setSelectedType] = useState<EventType>("scramble");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(
    defaultDate ? parseDate(defaultDate.toISOString().split("T")[0]) : null,
  );
  const [startTime, setStartTime] = useState(
    defaultTime ? parseTime(defaultTime) : parseTime("18:00"),
  );
  const [duration, setDuration] = useState(120);
  const [capacity, setCapacity] = useState(16);
  const [quickSettings, setQuickSettings] = useState({
    allSkillLevels: true,
    memberOnly: false,
    equipmentProvided: true,
  });

  const handleTypeSelect = (type: EventType) => {
    setSelectedType(type);

    // Set default values based on event type
    switch (type) {
      case "scramble":
        setDuration(120);
        setCapacity(16);
        break;
      case "dupr":
        setDuration(180);
        setCapacity(12);
        break;
      case "open_play":
        setDuration(120);
        setCapacity(20);
        break;
      case "tournament":
        setDuration(480);
        setCapacity(32);
        break;
      case "league":
        setDuration(180);
        setCapacity(16);
        break;
      case "clinic":
        setDuration(90);
        setCapacity(12);
        break;
      case "private_lesson":
        setDuration(60);
        setCapacity(1);
        break;
    }
  };

  const handleSubmit = () => {
    const eventData = {
      title:
        title ||
        `${selectedType.replace("_", " ").toUpperCase()} - ${date?.toString()}`,
      event_type: selectedType,
      date: date?.toDate(),
      start_time: startTime.toString(),
      duration_minutes: duration,
      max_capacity: capacity,
      ...quickSettings,
    };

    onSubmit?.(eventData);
    onClose();
  };

  return (
    <Modal
      classNames={{
        body: "py-6",
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "border border-dink-gray bg-black/90",
        header: "border-b border-dink-gray",
        footer: "border-t border-dink-gray",
      }}
      isOpen={isOpen}
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-dink-white">
            Quick Event Creation
          </h2>
          <p className="text-sm text-default-500">
            Select an event type to get started with pre-configured settings
          </p>
        </ModalHeader>

        <ModalBody>
          {/* Event Type Selection */}
          <div className="space-y-4">
            <div>
              <div className="text-sm text-default-600 mb-2 block">
                Event Type
              </div>
              <div className="grid grid-cols-4 gap-2">
                {eventTypes.map((type) => (
                  <Button
                    key={type.key}
                    className={
                      selectedType === type.key
                        ? "border-2"
                        : "border border-dink-gray"
                    }
                    style={
                      selectedType === type.key
                        ? {
                            backgroundColor: EventColors[type.key],
                            borderColor: EventColors[type.key],
                            color: "#000",
                          }
                        : {}
                    }
                    variant={selectedType === type.key ? "solid" : "bordered"}
                    onPress={() => handleTypeSelect(type.key)}
                  >
                    <Icon icon={type.icon} width={18} />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Title */}
            <Input
              classNames={{
                inputWrapper: "border-dink-gray",
              }}
              label="Event Title (optional)"
              placeholder={`${selectedType.replace("_", " ").toUpperCase()} Session`}
              value={title}
              variant="bordered"
              onValueChange={setTitle}
            />

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                classNames={{
                  inputWrapper: "border-dink-gray",
                }}
                label="Date"
                value={date}
                variant="bordered"
                onChange={setDate}
              />
              <TimeInput
                classNames={{
                  inputWrapper: "border-dink-gray",
                }}
                hourCycle={24}
                label="Start Time"
                value={startTime}
                variant="bordered"
                onChange={setStartTime}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm text-default-600 mb-2 block">
                Duration: {Math.floor(duration / 60)}h {duration % 60}m
              </label>
              <Slider
                className="max-w-full"
                color="primary"
                marks={[
                  { value: 60, label: "1h" },
                  { value: 120, label: "2h" },
                  { value: 180, label: "3h" },
                  { value: 240, label: "4h" },
                ]}
                maxValue={480}
                minValue={30}
                step={30}
                value={duration}
                onChange={(value) => setDuration(value as number)}
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="text-sm text-default-600 mb-2 block">
                Max Capacity: {capacity} players
              </label>
              <Slider
                className="max-w-full"
                color="primary"
                marks={[
                  { value: 8, label: "8" },
                  { value: 16, label: "16" },
                  { value: 24, label: "24" },
                  { value: 32, label: "32" },
                ]}
                maxValue={32}
                minValue={1}
                step={1}
                value={capacity}
                onChange={(value) => setCapacity(value as number)}
              />
            </div>

            {/* Quick Settings */}
            <div className="space-y-2">
              <Switch
                color="primary"
                isSelected={quickSettings.allSkillLevels}
                size="sm"
                onValueChange={(value) =>
                  setQuickSettings({ ...quickSettings, allSkillLevels: value })
                }
              >
                <span className="text-sm">All skill levels welcome</span>
              </Switch>
              <Switch
                color="primary"
                isSelected={quickSettings.memberOnly}
                size="sm"
                onValueChange={(value) =>
                  setQuickSettings({ ...quickSettings, memberOnly: value })
                }
              >
                <span className="text-sm">Members only</span>
              </Switch>
              <Switch
                color="primary"
                isSelected={quickSettings.equipmentProvided}
                size="sm"
                onValueChange={(value) =>
                  setQuickSettings({
                    ...quickSettings,
                    equipmentProvided: value,
                  })
                }
              >
                <span className="text-sm">Equipment provided</span>
              </Switch>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-lg bg-dink-gray/10 border border-dink-gray/30">
              <div className="text-xs text-default-500 mb-1">Preview</div>
              <div className="flex items-center gap-2">
                <Chip
                  size="sm"
                  style={{
                    backgroundColor: EventColors[selectedType],
                    color: "#000",
                  }}
                >
                  {selectedType.replace("_", " ")}
                </Chip>
                <span className="text-sm text-dink-white">
                  {title ||
                    `${selectedType.replace("_", " ").toUpperCase()} Session`}
                </span>
              </div>
              <div className="text-xs text-default-400 mt-1">
                {date?.toString()} at {startTime.toString()} •{" "}
                {Math.floor(duration / 60)}h {duration % 60}m • {capacity}{" "}
                players
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="mr-auto"
            variant="flat"
            onPress={() => {
              /* Handle advanced options */
            }}
          >
            Advanced Options
          </Button>
          <Button
            className="bg-dink-lime text-dink-black"
            color="primary"
            onPress={handleSubmit}
          >
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
