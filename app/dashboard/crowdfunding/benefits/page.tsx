"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import { Icon } from "@iconify/react";

interface Benefit {
  allocation_id: string;
  backer_id: string;
  email: string;
  first_name: string;
  last_initial: string;
  phone: string | null;
  benefit_type: string;
  benefit_name: string;
  total_allocated: number | null;
  remaining: number | null;
  valid_until: string | null;
  fulfillment_status: string;
  created_at: string;
  tier_name: string;
  contribution_amount: number;
  days_until_expiration: number | null;
}

interface BenefitSummary {
  benefit_type: string;
  total_allocations: number;
  pending_count: number;
  in_progress_count: number;
  fulfilled_count: number;
  expired_count: number;
  total_units_allocated: number | null;
  total_units_used: number | null;
  total_units_remaining: number | null;
}

export default function BenefitManagementPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [summary, setSummary] = useState<BenefitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const itemsPerPage = 20;

  const fetchBenefits = useCallback(async () => {
    try {
      setLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      let query = supabase
        .schema("crowdfunding")
        .from("v_pending_fulfillment")
        .select("*")
        .order("days_until_expiration", { ascending: true });

      if (filterType && filterType !== "all") {
        query = query.eq("benefit_type", filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error("Error fetching benefits:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  const fetchSummary = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase
        .schema("crowdfunding")
        .from("v_fulfillment_summary")
        .select("*")
        .order("benefit_type");

      if (error) throw error;
      setSummary(data || []);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, []);

  useEffect(() => {
    fetchBenefits();
    fetchSummary();
  }, [fetchBenefits, fetchSummary]);

  const handleStatusUpdate = async () => {
    if (!selectedBenefit || !newStatus) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const updateData: any = {
        fulfillment_status: newStatus,
        fulfillment_notes: statusNotes,
      };

      if (newStatus === "fulfilled") {
        updateData.fulfilled_at = new Date().toISOString();
        // TODO: Get actual staff ID from auth
        // updateData.fulfilled_by = staffId;
      }

      const { error } = await supabase
        .schema("crowdfunding")
        .from("benefit_allocations")
        .update(updateData)
        .eq("id", selectedBenefit.allocation_id);

      if (error) throw error;

      setShowStatusModal(false);
      setSelectedBenefit(null);
      setNewStatus("");
      setStatusNotes("");
      fetchBenefits();
      fetchSummary();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredBenefits = benefits.filter((benefit) => {
    const matchesSearch =
      !searchQuery ||
      benefit.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benefit.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benefit.benefit_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const paginatedBenefits = filteredBenefits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredBenefits.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "allocated":
        return "primary";
      case "in_progress":
        return "warning";
      case "fulfilled":
        return "success";
      case "expired":
        return "danger";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  const formatBenefitType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Benefit Fulfillment</h1>
            <p className="text-gray-400 mt-1">
              Track and manage crowdfunding benefit redemptions
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summary.slice(0, 4).map((item) => (
            <Card key={item.benefit_type} className="bg-zinc-900">
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400">
                      {formatBenefitType(item.benefit_type)}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {item.total_allocations}
                    </p>
                  </div>
                  <Icon
                    icon="solar:gift-bold"
                    className="text-[#B3FF00]"
                    width={24}
                  />
                </div>
                <div className="flex gap-2 mt-3 text-xs">
                  <Chip size="sm" color="warning" variant="flat">
                    {item.pending_count} pending
                  </Chip>
                  <Chip size="sm" color="success" variant="flat">
                    {item.fulfilled_count} done
                  </Chip>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="bg-zinc-900">
          <CardBody>
            <div className="flex gap-4">
              <Input
                placeholder="Search by name, email, or benefit..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={
                  <Icon icon="solar:magnifer-linear" width={20} />
                }
                className="max-w-md"
              />
              <Select
                label="Filter by Type"
                selectedKeys={filterType ? [filterType] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  setFilterType(selected as string);
                }}
                className="max-w-xs"
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="court_time_hours">Court Time</SelectItem>
                <SelectItem key="dink_board_sessions">Dink Board</SelectItem>
                <SelectItem key="ball_machine_sessions">Ball Machine</SelectItem>
                <SelectItem key="pro_shop_discount">Pro Shop Discount</SelectItem>
                <SelectItem key="membership_months">Membership</SelectItem>
                <SelectItem key="private_lessons">Private Lessons</SelectItem>
                <SelectItem key="recognition">Recognition</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Benefits Table */}
        <Card className="bg-zinc-900">
          <CardHeader className="border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">
              Pending Benefits ({filteredBenefits.length})
            </h2>
          </CardHeader>
          <CardBody>
            <Table
              aria-label="Benefits table"
              className="dark"
              classNames={{
                wrapper: "bg-zinc-900",
                th: "bg-zinc-800 text-white",
                td: "text-gray-300",
              }}
            >
              <TableHeader>
                <TableColumn>BACKER</TableColumn>
                <TableColumn>BENEFIT</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>EXPIRES</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody
                items={paginatedBenefits}
                isLoading={loading}
                emptyContent="No pending benefits found"
              >
                {(benefit) => (
                  <TableRow key={benefit.allocation_id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-white">
                          {benefit.first_name} {benefit.last_initial}.
                        </p>
                        <p className="text-sm text-gray-400">{benefit.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{benefit.benefit_name}</p>
                      <p className="text-xs text-gray-500">{benefit.tier_name}</p>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {formatBenefitType(benefit.benefit_type)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {benefit.remaining !== null ? (
                        <span>
                          {benefit.remaining} / {benefit.total_allocated}
                        </span>
                      ) : (
                        <span className="text-gray-500">Unlimited</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(benefit.fulfillment_status)}
                        variant="flat"
                      >
                        {benefit.fulfillment_status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {benefit.days_until_expiration !== null ? (
                        <span
                          className={
                            benefit.days_until_expiration < 30
                              ? "text-red-400 font-semibold"
                              : ""
                          }
                        >
                          {benefit.days_until_expiration} days
                        </span>
                      ) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          setSelectedBenefit(benefit);
                          setShowStatusModal(true);
                        }}
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                  classNames={{
                    item: "bg-zinc-800 text-white",
                    cursor: "bg-[#B3FF00] text-black",
                  }}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedBenefit(null);
          setNewStatus("");
          setStatusNotes("");
        }}
        size="lg"
      >
        <ModalContent className="bg-zinc-900 text-white">
          <ModalHeader>Update Benefit Status</ModalHeader>
          <ModalBody>
            {selectedBenefit && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Backer</p>
                  <p className="font-semibold">
                    {selectedBenefit.first_name} {selectedBenefit.last_initial}.
                  </p>
                  <p className="text-sm text-gray-500">{selectedBenefit.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Benefit</p>
                  <p>{selectedBenefit.benefit_name}</p>
                </div>
                <Select
                  label="New Status"
                  placeholder="Select status"
                  selectedKeys={newStatus ? [newStatus] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setNewStatus(selected as string);
                  }}
                >
                  <SelectItem key="in_progress">In Progress</SelectItem>
                  <SelectItem key="fulfilled">Fulfilled</SelectItem>
                  <SelectItem key="cancelled">Cancelled</SelectItem>
                </Select>
                <Input
                  label="Notes (optional)"
                  placeholder="Add notes about this update..."
                  value={statusNotes}
                  onValueChange={setStatusNotes}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setShowStatusModal(false);
                setSelectedBenefit(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#B3FF00] text-black"
              onPress={handleStatusUpdate}
              isDisabled={!newStatus}
            >
              Update Status
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
