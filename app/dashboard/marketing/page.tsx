"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Icon } from "@iconify/react";

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  is_active: boolean;
  source: string;
  engagement_score: number;
  tags: string[] | null;
}

interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  newThisWeek: number;
  newLastWeek: number;
  growthRate: string;
}

export default function MarketingPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/subscribers?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setSubscribers(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/subscribers/count");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = () => {
    const headers = ["Email", "First Name", "Last Name", "Created At", "Status"];
    const csvData = subscribers.map((sub) => [
      sub.email,
      sub.first_name || "",
      sub.last_name || "",
      formatDate(sub.created_at),
      sub.is_active ? "Active" : "Inactive",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 2xl:gap-8">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:letter-unread-linear"
                  width={22}
                />
              </div>
              <Chip color="primary" size="sm" variant="flat">
                {stats?.growthRate || "+0%"}
              </Chip>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                Total Subscribers
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {stats?.active.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-dink-lime">
                {stats?.newThisWeek || 0} new this week
              </p>
            </div>
          </CardBody>
        </Card>

        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:user-check-rounded-linear"
                  width={22}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                Active
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {stats?.active.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-default-400">
                {stats?.inactive || 0} inactive
              </p>
            </div>
          </CardBody>
        </Card>

        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:chart-2-linear"
                  width={22}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                This Week
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {stats?.newThisWeek.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-default-400">
                {stats?.newLastWeek || 0} last week
              </p>
            </div>
          </CardBody>
        </Card>

        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:database-linear"
                  width={22}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                Total Records
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {stats?.total.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-default-400">all time</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subscribers Table */}
      <Card
        className="border border-dink-gray/80 bg-[#0C0C0C]/90"
        radius="lg"
      >
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-athletic text-xs text-default-500">
              Email Marketing
            </p>
            <h2 className="text-xl font-semibold text-dink-white">
              Newsletter Subscribers
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              classNames={{
                inputWrapper:
                  "border border-dink-gray/60 bg-black/30 data-[hover=true]:bg-black/40",
              }}
              placeholder="Search by email or name..."
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:magnifer-linear"
                  width={18}
                />
              }
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button
              className="min-w-[140px]"
              color="primary"
              radius="lg"
              startContent={
                <Icon icon="solar:download-linear" width={18} />
              }
              variant="flat"
              onPress={exportToCSV}
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Table
            aria-label="Subscribers table"
            classNames={{
              wrapper: "bg-transparent shadow-none",
              th: "bg-[#141414] text-default-500 text-xs uppercase tracking-wider",
              td: "text-sm",
            }}
            isStriped
          >
            <TableHeader>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>FIRST NAME</TableColumn>
              <TableColumn>LAST NAME</TableColumn>
              <TableColumn>CREATED AT</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                loading ? "Loading subscribers..." : "No subscribers found"
              }
              items={subscribers}
            >
              {(subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium text-dink-white">
                    {subscriber.email}
                  </TableCell>
                  <TableCell className="text-default-400">
                    {subscriber.first_name || "-"}
                  </TableCell>
                  <TableCell className="text-default-400">
                    {subscriber.last_name || "-"}
                  </TableCell>
                  <TableCell className="text-default-400">
                    {formatDate(subscriber.created_at)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={subscriber.is_active ? "success" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {subscriber.is_active ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                classNames={{
                  cursor: "bg-dink-gradient text-dink-black",
                }}
                page={currentPage}
                showControls
                total={totalPages}
                onChange={setCurrentPage}
              />
            </div>
          )}

          <div className="mt-4 text-center text-xs text-default-500">
            Showing {subscribers.length} of {totalCount.toLocaleString()}{" "}
            subscribers
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
