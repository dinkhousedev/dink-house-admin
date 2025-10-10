"use client";

import type { CourtBooking } from "@/types/bookings";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

import { PaymentStatusBadge } from "./PaymentStatusBadge";

interface BookingDetailModalProps {
  booking: CourtBooking | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingDetailModal({
  booking,
  isOpen,
  onClose,
}: BookingDetailModalProps) {
  if (!booking) return null;

  return (
    <Modal
      classNames={{
        base: "bg-[#0F0F0F] border border-dink-gray",
        header: "border-b border-dink-gray",
        footer: "border-t border-dink-gray",
      }}
      isOpen={isOpen}
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-dink-white">
              Booking Details
            </h3>
            <PaymentStatusBadge status={booking.payment_status} />
          </div>
        </ModalHeader>
        <ModalBody className="gap-6 py-6">
          {/* Event Info */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-default-500">
              Event Information
            </h4>
            <div className="space-y-2 rounded-lg bg-[#151515] p-4">
              <div className="flex items-center justify-between">
                <span className="text-default-500">Event Title</span>
                <span className="font-medium text-dink-white">
                  {booking.event_title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">Event Type</span>
                <Chip color="secondary" size="sm" variant="flat">
                  {booking.event_type}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">Date</span>
                <span className="font-medium text-dink-white">
                  {format(parseISO(booking.start_time), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">Time</span>
                <span className="font-medium text-dink-white">
                  {format(parseISO(booking.start_time), "h:mm a")} -{" "}
                  {format(parseISO(booking.end_time), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">Courts</span>
                <div className="flex flex-wrap gap-1">
                  {booking.courts.map((court) => (
                    <Chip
                      key={court.id}
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      Court {court.court_number}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-default-500">
              Player Information
            </h4>
            <div className="space-y-2 rounded-lg bg-[#151515] p-4">
              <div className="flex items-center justify-between">
                <span className="text-default-500">Name</span>
                <span className="font-medium text-dink-white">
                  {booking.player_name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">Email</span>
                <span className="font-medium text-dink-white">
                  {booking.player_email || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-default-500">
              Payment Information
            </h4>
            <div className="space-y-2 rounded-lg bg-[#151515] p-4">
              <div className="flex items-center justify-between">
                <span className="text-default-500">Amount</span>
                <span className="font-mono text-xl font-bold text-dink-lime">
                  ${booking.amount_paid}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">Status</span>
                <PaymentStatusBadge status={booking.payment_status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">Booking Source</span>
                <Chip
                  color={
                    booking.booking_source === "player_app"
                      ? "primary"
                      : "secondary"
                  }
                  size="sm"
                  startContent={
                    <Icon
                      icon={
                        booking.booking_source === "player_app"
                          ? "solar:smartphone-bold-duotone"
                          : "solar:user-id-bold-duotone"
                      }
                      width={14}
                    />
                  }
                  variant="flat"
                >
                  {booking.booking_source === "player_app"
                    ? "Player App"
                    : "Admin"}
                </Chip>
              </div>
            </div>
          </div>

          {/* Booking ID */}
          <div className="rounded-lg bg-[#151515] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-default-400">Booking ID</span>
              <span className="font-mono text-xs text-default-500">
                {booking.id}
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Close
          </Button>
          <Button
            as={Link}
            className="bg-dink-lime font-semibold text-black"
            href={`/dashboard/session_booking?event=${booking.event_id}`}
            startContent={<Icon icon="solar:calendar-bold" width={18} />}
          >
            View in Calendar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
