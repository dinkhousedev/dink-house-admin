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
import { Textarea } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import { Icon } from "@iconify/react";
import { DatePicker } from "@heroui/date-picker";

import {
  bulkToggleScheduleBlocks,
  createDateRangeOverride,
} from "@/app/dashboard/open-play-playground/actions";
import { notify } from "@/lib/notifications";

interface BulkScheduleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedBlockIds: string[];
}

export function BulkScheduleManager({
  isOpen,
  onClose,
  onSuccess,
  selectedBlockIds,
}: BulkScheduleManagerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"toggle" | "override">(
    "toggle",
  );
  const [toggleToActive, setToggleToActive] = useState(true);
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [cancelInstances, setCancelInstances] = useState(true);

  const handleToggleBlocks = async () => {
    setLoading(true);
    try {
      const result = await bulkToggleScheduleBlocks(
        selectedBlockIds,
        toggleToActive,
      );

      if (result.success) {
        onSuccess?.();
        onClose();
        notify.success(
          `Successfully ${toggleToActive ? "activated" : "deactivated"} ${selectedBlockIds.length} schedule blocks`,
        );
      } else {
        notify.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error toggling blocks:", error);
      notify.error("Failed to toggle blocks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOverride = async () => {
    if (!startDate || !endDate) {
      notify.warning("Please select start and end dates");

      return;
    }

    if (!overrideReason.trim()) {
      notify.warning("Please enter a reason for the override");

      return;
    }

    setLoading(true);
    try {
      const startDateStr = startDate.toString();
      const endDateStr = endDate.toString();

      const result = await createDateRangeOverride(
        selectedBlockIds,
        startDateStr,
        endDateStr,
        cancelInstances,
        overrideReason,
      );

      if (result.success) {
        onSuccess?.();
        onClose();
        // Reset form
        setStartDate(null);
        setEndDate(null);
        setOverrideReason("");
        setCancelInstances(true);
        notify.success(
          `Successfully created override for ${selectedBlockIds.length} schedule blocks`,
        );
      } else {
        notify.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating override:", error);
      notify.error("Failed to create override");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="bg-black/95 border border-dink-gray"
      isOpen={isOpen}
      size="2xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-dink-white flex items-center gap-2">
                <Icon icon="solar:layers-minimalistic-bold" width={24} />
                Bulk Schedule Actions
              </h3>
              <p className="text-sm text-dink-white/60">
                Manage {selectedBlockIds.length} selected schedule block
                {selectedBlockIds.length !== 1 ? "s" : ""}
              </p>
            </ModalHeader>

            <Divider className="bg-dink-gray/30" />

            <ModalBody className="py-6">
              <div className="space-y-6">
                {/* Action Selector */}
                <Tabs
                  classNames={{
                    tabList: "bg-dink-gray/20",
                    cursor: "bg-dink-lime",
                    tab: "text-dink-white data-[selected=true]:text-dink-black",
                  }}
                  selectedKey={selectedAction}
                  variant="solid"
                  onSelectionChange={(key) =>
                    setSelectedAction(key as "toggle" | "override")
                  }
                >
                  <Tab
                    key="toggle"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:eye-linear" width={18} />
                        <span>Activate/Deactivate</span>
                      </div>
                    }
                  />
                  <Tab
                    key="override"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:calendar-mark-bold" width={18} />
                        <span>Date Range Override</span>
                      </div>
                    }
                  />
                </Tabs>

                <Divider className="bg-dink-gray/20" />

                {/* Toggle Action */}
                {selectedAction === "toggle" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <Icon
                        className="text-blue-400 mb-2"
                        icon="solar:info-circle-linear"
                        width={20}
                      />
                      <p className="text-sm text-blue-400">
                        This action will{" "}
                        {toggleToActive ? "activate" : "deactivate"} all{" "}
                        {selectedBlockIds.length} selected schedule blocks.
                        {toggleToActive
                          ? " They will appear on the calendar and be available for booking."
                          : " They will be hidden from the calendar and unavailable for booking."}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className={`flex-1 ${
                          toggleToActive
                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                            : "bg-dink-gray/20 text-dink-white/60"
                        }`}
                        size="lg"
                        startContent={
                          <Icon icon="solar:eye-linear" width={24} />
                        }
                        variant={toggleToActive ? "bordered" : "flat"}
                        onPress={() => setToggleToActive(true)}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">Activate</span>
                          <span className="text-xs opacity-80">
                            Show on calendar
                          </span>
                        </div>
                      </Button>

                      <Button
                        className={`flex-1 ${
                          !toggleToActive
                            ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                            : "bg-dink-gray/20 text-dink-white/60"
                        }`}
                        size="lg"
                        startContent={
                          <Icon icon="solar:eye-closed-linear" width={24} />
                        }
                        variant={!toggleToActive ? "bordered" : "flat"}
                        onPress={() => setToggleToActive(false)}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">Deactivate</span>
                          <span className="text-xs opacity-80">
                            Hide from calendar
                          </span>
                        </div>
                      </Button>
                    </div>

                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-500 flex items-start gap-2">
                        <Icon
                          className="mt-0.5 flex-shrink-0"
                          icon="solar:danger-triangle-linear"
                          width={16}
                        />
                        <span>
                          This action affects the series settings. Existing
                          bookings are not affected. Use &quot;Date Range
                          Override&quot; to cancel specific dates.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Override Action */}
                {selectedAction === "override" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <Icon
                        className="text-purple-400 mb-2"
                        icon="solar:info-circle-linear"
                        width={20}
                      />
                      <p className="text-sm text-purple-400">
                        Create overrides for specific dates without changing the
                        recurring schedule. Perfect for holidays, special
                        events, or temporary closures.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker
                        isRequired
                        label="Start Date"
                        labelPlacement="outside"
                        value={startDate}
                        variant="bordered"
                        onChange={setStartDate}
                      />
                      <DatePicker
                        isRequired
                        label="End Date"
                        labelPlacement="outside"
                        value={endDate}
                        variant="bordered"
                        onChange={setEndDate}
                      />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-dink-gray/20 rounded-lg">
                      <input
                        checked={cancelInstances}
                        className="w-4 h-4"
                        id="cancel-instances"
                        type="checkbox"
                        onChange={(e) => setCancelInstances(e.target.checked)}
                      />
                      <label
                        className="text-sm text-dink-white cursor-pointer flex-1"
                        htmlFor="cancel-instances"
                      >
                        Cancel all instances in this date range
                      </label>
                    </div>

                    {!cancelInstances && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-400">
                          Advanced: You can modify instances instead of
                          canceling them. This is typically used for time
                          changes or special modifications.
                        </p>
                      </div>
                    )}

                    <Textarea
                      isRequired
                      label="Reason"
                      labelPlacement="outside"
                      placeholder="e.g., Holiday closure, Special tournament, Facility maintenance"
                      value={overrideReason}
                      variant="bordered"
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />

                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-500 flex items-start gap-2">
                        <Icon
                          className="mt-0.5 flex-shrink-0"
                          icon="solar:danger-triangle-linear"
                          width={16}
                        />
                        <span>
                          This will create overrides for all{" "}
                          {selectedBlockIds.length} selected blocks for each day
                          in the date range. The recurring schedule remains
                          unchanged.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>

            <Divider className="bg-dink-gray/30" />

            <ModalFooter>
              <Button color="danger" variant="light" onPress={closeModal}>
                Cancel
              </Button>
              <Button
                className="bg-dink-lime text-black font-semibold"
                isDisabled={
                  selectedAction === "override" &&
                  (!startDate || !endDate || !overrideReason.trim())
                }
                isLoading={loading}
                startContent={
                  <Icon icon="solar:check-circle-linear" width={20} />
                }
                onPress={
                  selectedAction === "toggle"
                    ? handleToggleBlocks
                    : handleCreateOverride
                }
              >
                {selectedAction === "toggle"
                  ? toggleToActive
                    ? "Activate Blocks"
                    : "Deactivate Blocks"
                  : "Create Overrides"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
