"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Icon } from "@iconify/react";

interface RecognitionItem {
  id: string;
  allocation_id: string;
  backer_id: string;
  item_type: string;
  item_description: string;
  display_text: string;
  custom_message: string | null;
  status: string;
  order_date: string | null;
  vendor: string | null;
  order_number: string | null;
  production_started: string | null;
  expected_completion: string | null;
  actual_completion: string | null;
  installation_date: string | null;
  installation_location: string | null;
  installation_photo_url: string | null;
  verified_at: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  notes: string | null;
  created_at: string;
  backer: {
    email: string;
    first_name: string;
    last_initial: string;
    phone: string | null;
  };
  allocation: {
    benefit_name: string;
  };
}

export default function RecognitionItemsPage() {
  const [items, setItems] = useState<RecognitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedItem, setSelectedItem] = useState<RecognitionItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Form state
  const [newStatus, setNewStatus] = useState("");
  const [vendor, setVendor] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [expectedCompletion, setExpectedCompletion] = useState("");
  const [installationLocation, setInstallationLocation] = useState("");
  const [installationPhoto, setInstallationPhoto] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Build query with schema prefix
      let query = supabase
        .schema("crowdfunding")
        .from("recognition_items")
        .select(`
          *,
          backer:backers(email, first_name, last_initial, phone),
          allocation:benefit_allocations(benefit_name)
        `)
        .order("created_at", { ascending: false });

      if (filterStatus && filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching recognition items:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleStatusUpdate = async () => {
    if (!selectedItem || !newStatus) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const updateData: any = {
        status: newStatus,
        notes: updateNotes,
        updated_at: new Date().toISOString(),
      };

      const currentDate = new Date().toISOString().split('T')[0];
      switch (newStatus) {
        case "ordered":
          updateData.order_date = currentDate;
          // updateData.ordered_by = staffId; // TODO: Get from auth
          break;
        case "in_production":
          updateData.production_started = currentDate;
          break;
        case "installed":
          updateData.installation_date = currentDate;
          // updateData.installed_by = staffId; // TODO: Get from auth
          break;
        case "verified":
          updateData.verified_at = new Date().toISOString();
          // updateData.verified_by = staffId; // TODO: Get from auth
          break;
      }

      const { error } = await supabase
        .schema("crowdfunding")
        .from("recognition_items")
        .update(updateData)
        .eq("id", selectedItem.id);

      if (error) throw error;

      // If verified, also mark benefit as fulfilled
      if (newStatus === "verified") {
        await supabase
          .schema("crowdfunding")
          .from("benefit_allocations")
          .update({
            fulfillment_status: "fulfilled",
            fulfilled_at: new Date().toISOString(),
          })
          .eq("id", selectedItem.allocation_id);
      }

      resetUpdateForm();
      fetchItems();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDetailUpdate = async () => {
    if (!selectedItem) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (vendor) updateData.vendor = vendor;
      if (orderNumber) updateData.order_number = orderNumber;
      if (expectedCompletion) updateData.expected_completion = expectedCompletion;
      if (installationLocation) updateData.installation_location = installationLocation;
      if (installationPhoto) updateData.installation_photo_url = installationPhoto;
      if (actualCost) updateData.actual_cost = parseFloat(actualCost);
      if (updateNotes) updateData.notes = updateNotes;

      const { error } = await supabase
        .schema("crowdfunding")
        .from("recognition_items")
        .update(updateData)
        .eq("id", selectedItem.id);

      if (error) throw error;

      resetUpdateForm();
      fetchItems();
    } catch (error) {
      console.error("Error updating item details:", error);
    }
  };

  const resetUpdateForm = () => {
    setShowDetailModal(false);
    setShowUpdateModal(false);
    setSelectedItem(null);
    setNewStatus("");
    setVendor("");
    setOrderNumber("");
    setExpectedCompletion("");
    setInstallationLocation("");
    setInstallationPhoto("");
    setActualCost("");
    setUpdateNotes("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "ordered":
        return "primary";
      case "in_production":
        return "secondary";
      case "received":
        return "success";
      case "installed":
        return "success";
      case "verified":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const formatItemType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "plaque":
        return "solar:medal-star-bold";
      case "wall_engraving":
        return "solar:letter-bold";
      case "court_sign":
        return "solar:flag-bold";
      case "brick_paver":
        return "solar:square-bold";
      default:
        return "solar:gift-bold";
    }
  };

  const statusCounts = {
    pending: items.filter((i) => i.status === "pending").length,
    ordered: items.filter((i) => i.status === "ordered").length,
    in_production: items.filter((i) => i.status === "in_production").length,
    received: items.filter((i) => i.status === "received").length,
    installed: items.filter((i) => i.status === "installed").length,
    verified: items.filter((i) => i.status === "verified").length,
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Recognition Items</h1>
            <p className="text-gray-400 mt-1">
              Manage plaques, engravings, and donor recognition
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-zinc-900">
            <CardBody>
              <p className="text-sm text-gray-400">Pending Order</p>
              <p className="text-2xl font-bold text-yellow-500 mt-1">
                {statusCounts.pending}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-zinc-900">
            <CardBody>
              <p className="text-sm text-gray-400">Ordered</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">
                {statusCounts.ordered}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-zinc-900">
            <CardBody>
              <p className="text-sm text-gray-400">In Production</p>
              <p className="text-2xl font-bold text-purple-500 mt-1">
                {statusCounts.in_production}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-zinc-900">
            <CardBody>
              <p className="text-sm text-gray-400">Received</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {statusCounts.received}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-zinc-900">
            <CardBody>
              <p className="text-sm text-gray-400">Installed</p>
              <p className="text-2xl font-bold text-[#B3FF00] mt-1">
                {statusCounts.installed}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-zinc-900">
            <CardBody>
              <p className="text-sm text-gray-400">Verified</p>
              <p className="text-2xl font-bold text-[#B3FF00] mt-1">
                {statusCounts.verified}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Filter */}
        <Card className="bg-zinc-900">
          <CardBody>
            <Select
              label="Filter by Status"
              selectedKeys={filterStatus ? [filterStatus] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setFilterStatus(selected as string);
              }}
              className="max-w-xs"
            >
              <SelectItem key="all">All Items</SelectItem>
              <SelectItem key="pending">Pending Order</SelectItem>
              <SelectItem key="ordered">Ordered</SelectItem>
              <SelectItem key="in_production">In Production</SelectItem>
              <SelectItem key="received">Received</SelectItem>
              <SelectItem key="installed">Installed</SelectItem>
              <SelectItem key="verified">Verified</SelectItem>
            </Select>
          </CardBody>
        </Card>

        {/* Items Table */}
        <Card className="bg-zinc-900">
          <CardHeader className="border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">
              Recognition Items ({items.length})
            </h2>
          </CardHeader>
          <CardBody>
            <Table
              aria-label="Recognition items table"
              className="dark"
              classNames={{
                wrapper: "bg-zinc-900",
                th: "bg-zinc-800 text-white",
                td: "text-gray-300",
              }}
            >
              <TableHeader>
                <TableColumn>ITEM</TableColumn>
                <TableColumn>BACKER</TableColumn>
                <TableColumn>DISPLAY TEXT</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>VENDOR</TableColumn>
                <TableColumn>LOCATION</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={items} isLoading={loading} emptyContent="No items found">
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={getItemIcon(item.item_type)}
                          className="text-[#B3FF00]"
                          width={24}
                        />
                        <div>
                          <p className="font-semibold">
                            {formatItemType(item.item_type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.item_description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {item.backer.first_name} {item.backer.last_initial}.
                        </p>
                        <p className="text-xs text-gray-500">{item.backer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate">
                        {item.display_text}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(item.status)}
                        variant="flat"
                      >
                        {item.status.replace("_", " ")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {item.vendor ? (
                        <span className="text-sm">{item.vendor}</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.installation_location ? (
                        <span className="text-sm">{item.installation_location}</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setSelectedItem(item);
                            setShowDetailModal(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#B3FF00] text-black"
                          onPress={() => {
                            setSelectedItem(item);
                            setShowUpdateModal(true);
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Detail View Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedItem(null);
        }}
        size="2xl"
      >
        <ModalContent className="bg-zinc-900 text-white">
          <ModalHeader>Recognition Item Details</ModalHeader>
          <ModalBody>
            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Item Type</p>
                    <p className="font-semibold">
                      {formatItemType(selectedItem.item_type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <Chip color={getStatusColor(selectedItem.status)}>
                      {selectedItem.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Backer</p>
                    <p>
                      {selectedItem.backer.first_name}{" "}
                      {selectedItem.backer.last_initial}.
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedItem.backer.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p>{selectedItem.backer.phone || "Not provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-400">Display Text</p>
                    <p className="font-semibold">{selectedItem.display_text}</p>
                  </div>
                  {selectedItem.vendor && (
                    <>
                      <div>
                        <p className="text-sm text-gray-400">Vendor</p>
                        <p>{selectedItem.vendor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Order Number</p>
                        <p>{selectedItem.order_number || "N/A"}</p>
                      </div>
                    </>
                  )}
                  {selectedItem.installation_location && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-400">Installation Location</p>
                      <p>{selectedItem.installation_location}</p>
                    </div>
                  )}
                  {selectedItem.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-400">Notes</p>
                      <p className="text-sm">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setShowDetailModal(false);
                setSelectedItem(null);
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={resetUpdateForm}
        size="lg"
      >
        <ModalContent className="bg-zinc-900 text-white">
          <ModalHeader>Update Recognition Item</ModalHeader>
          <ModalBody>
            {selectedItem && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    {formatItemType(selectedItem.item_type)} for{" "}
                    {selectedItem.backer.first_name} {selectedItem.backer.last_initial}.
                  </p>
                </div>
                <Select
                  label="Status"
                  placeholder="Update status"
                  selectedKeys={newStatus ? [newStatus] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setNewStatus(selected as string);
                  }}
                >
                  <SelectItem key="pending">Pending Order</SelectItem>
                  <SelectItem key="ordered">Ordered</SelectItem>
                  <SelectItem key="in_production">In Production</SelectItem>
                  <SelectItem key="received">Received</SelectItem>
                  <SelectItem key="installed">Installed</SelectItem>
                  <SelectItem key="verified">Verified</SelectItem>
                  <SelectItem key="cancelled">Cancelled</SelectItem>
                </Select>
                <Input
                  label="Vendor"
                  placeholder="Enter vendor name"
                  value={vendor}
                  onValueChange={setVendor}
                />
                <Input
                  label="Order Number"
                  placeholder="Enter order number"
                  value={orderNumber}
                  onValueChange={setOrderNumber}
                />
                <Input
                  label="Installation Location"
                  placeholder="e.g., Founders Wall - Row 2, Position 5"
                  value={installationLocation}
                  onValueChange={setInstallationLocation}
                />
                <Input
                  label="Actual Cost"
                  type="number"
                  placeholder="0.00"
                  value={actualCost}
                  onValueChange={setActualCost}
                  startContent="$"
                />
                <Textarea
                  label="Notes"
                  placeholder="Add notes about this update..."
                  value={updateNotes}
                  onValueChange={setUpdateNotes}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={resetUpdateForm}>
              Cancel
            </Button>
            <Button
              className="bg-[#B3FF00] text-black"
              onPress={handleDetailUpdate}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
