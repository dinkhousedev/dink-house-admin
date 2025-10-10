"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Icon } from "@iconify/react";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import { QRCodeScanner } from "@/components/events/QRCodeScanner";
import { notify } from "@/lib/notifications";

interface EventOption {
  id: string;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
}

interface Registration {
  registration_id: string;
  player_id: string;
  player_name: string;
  dupr_rating: number | null;
  skill_level: string | null;
  registration_time: string;
  check_in_time: string | null;
  checked_in: boolean;
}

interface CheckInStatus {
  event_id: string;
  event_title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  total_registered: number;
  total_checked_in: number;
  registrations: Registration[];
}

export default function LiveEventsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch upcoming events on mount
  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  // Fetch check-in status when event is selected
  useEffect(() => {
    if (selectedEventId) {
      fetchCheckInStatus();
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchCheckInStatus, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedEventId]);

  const fetchUpcomingEvents = async () => {
    setEventsLoading(true);
    try {
      // Fetch events happening today or in the near future
      const response = await fetch("/api/events/upcoming");
      const data = await response.json();

      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      notify.error("Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchCheckInStatus = useCallback(async () => {
    if (!selectedEventId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/events/${selectedEventId}/registrations`,
      );
      const data = await response.json();

      if (data.success && data.data) {
        setCheckInStatus(data.data);
      }
    } catch (error) {
      console.error("Error fetching check-in status:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  const handleCheckIn = async (playerId: string) => {
    if (!selectedEventId) return;

    try {
      const response = await fetch(`/api/events/${selectedEventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.already_checked_in) {
          notify.warning(result.message || "Player already checked in");
        } else {
          notify.success(`✓ ${result.player_name} checked in successfully!`);
        }
        // Refresh the check-in status
        fetchCheckInStatus();
      } else {
        notify.error(result.error || "Check-in failed");
      }
    } catch (error) {
      console.error("Error checking in player:", error);
      notify.error("Failed to check in player");
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="w-full p-6">
      <Card className="border border-dink-gray bg-[#0F0F0F]/90">
        <CardHeader className="flex-col items-start gap-4 p-6">
          <div className="flex w-full items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-dink-white">
                Live Event Check-In
              </h1>
              <p className="mt-2 text-sm text-default-500">
                Real-time QR code check-in and player management
              </p>
            </div>
            <Button
              className="bg-dink-lime text-dink-black"
              size="lg"
              startContent={<Icon icon="solar:qr-scan-bold" width={24} />}
              onPress={onOpen}
            >
              Open Scanner
            </Button>
          </div>

          {/* Event Selector */}
          <div className="w-full max-w-md">
            <Select
              classNames={{
                trigger: "bg-[#151515] border border-dink-gray",
              }}
              isLoading={eventsLoading}
              label="Select Event"
              placeholder="Choose an event to monitor"
              selectedKeys={selectedEventId ? [selectedEventId] : []}
              variant="bordered"
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((event) => (
                <SelectItem key={event.id} textValue={event.title}>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-default-500">
                      {new Date(event.start_time).toLocaleString()} -{" "}
                      {formatTime(event.end_time)}
                    </p>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardHeader>

        <CardBody className="gap-6 p-6">
          {!selectedEventId ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Icon
                className="text-default-300"
                icon="solar:calendar-mark-outline"
                width={64}
              />
              <p className="mt-4 text-default-500">
                Select an event to view check-in status
              </p>
            </div>
          ) : loading && !checkInStatus ? (
            <div className="flex items-center justify-center py-16">
              <Spinner color="primary" size="lg" />
            </div>
          ) : checkInStatus ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="border border-dink-gray bg-[#151515]">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-500">Total Registered</p>
                    <p className="text-3xl font-bold text-dink-white">
                      {checkInStatus.total_registered}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border border-dink-gray bg-[#151515]">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-500">Checked In</p>
                    <p className="text-3xl font-bold text-success">
                      {checkInStatus.total_checked_in}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border border-dink-gray bg-[#151515]">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-500">
                      Awaiting Check-In
                    </p>
                    <p className="text-3xl font-bold text-warning">
                      {checkInStatus.total_registered -
                        checkInStatus.total_checked_in}
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Registrations Table */}
              <Card className="border border-dink-gray bg-[#151515]">
                <CardHeader className="border-b border-dink-gray p-4">
                  <h3 className="font-semibold text-dink-white">
                    Player List & DUPR Ratings
                  </h3>
                </CardHeader>
                <CardBody className="p-0">
                  <Table
                    aria-label="Event registrations"
                    classNames={{
                      wrapper: "bg-transparent shadow-none",
                      th: "bg-[#0F0F0F] text-dink-white",
                      td: "text-default-500",
                    }}
                  >
                    <TableHeader>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>PLAYER NAME</TableColumn>
                      <TableColumn>DUPR RATING</TableColumn>
                      <TableColumn>SKILL LEVEL</TableColumn>
                      <TableColumn>REGISTERED</TableColumn>
                      <TableColumn>CHECKED IN</TableColumn>
                    </TableHeader>
                    <TableBody
                      emptyContent="No players registered yet"
                      items={checkInStatus.registrations}
                    >
                      {(registration) => (
                        <TableRow key={registration.registration_id}>
                          <TableCell>
                            {registration.checked_in ? (
                              <Chip
                                color="success"
                                size="sm"
                                startContent={
                                  <Icon
                                    icon="solar:check-circle-bold"
                                    width={16}
                                  />
                                }
                                variant="flat"
                              >
                                Checked In
                              </Chip>
                            ) : (
                              <Chip color="warning" size="sm" variant="flat">
                                Awaiting
                              </Chip>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-dink-white">
                              {registration.player_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            {registration.dupr_rating ? (
                              <span className="font-mono text-sm font-semibold text-dink-lime">
                                {registration.dupr_rating.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-default-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {registration.skill_level ? (
                              <Chip color="default" size="sm" variant="flat">
                                {registration.skill_level}
                              </Chip>
                            ) : (
                              <span className="text-default-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatTime(registration.registration_time)}
                          </TableCell>
                          <TableCell>
                            {registration.check_in_time ? (
                              <span className="text-success">
                                {formatTime(registration.check_in_time)}
                              </span>
                            ) : (
                              <span className="text-default-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </>
          ) : null}
        </CardBody>
      </Card>

      {/* QR Scanner Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          base: "bg-[#0F0F0F] border border-dink-gray",
          header: "border-b border-dink-gray",
          body: "py-6",
          footer: "border-t border-dink-gray",
        }}
        isOpen={isOpen}
        size="2xl"
        onClose={() => {
          setIsScanning(false);
          onClose();
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-dink-white">
              QR Code Scanner
            </h3>
          </ModalHeader>
          <ModalBody>
            {!selectedEventId ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Icon
                  className="text-warning"
                  icon="solar:danger-triangle-bold"
                  width={48}
                />
                <p className="text-default-500">
                  Please select an event first before scanning
                </p>
              </div>
            ) : (
              <QRCodeScanner
                eventId={selectedEventId}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
                onScan={handleCheckIn}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onPress={() => {
                setIsScanning(false);
                onClose();
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
