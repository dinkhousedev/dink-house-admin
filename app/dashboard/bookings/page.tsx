"use client";

import type {
  CourtBooking,
  BookingSource,
  PaymentStatus,
} from "@/types/bookings";

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
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { today, getLocalTimeZone } from "@internationalized/date";
import { format, parseISO } from "date-fns";

import { createClient } from "@/lib/supabase/client";
import { PaymentStatusBadge } from "@/components/dashboard/PaymentStatusBadge";
import { BookingDetailModal } from "@/components/dashboard/BookingDetailModal";

export default function BookingsDashboardPage() {
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState(today(getLocalTimeZone()));
  const [dateTo, setDateTo] = useState<any>(null);
  const [sourceFilter, setSourceFilter] = useState<BookingSource | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all",
  );
  const [selectedBooking, setSelectedBooking] = useState<CourtBooking | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const supabase = createClient();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        p_date_from: dateFrom
          ? new Date(
              dateFrom.year,
              dateFrom.month - 1,
              dateFrom.day,
            ).toISOString()
          : undefined,
        p_date_to: dateTo
          ? new Date(dateTo.year, dateTo.month - 1, dateTo.day).toISOString()
          : undefined,
        p_booking_source: sourceFilter !== "all" ? sourceFilter : undefined,
        p_payment_status: statusFilter !== "all" ? statusFilter : undefined,
      };

      // Remove undefined params
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) delete params[key];
      });

      const { data, error } = await supabase.rpc("get_all_bookings", params);

      if (error) throw error;
      if (data) setBookings(data as CourtBooking[]);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFrom, dateTo, sourceFilter, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleViewBooking = (booking: CourtBooking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const getSourceChip = (source: BookingSource) => {
    if (source === "player_app") {
      return (
        <Chip
          color="primary"
          size="sm"
          startContent={
            <Icon icon="solar:smartphone-bold-duotone" width={14} />
          }
          variant="flat"
        >
          Player App
        </Chip>
      );
    }

    return (
      <Chip
        color="secondary"
        size="sm"
        startContent={<Icon icon="solar:user-id-bold-duotone" width={14} />}
        variant="flat"
      >
        Admin
      </Chip>
    );
  };

  return (
    <div className="w-full p-6">
      <Card className="border border-dink-gray bg-[#0F0F0F]/90">
        <CardHeader className="flex-col items-start gap-3 p-6">
          <div className="flex w-full items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-dink-white">
                Court Bookings
              </h1>
              <p className="mt-2 text-sm text-default-500">
                View and manage all court bookings from both player app and
                admin dashboard
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Chip color="primary" size="lg" variant="flat">
                {bookings.length} Bookings
              </Chip>
              <Button
                className="bg-dink-lime text-black font-semibold"
                isLoading={refreshing}
                startContent={<Icon icon="solar:refresh-bold" width={20} />}
                onPress={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-4">
            <DatePicker
              classNames={{
                base: "bg-[#151515] border border-dink-gray",
              }}
              label="Date From"
              value={dateFrom}
              variant="bordered"
              onChange={(date) => date && setDateFrom(date)}
            />
            <DatePicker
              classNames={{
                base: "bg-[#151515] border border-dink-gray",
              }}
              label="Date To (Optional)"
              value={dateTo}
              variant="bordered"
              onChange={setDateTo}
            />
            <Select
              classNames={{
                trigger: "bg-[#151515] border border-dink-gray",
              }}
              label="Booking Source"
              selectedKeys={sourceFilter !== "all" ? [sourceFilter] : []}
              variant="bordered"
              onChange={(e) =>
                setSourceFilter((e.target.value as BookingSource) || "all")
              }
            >
              <SelectItem key="all">All Sources</SelectItem>
              <SelectItem key="player_app">Player App</SelectItem>
              <SelectItem key="admin_dashboard">Admin Dashboard</SelectItem>
            </Select>
            <Select
              classNames={{
                trigger: "bg-[#151515] border border-dink-gray",
              }}
              label="Payment Status"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              variant="bordered"
              onChange={(e) =>
                setStatusFilter((e.target.value as PaymentStatus) || "all")
              }
            >
              <SelectItem key="all">All Statuses</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="failed">Failed</SelectItem>
              <SelectItem key="refunded">Refunded</SelectItem>
            </Select>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table
            aria-label="Bookings table"
            classNames={{
              wrapper: "bg-transparent shadow-none p-6",
              th: "bg-[#151515] text-dink-white",
              td: "text-default-500",
            }}
          >
            <TableHeader>
              <TableColumn>DATE & TIME</TableColumn>
              <TableColumn>COURTS</TableColumn>
              <TableColumn>PLAYER</TableColumn>
              <TableColumn>AMOUNT</TableColumn>
              <TableColumn>PAYMENT</TableColumn>
              <TableColumn>SOURCE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="flex flex-col items-center justify-center py-12">
                  <Icon
                    className="text-default-300"
                    icon="solar:calendar-minimalistic-bold-duotone"
                    width={48}
                  />
                  <p className="mt-4 text-default-500">No bookings found</p>
                  <p className="text-xs text-default-400 mt-1">
                    Try adjusting your filters or date range
                  </p>
                </div>
              }
              isLoading={loading}
              loadingContent={<Spinner color="primary" />}
            >
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium text-dink-white">
                        {format(parseISO(booking.start_time), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-default-400">
                        {format(parseISO(booking.start_time), "h:mm a")} -{" "}
                        {format(parseISO(booking.end_time), "h:mm a")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium text-dink-white">
                        {booking.player_name || "Unknown"}
                      </p>
                      <p className="text-xs text-default-400">
                        {booking.player_email || "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono font-semibold text-dink-lime">
                      ${booking.amount_paid}
                    </p>
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={booking.payment_status} />
                  </TableCell>
                  <TableCell>{getSourceChip(booking.booking_source)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        className="text-default-500 hover:text-dink-lime"
                        size="sm"
                        variant="light"
                        onPress={() => handleViewBooking(booking)}
                      >
                        <Icon icon="solar:eye-linear" width={20} />
                      </Button>
                      {booking.payment_status === "completed" && (
                        <Button
                          isIconOnly
                          className="text-danger hover:text-danger-600"
                          size="sm"
                          variant="light"
                        >
                          <Icon icon="solar:close-circle-linear" width={20} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
