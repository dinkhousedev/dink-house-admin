"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";

import {
  getAllScheduleBlocks,
  getAllCourts,
  bulkDeleteScheduleBlocks,
} from "./actions";

import { WeeklyScheduleGrid } from "@/components/open-play/WeeklyScheduleGrid";
import { CreateScheduleBlockModal } from "@/components/open-play/CreateScheduleBlockModal";
import { BulkScheduleManager } from "@/components/open-play/BulkScheduleManager";

export default function OpenPlayPlaygroundPage() {
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkManagerOpen, setIsBulkManagerOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<"grid" | "list">("grid");
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [showInactive]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blocksResult, courtsResult] = await Promise.all([
        getAllScheduleBlocks(showInactive),
        getAllCourts(),
      ]);

      if (blocksResult.success && blocksResult.data) {
        setScheduleBlocks(blocksResult.data);
      }

      if (courtsResult.success && courtsResult.data) {
        setCourts(courtsResult.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    setSelectedBlocks([]);
  };

  const handleBlockSelect = (blockId: string, selected: boolean) => {
    if (selected) {
      setSelectedBlocks([...selectedBlocks, blockId]);
    } else {
      setSelectedBlocks(selectedBlocks.filter((id) => id !== blockId));
    }
  };

  const handleSelectAll = () => {
    if (selectedBlocks.length === scheduleBlocks.length) {
      setSelectedBlocks([]);
    } else {
      setSelectedBlocks(scheduleBlocks.map((block) => block.id));
    }
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedBlocks.length} schedule block${selectedBlocks.length !== 1 ? "s" : ""}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const result = await bulkDeleteScheduleBlocks(selectedBlocks);

      if (result.success) {
        handleRefresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting blocks:", error);
      alert("Failed to delete blocks");
    }
  };

  const getScheduleStats = () => {
    const total = scheduleBlocks.length;
    const active = scheduleBlocks.filter((b) => b.is_active).length;
    const byDay = scheduleBlocks.reduce(
      (acc, block) => {
        acc[block.day_of_week] = (acc[block.day_of_week] || 0) + 1;

        return acc;
      },
      {} as Record<number, number>,
    );

    return { total, active, byDay };
  };

  const stats = getScheduleStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card className="bg-black/40 border border-dink-gray">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-dink-white flex items-center gap-3">
                <Icon icon="solar:calendar-bold" width={32} />
                Open Play Playground
              </h1>
              <p className="text-dink-white/60 mt-1">
                Manage your weekly open play schedule
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-dink-gray/20"
                size="sm"
                startContent={<Icon icon="solar:refresh-linear" width={18} />}
                variant="flat"
                onPress={handleRefresh}
              >
                Refresh
              </Button>
              <Button
                className="bg-dink-lime text-black font-semibold"
                size="sm"
                startContent={<Icon icon="solar:add-circle-bold" width={20} />}
                onPress={() => setIsCreateModalOpen(true)}
              >
                New Schedule Block
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border border-dink-gray">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-dink-lime/20 rounded-lg">
                <Icon
                  className="text-dink-lime"
                  icon="solar:calendar-bold"
                  width={24}
                />
              </div>
              <div>
                <p className="text-xs text-dink-white/60">Total Blocks</p>
                <p className="text-2xl font-bold text-dink-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-black/40 border border-dink-gray">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Icon
                  className="text-green-500"
                  icon="solar:check-circle-bold"
                  width={24}
                />
              </div>
              <div>
                <p className="text-xs text-dink-white/60">Active</p>
                <p className="text-2xl font-bold text-dink-white">
                  {stats.active}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-black/40 border border-dink-gray">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Icon
                  className="text-blue-500"
                  icon="solar:court-bold"
                  width={24}
                />
              </div>
              <div>
                <p className="text-xs text-dink-white/60">Total Courts</p>
                <p className="text-2xl font-bold text-dink-white">
                  {courts.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-black/40 border border-dink-gray">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Icon
                  className="text-purple-500"
                  icon="solar:layers-bold"
                  width={24}
                />
              </div>
              <div>
                <p className="text-xs text-dink-white/60">Selected</p>
                <p className="text-2xl font-bold text-dink-white">
                  {selectedBlocks.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* View Controls */}
      <Card className="bg-black/40 border border-dink-gray">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3 items-center">
              <Tabs
                classNames={{
                  tabList: "bg-dink-gray/20",
                  cursor: "bg-dink-lime",
                  tab: "text-dink-white data-[selected=true]:text-dink-black",
                }}
                selectedKey={selectedView}
                size="sm"
                variant="solid"
                onSelectionChange={(key) =>
                  setSelectedView(key as "grid" | "list")
                }
              >
                <Tab
                  key="grid"
                  title={
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:calendar-bold" width={16} />
                      <span>Grid View</span>
                    </div>
                  }
                />
                <Tab
                  key="list"
                  title={
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:list-bold" width={16} />
                      <span>List View</span>
                    </div>
                  }
                />
              </Tabs>

              <div className="flex items-center gap-2 px-3 py-2 bg-dink-gray/20 rounded-lg">
                <input
                  checked={showInactive}
                  className="w-4 h-4"
                  id="show-inactive"
                  type="checkbox"
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                <label
                  className="text-sm text-dink-white cursor-pointer"
                  htmlFor="show-inactive"
                >
                  Show Inactive
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedBlocks.length > 0 && (
                <>
                  <Chip
                    className="bg-dink-lime/20 text-dink-lime"
                    size="sm"
                    variant="flat"
                  >
                    {selectedBlocks.length} selected
                  </Chip>
                  <Button
                    className="bg-purple-500/20 text-purple-400"
                    size="sm"
                    startContent={
                      <Icon icon="solar:layers-minimalistic-bold" width={18} />
                    }
                    variant="flat"
                    onPress={() => setIsBulkManagerOpen(true)}
                  >
                    Bulk Actions
                  </Button>
                  <Button
                    className="bg-red-500/20 text-red-400 border-red-500/30"
                    size="sm"
                    startContent={
                      <Icon icon="solar:trash-bin-trash-bold" width={18} />
                    }
                    variant="bordered"
                    onPress={handleBulkDelete}
                  >
                    Delete
                  </Button>
                  <Button
                    color="danger"
                    size="sm"
                    startContent={
                      <Icon icon="solar:close-circle-linear" width={18} />
                    }
                    variant="light"
                    onPress={() => setSelectedBlocks([])}
                  >
                    Clear
                  </Button>
                </>
              )}
              {selectedBlocks.length === 0 && (
                <Button
                  className="bg-dink-gray/20"
                  size="sm"
                  startContent={
                    <Icon icon="solar:check-square-linear" width={18} />
                  }
                  variant="flat"
                  onPress={handleSelectAll}
                >
                  Select All
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spinner color="primary" size="lg" />
        </div>
      ) : (
        <WeeklyScheduleGrid
          courts={courts}
          scheduleBlocks={scheduleBlocks}
          selectedBlockIds={selectedBlocks}
          viewMode={selectedView}
          onBlockSelect={handleBlockSelect}
          onRefresh={handleRefresh}
        />
      )}

      {/* Create Modal */}
      <CreateScheduleBlockModal
        courts={courts}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Bulk Manager Modal */}
      <BulkScheduleManager
        isOpen={isBulkManagerOpen}
        selectedBlockIds={selectedBlocks}
        onClose={() => setIsBulkManagerOpen(false)}
        onSuccess={() => {
          handleRefresh();
          setSelectedBlocks([]);
        }}
      />
    </div>
  );
}
