"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import { OpenPlayEditModal } from "@/components/events/OpenPlayEditModal";
import {
  toggleScheduleBlockStatus,
  cloneScheduleBlock,
  deleteScheduleBlock,
} from "@/app/dashboard/session_booking/actions";
import { notify } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ScheduleBlockCardProps {
  scheduleBlock: any;
  courts: any[];
  compact?: boolean;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onRefresh: () => void;
}

export function ScheduleBlockCard({
  scheduleBlock,
  courts,
  compact = false,
  isSelected,
  onSelect,
  onRefresh,
}: ScheduleBlockCardProps) {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getSessionTypeInfo = (sessionType: string) => {
    switch (sessionType) {
      case "divided_by_skill":
        return {
          label: "Divided",
          color: "bg-blue-500/20 text-blue-400",
          icon: "solar:layers-bold",
        };
      case "mixed_levels":
        return {
          label: "Mixed",
          color: "bg-green-500/20 text-green-400",
          icon: "solar:users-group-rounded-bold",
        };
      case "dedicated_skill":
        return {
          label: scheduleBlock.dedicated_skill_label || "Dedicated",
          color: "bg-purple-500/20 text-purple-400",
          icon: "solar:medal-star-bold",
        };
      case "special_event":
        return {
          label: scheduleBlock.special_event_name || "Special",
          color: "bg-dink-lime/20 text-dink-lime",
          icon: "solar:star-bold",
        };
      default:
        return {
          label: "Open Play",
          color: "bg-gray-500/20 text-gray-400",
          icon: "solar:calendar-bold",
        };
    }
  };

  const sessionInfo = getSessionTypeInfo(scheduleBlock.session_type);

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      const result = await toggleScheduleBlockStatus(
        scheduleBlock.id,
        !scheduleBlock.is_active,
      );

      if (result.success) {
        onRefresh();
        notify.success(
          `Schedule block ${!scheduleBlock.is_active ? "activated" : "deactivated"} successfully`,
        );
      } else {
        notify.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      notify.error("Failed to toggle status");
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (targetDay: number) => {
    setLoading(true);
    try {
      const result = await cloneScheduleBlock(scheduleBlock.id, targetDay);

      if (result.success) {
        onRefresh();
        notify.success("Schedule block cloned successfully");
      } else {
        notify.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cloning block:", error);
      notify.error("Failed to clone block");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Schedule Block",
      message: `Are you sure you want to delete "${scheduleBlock.name}"? This will remove all future instances.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await deleteScheduleBlock(scheduleBlock.id);

      if (result.success) {
        onRefresh();
        notify.success("Schedule block deleted successfully");
      } else {
        notify.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting block:", error);
      notify.error("Failed to delete block");
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (compact) {
    return (
      <>
        <Card
          isPressable
          className={`border-2 transition-all ${
            isSelected
              ? "border-dink-lime bg-dink-lime/10"
              : scheduleBlock.is_active
                ? "border-dink-gray/50 bg-black/60 hover:border-dink-lime/50"
                : "border-dink-gray/30 bg-black/30 opacity-50"
          }`}
          onPress={() => onSelect(!isSelected)}
        >
          <CardBody className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={sessionInfo.color}
                    icon={sessionInfo.icon}
                    width={16}
                  />
                  <p className="text-xs font-semibold text-dink-white truncate">
                    {scheduleBlock.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-dink-white/60">
                  <Icon icon="solar:clock-circle-linear" width={14} />
                  <span className="font-mono">
                    {scheduleBlock.start_time.slice(0, 5)} -{" "}
                    {scheduleBlock.end_time.slice(0, 5)}
                  </span>
                </div>
              </div>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="bg-dink-gray/20"
                    size="sm"
                    variant="flat"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon icon="solar:menu-dots-bold" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Actions">
                  <DropdownItem
                    key="edit"
                    startContent={<Icon icon="solar:pen-bold" width={18} />}
                    onPress={(e) => {
                      setIsEditModalOpen(true);
                    }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="toggle"
                    startContent={
                      <Icon
                        icon={
                          scheduleBlock.is_active
                            ? "solar:eye-closed-linear"
                            : "solar:eye-linear"
                        }
                        width={18}
                      />
                    }
                    onPress={handleToggleActive}
                  >
                    {scheduleBlock.is_active ? "Deactivate" : "Activate"}
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={
                      <Icon icon="solar:trash-bin-linear" width={18} />
                    }
                    onPress={handleDelete}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>

            {scheduleBlock.court_allocations &&
              scheduleBlock.court_allocations.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {scheduleBlock.court_allocations
                    .slice(0, 2)
                    .map((allocation: any) => (
                      <Chip
                        key={allocation.id}
                        className="text-[10px] h-5"
                        size="sm"
                        variant="flat"
                      >
                        C{allocation.court?.court_number}
                      </Chip>
                    ))}
                  {scheduleBlock.court_allocations.length > 2 && (
                    <Chip className="text-[10px] h-5" size="sm" variant="flat">
                      +{scheduleBlock.court_allocations.length - 2}
                    </Chip>
                  )}
                </div>
              )}

            {isSelected && (
              <div className="pt-1 border-t border-dink-lime/30">
                <Chip
                  className="bg-dink-lime/20 text-dink-lime text-[10px] h-5"
                  size="sm"
                  variant="flat"
                >
                  Selected
                </Chip>
              </div>
            )}
          </CardBody>
        </Card>

        {isEditModalOpen && (
          <OpenPlayEditModal
            isOpen={isEditModalOpen}
            mode="series"
            scheduleBlockId={scheduleBlock.id}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              onRefresh();
              setIsEditModalOpen(false);
            }}
          />
        )}
      </>
    );
  }

  // Full card view for list mode
  return (
    <>
      <Card
        isPressable
        className={`border-2 transition-all ${
          isSelected
            ? "border-dink-lime bg-dink-lime/10"
            : scheduleBlock.is_active
              ? "border-dink-gray/50 bg-black/60 hover:border-dink-lime/50"
              : "border-dink-gray/30 bg-black/30 opacity-60"
        }`}
        onPress={() => onSelect(!isSelected)}
      >
        <CardBody className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Icon
                  className={sessionInfo.color}
                  icon={sessionInfo.icon}
                  width={24}
                />
                <div>
                  <h4 className="text-lg font-bold text-dink-white">
                    {scheduleBlock.name}
                  </h4>
                  <p className="text-sm text-dink-white/60">
                    {scheduleBlock.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mt-3">
                <Chip className={sessionInfo.color} size="sm" variant="flat">
                  {sessionInfo.label}
                </Chip>
                <Chip size="sm" variant="bordered">
                  {daysOfWeek[scheduleBlock.day_of_week]}
                </Chip>
                <Chip
                  className="font-mono"
                  size="sm"
                  startContent={
                    <Icon icon="solar:clock-circle-linear" width={14} />
                  }
                  variant="bordered"
                >
                  {scheduleBlock.start_time.slice(0, 5)} -{" "}
                  {scheduleBlock.end_time.slice(0, 5)}
                </Chip>
                <Chip
                  size="sm"
                  startContent={<Icon icon="solar:dollar-linear" width={14} />}
                  variant="bordered"
                >
                  ${scheduleBlock.price_member} / ${scheduleBlock.price_guest}
                </Chip>
                {!scheduleBlock.is_active && (
                  <Chip color="warning" size="sm" variant="flat">
                    Inactive
                  </Chip>
                )}
              </div>

              {scheduleBlock.court_allocations &&
                scheduleBlock.court_allocations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-dink-white/60 mb-1">
                      Court Allocations:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {scheduleBlock.court_allocations.map(
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
            </div>

            <div className="flex flex-col gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="bg-dink-gray/20"
                    size="sm"
                    variant="flat"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon icon="solar:menu-dots-bold" width={20} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Actions">
                  <DropdownItem
                    key="edit"
                    startContent={<Icon icon="solar:pen-bold" width={18} />}
                    onPress={() => setIsEditModalOpen(true)}
                  >
                    Edit Series
                  </DropdownItem>
                  <DropdownItem
                    key="toggle"
                    startContent={
                      <Icon
                        icon={
                          scheduleBlock.is_active
                            ? "solar:eye-closed-linear"
                            : "solar:eye-linear"
                        }
                        width={18}
                      />
                    }
                    onPress={handleToggleActive}
                  >
                    {scheduleBlock.is_active ? "Deactivate" : "Activate"}
                  </DropdownItem>
                  <DropdownItem
                    key="clone"
                    startContent={<Icon icon="solar:copy-bold" width={18} />}
                  >
                    Clone to Day
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={
                      <Icon icon="solar:trash-bin-linear" width={18} />
                    }
                    onPress={handleDelete}
                  >
                    Delete Series
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          {isSelected && (
            <div className="mt-3 pt-3 border-t border-dink-lime/30">
              <Chip
                className="bg-dink-lime/20 text-dink-lime"
                size="sm"
                variant="flat"
              >
                ✓ Selected for bulk actions
              </Chip>
            </div>
          )}
        </CardBody>
      </Card>

      {isEditModalOpen && (
        <OpenPlayEditModal
          isOpen={isEditModalOpen}
          mode="series"
          scheduleBlockId={scheduleBlock.id}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            onRefresh();
            setIsEditModalOpen(false);
          }}
        />
      )}
      {ConfirmDialogComponent}
    </>
  );
}
