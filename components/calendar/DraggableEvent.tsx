"use client";

import { ReactNode, DragEvent } from "react";

import { Event } from "@/types/events";

interface DraggableEventProps {
  event: Event;
  children: ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function DraggableEvent({
  event,
  children,
  onDragStart,
  onDragEnd,
}: DraggableEventProps) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    // Set drag data
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(event));

    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }

    onDragStart?.();
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }

    onDragEnd?.();
  };

  return (
    <div
      draggable
      className="cursor-move w-full h-full"
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      {children}
    </div>
  );
}
