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
import { Pagination } from "@heroui/pagination";
import { Icon } from "@iconify/react";
import BackerDetailsModal from "@/components/dashboard/BackerDetailsModal";

interface BackerSummary {
  backer_id: string;
  email: string;
  first_name: string;
  last_initial: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  total_contributed: number;
  contribution_count: number;
  backer_since: string;
  total_benefits: number;
  benefits_unclaimed: number;
  benefits_claimed: number;
  benefits_expired: number;
  benefits_expiring_soon: number;
  last_contribution_date: string | null;
  highest_tier_amount: number | null;
}

interface TierBreakdown {
  tier_name: string;
  tier_amount: number;
  contribution_count: number;
  total_amount: number;
  campaign_name: string;
}

export default function ContributorsPage() {
  const [backers, setBackers] = useState<BackerSummary[]>([]);
  const [tierBreakdown, setTierBreakdown] = useState<TierBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBacker, setSelectedBacker] = useState<BackerSummary | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeView, setActiveView] = useState<"backers" | "tiers">("backers");
  const itemsPerPage = 20;

  const fetchBackers = useCallback(async () => {
    try {
      setLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Fetch backer summary
      const { data, error } = await supabase
        .schema("crowdfunding")
        .from("v_backer_summary")
        .select("*");

      if (error) throw error;
      setBackers(data || []);

      // Fetch tier breakdown
      const { data: tierData, error: tierError } = await supabase
        .schema("crowdfunding")
        .from("contributions")
        .select(`
          tier_id,
          amount,
          contribution_tiers (name, amount),
          campaign_types (name)
        `)
        .eq("status", "completed");

      if (tierError) throw tierError;

      // Group by tier
      const tierMap = new Map<string, TierBreakdown>();
      (tierData || []).forEach((contrib: any) => {
        const tierName = contrib.contribution_tiers?.name || "Custom Contribution";
        const tierAmount = contrib.contribution_tiers?.amount || contrib.amount;
        const campaignName = contrib.campaign_types?.name || "Campaign";
        const key = `${tierName}-${campaignName}`;

        if (tierMap.has(key)) {
          const existing = tierMap.get(key)!;
          existing.contribution_count++;
          existing.total_amount += contrib.amount;
        } else {
          tierMap.set(key, {
            tier_name: tierName,
            tier_amount: tierAmount,
            campaign_name: campaignName,
            contribution_count: 1,
            total_amount: contrib.amount,
          });
        }
      });

      const breakdown = Array.from(tierMap.values()).sort(
        (a, b) => b.total_amount - a.total_amount
      );
      setTierBreakdown(breakdown);
    } catch (error) {
      console.error("Error fetching backers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackers();
  }, [fetchBackers]);

  const filteredBackers = backers.filter((backer) => {
    const matchesSearch =
      !searchQuery ||
      backer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      backer.first_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "unclaimed" && backer.benefits_unclaimed > 0) ||
      (filterStatus === "claimed" && backer.benefits_claimed > 0) ||
      (filterStatus === "expiring" && backer.benefits_expiring_soon > 0);

    return matchesSearch && matchesStatus;
  });

  const paginatedBackers = filteredBackers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredBackers.length / itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetails = (backer: BackerSummary) => {
    setSelectedBacker(backer);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedBacker(null);
    // Refresh data when modal closes
    fetchBackers();
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Contributors</h1>
            <p className="text-gray-400 mt-1">
              View all crowdfunding backers and their benefits
            </p>
          </div>
          <Chip size="lg" variant="flat" className="bg-[#B3FF00]/20 text-[#B3FF00]">
            {backers.length} Total Backers
          </Chip>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900">
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Total Raised</p>
                  <p className="text-2xl font-bold text-[#B3FF00] mt-1">
                    {formatCurrency(
                      backers.reduce((sum, b) => sum + b.total_contributed, 0)
                    )}
                  </p>
                </div>
                <Icon icon="solar:dollar-minimalistic-bold" className="text-[#B3FF00]" width={24} />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-zinc-900">
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Total Benefits</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {backers.reduce((sum, b) => sum + b.total_benefits, 0)}
                  </p>
                </div>
                <Icon icon="solar:gift-bold" className="text-[#B3FF00]" width={24} />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-zinc-900">
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Unclaimed Benefits</p>
                  <p className="text-2xl font-bold text-yellow-500 mt-1">
                    {backers.reduce((sum, b) => sum + b.benefits_unclaimed, 0)}
                  </p>
                </div>
                <Icon icon="solar:clock-circle-bold" className="text-yellow-500" width={24} />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-zinc-900">
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Claimed Benefits</p>
                  <p className="text-2xl font-bold text-green-500 mt-1">
                    {backers.reduce((sum, b) => sum + b.benefits_claimed, 0)}
                  </p>
                </div>
                <Icon icon="solar:check-circle-bold" className="text-green-500" width={24} />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* View Toggle */}
        <Card className="bg-zinc-900">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  className={activeView === "backers" ? "bg-[#B3FF00] text-black font-semibold" : "bg-zinc-800 text-white"}
                  onPress={() => setActiveView("backers")}
                >
                  <Icon icon="solar:users-group-rounded-bold" width={20} />
                  Backers View
                </Button>
                <Button
                  className={activeView === "tiers" ? "bg-[#B3FF00] text-black font-semibold" : "bg-zinc-800 text-white"}
                  onPress={() => setActiveView("tiers")}
                >
                  <Icon icon="solar:chart-bold" width={20} />
                  Tier Breakdown
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Filters and Search - Only show for backers view */}
        {activeView === "backers" && (
          <Card className="bg-zinc-900">
            <CardBody>
              <div className="flex gap-4">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<Icon icon="solar:magnifer-linear" width={20} />}
                  className="max-w-md"
                />
                <Select
                  label="Filter by Status"
                  selectedKeys={filterStatus ? [filterStatus] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setFilterStatus(selected as string);
                  }}
                  className="max-w-xs"
                >
                  <SelectItem key="all">All Backers</SelectItem>
                  <SelectItem key="unclaimed">Has Unclaimed Benefits</SelectItem>
                  <SelectItem key="claimed">Has Claimed Benefits</SelectItem>
                  <SelectItem key="expiring">Benefits Expiring Soon</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Backers Table or Tier Breakdown */}
        {activeView === "backers" ? (
          <Card className="bg-zinc-900">
            <CardHeader className="border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">
                All Backers ({filteredBackers.length})
              </h2>
            </CardHeader>
            <CardBody>
            <Table
              aria-label="Backers table"
              className="dark"
              classNames={{
                wrapper: "bg-zinc-900",
                th: "bg-zinc-800 text-white",
                td: "text-gray-300",
              }}
            >
              <TableHeader>
                <TableColumn>BACKER</TableColumn>
                <TableColumn>LOCATION</TableColumn>
                <TableColumn>TOTAL CONTRIBUTED</TableColumn>
                <TableColumn>CONTRIBUTIONS</TableColumn>
                <TableColumn>BENEFITS</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody
                items={paginatedBackers}
                isLoading={loading}
                emptyContent="No backers found"
              >
                {(backer) => (
                  <TableRow key={backer.backer_id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-white">
                          {backer.first_name} {backer.last_initial}.
                        </p>
                        <p className="text-sm text-gray-400">{backer.email}</p>
                        {backer.phone && (
                          <p className="text-xs text-gray-500">{backer.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {backer.city && backer.state ? (
                        <span className="text-sm">
                          {backer.city}, {backer.state}
                        </span>
                      ) : backer.city || backer.state ? (
                        <span className="text-sm">{backer.city || backer.state}</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-[#B3FF00]">
                          {formatCurrency(backer.total_contributed)}
                        </p>
                        {backer.highest_tier_amount && (
                          <p className="text-xs text-gray-500">
                            Top tier: {formatCurrency(backer.highest_tier_amount)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {backer.contribution_count}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {backer.total_benefits === 0 ? (
                          <span className="text-gray-500 text-sm">—</span>
                        ) : (
                          <>
                            {backer.benefits_unclaimed > 0 && (
                              <Chip size="sm" color="warning" variant="flat">
                                {backer.benefits_unclaimed} unclaimed
                              </Chip>
                            )}
                            {backer.benefits_claimed > 0 && (
                              <Chip size="sm" color="success" variant="flat">
                                {backer.benefits_claimed} claimed
                              </Chip>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {backer.total_benefits === 0 ? (
                        <Chip size="sm" variant="flat" className="bg-zinc-800 text-gray-400">
                          Donor
                        </Chip>
                      ) : backer.benefits_expiring_soon > 0 ? (
                        <Chip size="sm" color="danger" variant="flat">
                          <Icon icon="solar:danger-circle-bold" width={14} className="mr-1" />
                          Expiring
                        </Chip>
                      ) : backer.benefits_unclaimed > 0 ? (
                        <Chip size="sm" color="warning" variant="flat">
                          Pending
                        </Chip>
                      ) : (
                        <Chip size="sm" color="success" variant="flat">
                          Current
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-[#B3FF00] text-black font-semibold"
                        onPress={() => handleViewDetails(backer)}
                      >
                        View Details
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
        ) : (
          <Card className="bg-zinc-900">
            <CardHeader className="border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">
                Tier Breakdown ({tierBreakdown.length} Tiers)
              </h2>
            </CardHeader>
            <CardBody>
              <Table
                aria-label="Tier breakdown table"
                className="dark"
                classNames={{
                  wrapper: "bg-zinc-900",
                  th: "bg-zinc-800 text-white",
                  td: "text-gray-300",
                }}
              >
                <TableHeader>
                  <TableColumn>TIER NAME</TableColumn>
                  <TableColumn>CAMPAIGN</TableColumn>
                  <TableColumn>TIER AMOUNT</TableColumn>
                  <TableColumn>CONTRIBUTORS</TableColumn>
                  <TableColumn>TOTAL RAISED</TableColumn>
                  <TableColumn>AVG PER CONTRIBUTOR</TableColumn>
                </TableHeader>
                <TableBody
                  items={tierBreakdown}
                  isLoading={loading}
                  emptyContent="No tier data found"
                >
                  {(tier) => (
                    <TableRow key={`${tier.tier_name}-${tier.campaign_name}`}>
                      <TableCell>
                        <p className="font-semibold text-white">{tier.tier_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-400">{tier.campaign_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-white font-semibold">
                          {formatCurrency(tier.tier_amount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" className="bg-[#B3FF00]/20 text-[#B3FF00]">
                          {tier.contribution_count}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <p className="text-xl font-bold text-[#B3FF00]">
                          {formatCurrency(tier.total_amount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-white">
                          {formatCurrency(tier.total_amount / tier.contribution_count)}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Summary Stats for Tier View */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-800">
                  <CardBody className="p-4">
                    <p className="text-xs text-gray-400 uppercase mb-1">Total Tiers</p>
                    <p className="text-2xl font-bold text-white">{tierBreakdown.length}</p>
                  </CardBody>
                </Card>
                <Card className="bg-zinc-800">
                  <CardBody className="p-4">
                    <p className="text-xs text-gray-400 uppercase mb-1">Total Contributions</p>
                    <p className="text-2xl font-bold text-white">
                      {tierBreakdown.reduce((sum, t) => sum + t.contribution_count, 0)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="bg-zinc-800">
                  <CardBody className="p-4">
                    <p className="text-xs text-gray-400 uppercase mb-1">Total Raised (All Tiers)</p>
                    <p className="text-2xl font-bold text-[#B3FF00]">
                      {formatCurrency(tierBreakdown.reduce((sum, t) => sum + t.total_amount, 0))}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {selectedBacker && (
        <BackerDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseModal}
          backerId={selectedBacker.backer_id}
        />
      )}
    </div>
  );
}
