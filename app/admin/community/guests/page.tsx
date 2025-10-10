"use client";

import type { Player } from "@/types/bookings";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import { createClient } from "@/lib/supabase/client";
import { StaffBookingModal } from "@/components/events/StaffBookingModal";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Player | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isBookingOpen,
    onOpen: onBookingOpen,
    onClose: onBookingClose,
  } = useDisclosure();

  const supabase = createClient();
  const pageSize = 20;

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("players")
        .select("*", { count: "exact" })
        .eq("membership_level", "guest")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;
      if (data) {
        setGuests(data as Player[]);
        setTotal(count || 0);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      }
    } catch (error) {
      console.error("Error fetching guests:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleQuickBook = (guest: Player) => {
    setSelectedGuest(guest);
    onBookingOpen();
  };

  return (
    <div className="w-full p-6">
      <Card className="border border-dink-gray bg-[#0F0F0F]/90">
        <CardHeader className="flex-col items-start gap-3 p-6">
          <div className="flex w-full items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-dink-white">
                Guest Profiles
              </h1>
              <p className="mt-2 text-sm text-default-500">
                Manage guest profiles and book court times
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Chip color="primary" size="lg" variant="flat">
                {total} Total Guests
              </Chip>
              <Button
                className="bg-dink-lime text-black font-semibold"
                startContent={<Icon icon="solar:user-plus-bold" width={20} />}
                onPress={onOpen}
              >
                Add Guest
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 w-full max-w-md">
            <Input
              classNames={{
                input: "text-sm",
                inputWrapper: "bg-[#151515] border border-dink-gray",
              }}
              placeholder="Search by name or email..."
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:magnifer-linear"
                  width={20}
                />
              }
              value={search}
              variant="bordered"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table
            aria-label="Guests table"
            bottomContent={
              totalPages > 1 ? (
                <div className="flex w-full justify-center p-4">
                  <Pagination
                    showControls
                    color="primary"
                    page={page}
                    total={totalPages}
                    onChange={(newPage) => setPage(newPage)}
                  />
                </div>
              ) : null
            }
            classNames={{
              wrapper: "bg-transparent shadow-none p-6",
              th: "bg-[#151515] text-dink-white",
              td: "text-default-500",
            }}
          >
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>CONTACT</TableColumn>
              <TableColumn>SKILL LEVEL</TableColumn>
              <TableColumn>DUPR RATING</TableColumn>
              <TableColumn>JOINED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="flex flex-col items-center justify-center py-12">
                  <Icon
                    className="text-default-300"
                    icon="solar:users-group-rounded-outline"
                    width={48}
                  />
                  <p className="mt-4 text-default-500">No guests found</p>
                  {search && (
                    <p className="text-xs text-default-400 mt-1">
                      Try a different search term
                    </p>
                  )}
                </div>
              }
              isLoading={loading}
              loadingContent={<Spinner color="primary" />}
            >
              {guests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium text-dink-white">
                        {guest.first_name} {guest.last_name}
                      </p>
                      {guest.display_name && (
                        <p className="text-xs text-default-400">
                          &quot;{guest.display_name}&quot;
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-sm">{guest.email || "-"}</p>
                      <p className="text-xs text-default-400">
                        {guest.phone || "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {guest.skill_level ? (
                      <Chip color="primary" size="sm" variant="flat">
                        {guest.skill_level}
                      </Chip>
                    ) : (
                      <span className="text-default-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">
                      {guest.dupr_rating?.toFixed(2) || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {guest.created_at
                      ? new Date(guest.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        className="text-default-500 hover:text-dink-lime"
                        size="sm"
                        variant="light"
                      >
                        <Icon icon="solar:eye-linear" width={20} />
                      </Button>
                      <Button
                        className="bg-dink-lime/20 text-dink-lime hover:bg-dink-lime/30"
                        size="sm"
                        startContent={
                          <Icon icon="solar:calendar-add-bold" width={18} />
                        }
                        variant="flat"
                        onPress={() => handleQuickBook(guest)}
                      >
                        Quick Book
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add Guest Modal */}
      <Modal isOpen={isOpen} size="2xl" onOpenChange={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add New Guest</ModalHeader>
              <ModalBody>
                <p className="text-default-500">
                  Guest creation form will be implemented here.
                </p>
                <p className="text-xs text-default-400 mt-2">
                  For now, guests are created when they sign up through the
                  player app.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Booking Modal */}
      {selectedGuest && (
        <StaffBookingModal
          isOpen={isBookingOpen}
          selectedPlayer={selectedGuest}
          onClose={onBookingClose}
          onSuccess={() => {
            onBookingClose();
            // Optionally show success message
          }}
        />
      )}
    </div>
  );
}
