"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";

import {
  getScheduleBlock,
  updateScheduleBlock,
  deleteScheduleBlock,
  createScheduleOverride,
} from "@/app/dashboard/session_booking/actions";
import { notify } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

interface OpenPlayEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  scheduleBlockId: string;
  instanceDate?: string; // If provided, editing single instance
  mode: "series" | "instance"; // Edit whole series or single instance
}

export function OpenPlayEditModal({
  isOpen,
  onClose,
  onSuccess,
  scheduleBlockId,
  instanceDate,
  mode,
}: OpenPlayEditModalProps) {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "",
    end_time: "",
    price_member: 0,
    price_guest: 0,
    max_capacity: 20,
    special_instructions: "",
  });
  const [overrideReason, setOverrideReason] = useState("");
  const [cancelInstance, setCancelInstance] = useState(false);

  useEffect(() => {
    if (isOpen && scheduleBlockId) {
      fetchScheduleData();
    }
  }, [isOpen, scheduleBlockId]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const result = await getScheduleBlock(scheduleBlockId);

      if (result.success && result.data) {
        setScheduleData(result.data);
        setFormData({
          name: result.data.name || "",
          description: result.data.description || "",
          start_time: result.data.start_time || "",
          end_time: result.data.end_time || "",
          price_member: result.data.price_member || 0,
          price_guest: result.data.price_guest || 0,
          max_capacity: result.data.max_capacity || 20,
          special_instructions: result.data.special_instructions || "",
        });
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (mode === "series") {
        // Update the entire series
        const result = await updateScheduleBlock(scheduleBlockId, formData);

        if (result.success) {
          onSuccess?.();
          onClose();
          notify.success("Schedule block updated successfully");
        } else {
          notify.error(`Error: ${result.error}`);
        }
      } else if (mode === "instance" && instanceDate) {
        // Create an override for this specific date
        if (cancelInstance) {
          const result = await createScheduleOverride(
            scheduleBlockId,
            instanceDate,
            true,
            overrideReason || "Cancelled by staff",
          );

          if (result.success) {
            onSuccess?.();
            onClose();
            notify.success("Schedule instance cancelled successfully");
          } else {
            notify.error(`Error: ${result.error}`);
          }
        } else {
          const result = await createScheduleOverride(
            scheduleBlockId,
            instanceDate,
            false,
            overrideReason || "Modified by staff",
            {
              name: formData.name,
              start_time: formData.start_time,
              end_time: formData.end_time,
              special_instructions: formData.special_instructions,
            },
          );

          if (result.success) {
            onSuccess?.();
            onClose();
            notify.success("Schedule instance updated successfully");
          } else {
            notify.error(`Error: ${result.error}`);
          }
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
      notify.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Schedule Block",
      message:
        "Are you sure you want to delete this entire schedule block? This will remove all future instances.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await deleteScheduleBlock(scheduleBlockId);

      if (result.success) {
        onSuccess?.();
        onClose();
        notify.success("Schedule block deleted successfully");
      } else {
        notify.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      notify.error("Failed to delete schedule block");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return days[dayOfWeek];
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
              <h3 className="text-xl font-bold text-dink-white">
                {mode === "series"
                  ? "Edit Schedule Block (Series)"
                  : "Edit Single Instance"}
              </h3>
              {scheduleData && (
                <div className="flex gap-2 items-center">
                  <Chip
                    className="bg-dink-lime/20 text-dink-lime"
                    size="sm"
                    variant="flat"
                  >
                    {getDayName(scheduleData.day_of_week)}s
                  </Chip>
                  <Chip size="sm" variant="bordered">
                    {scheduleData.start_time} - {scheduleData.end_time}
                  </Chip>
                  <Chip
                    className="bg-blue-500/20 text-blue-400"
                    size="sm"
                    variant="flat"
                  >
                    {scheduleData.session_type?.replace("_", " ")}
                  </Chip>
                </div>
              )}
              {mode === "instance" && instanceDate && (
                <p className="text-sm text-dink-white/60">
                  Date: {new Date(instanceDate).toLocaleDateString()}
                </p>
              )}
            </ModalHeader>

            <Divider className="bg-dink-gray/30" />

            <ModalBody>
              {loading && !scheduleData ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-dink-white/50">Loading...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Court Allocations Info */}
                  {scheduleData?.court_allocations && (
                    <div>
                      <h4 className="text-sm font-semibold text-dink-white mb-2">
                        Court Allocations
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {scheduleData.court_allocations.map(
                          (allocation: any) => (
                            <Chip
                              key={allocation.id}
                              size="sm"
                              variant="bordered"
                            >
                              Court {allocation.court?.court_number}:{" "}
                              {allocation.skill_level_label}
                            </Chip>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <Divider className="bg-dink-gray/20" />

                  {mode === "instance" && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <input
                        checked={cancelInstance}
                        className="w-4 h-4"
                        id="cancel-instance-checkbox"
                        type="checkbox"
                        onChange={(e) => setCancelInstance(e.target.checked)}
                      />
                      <label
                        className="text-sm text-yellow-500"
                        htmlFor="cancel-instance-checkbox"
                      >
                        Cancel this instance only
                      </label>
                    </div>
                  )}

                  {!cancelInstance && (
                    <>
                      <Input
                        label="Session Name"
                        labelPlacement="outside"
                        placeholder="Enter session name"
                        value={formData.name}
                        variant="bordered"
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />

                      <Textarea
                        label="Description"
                        labelPlacement="outside"
                        placeholder="Enter description"
                        value={formData.description}
                        variant="bordered"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Start Time"
                          labelPlacement="outside"
                          type="time"
                          value={formData.start_time}
                          variant="bordered"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              start_time: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="End Time"
                          labelPlacement="outside"
                          type="time"
                          value={formData.end_time}
                          variant="bordered"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_time: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Member Price"
                          labelPlacement="outside"
                          startContent={
                            <span className="text-default-400">$</span>
                          }
                          type="number"
                          value={formData.price_member.toString()}
                          variant="bordered"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price_member: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <Input
                          label="Guest Price"
                          labelPlacement="outside"
                          startContent={
                            <span className="text-default-400">$</span>
                          }
                          type="number"
                          value={formData.price_guest.toString()}
                          variant="bordered"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price_guest: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <Input
                        label="Max Capacity"
                        labelPlacement="outside"
                        type="number"
                        value={formData.max_capacity.toString()}
                        variant="bordered"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_capacity: parseInt(e.target.value) || 20,
                          })
                        }
                      />

                      <Textarea
                        label="Special Instructions"
                        labelPlacement="outside"
                        placeholder="Enter any special instructions"
                        value={formData.special_instructions}
                        variant="bordered"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            special_instructions: e.target.value,
                          })
                        }
                      />
                    </>
                  )}

                  {mode === "instance" && (
                    <Textarea
                      isRequired
                      label="Reason for Change"
                      labelPlacement="outside"
                      placeholder="Enter reason for this override..."
                      value={overrideReason}
                      variant="bordered"
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />
                  )}

                  {mode === "series" && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-400">
                        <Icon
                          className="inline mr-2"
                          icon="solar:info-circle-linear"
                          width={16}
                        />
                        Changes will apply to all future instances of this
                        schedule block
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            <Divider className="bg-dink-gray/30" />

            <ModalFooter className="flex justify-between">
              <div>
                {mode === "series" && (
                  <Button
                    color="danger"
                    isLoading={loading}
                    startContent={
                      <Icon icon="solar:trash-bin-linear" width={18} />
                    }
                    variant="light"
                    onPress={handleDelete}
                  >
                    Delete Series
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button color="danger" variant="light" onPress={closeModal}>
                  Cancel
                </Button>
                <Button
                  className="bg-dink-lime text-black font-semibold"
                  isDisabled={
                    mode === "instance" && !overrideReason && !cancelInstance
                  }
                  isLoading={loading}
                  startContent={
                    <Icon icon="solar:check-circle-linear" width={20} />
                  }
                  onPress={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
      {ConfirmDialogComponent}
    </Modal>
  );
}
