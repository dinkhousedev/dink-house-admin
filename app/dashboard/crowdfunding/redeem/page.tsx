"use client";

import { useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Icon } from "@iconify/react";

import BenefitRedemptionModal from "@/components/dashboard/BenefitRedemptionModal";

interface BackerBenefit {
  id: string;
  backer_id: string;
  email: string;
  first_name: string;
  last_initial: string;
  benefit_type: string;
  benefit_name: string;
  total_allocated: number | null;
  total_used: number | null;
  remaining: number | null;
  valid_from: string;
  valid_until: string | null;
  is_valid: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UsageHistory {
  id: string;
  quantity_used: number;
  usage_date: string;
  usage_time: string;
  used_for: string;
  staff_verified: boolean;
  notes: string | null;
  created_at: string;
}

export default function BenefitRedemptionPage() {
  const [searchEmail, setSearchEmail] = useState("");
  const [benefits, setBenefits] = useState<BackerBenefit[]>([]);
  const [usageHistory, setUsageHistory] = useState<
    Record<string, UsageHistory[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [backerId, setBackerId] = useState<string | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<BackerBenefit | null>(
    null,
  );
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const searchBacker = useCallback(async () => {
    if (!searchEmail.trim()) return;

    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Search for backer by email using v_backer_summary which includes email
      const { data: backerData, error: backerError } = await supabase
        .schema("crowdfunding")
        .from("v_backer_summary")
        .select("*")
        .eq("email", searchEmail.toLowerCase())
        .single();

      if (backerError || !backerData) {
        console.log("Backer search error:", backerError);
        setBenefits([]);
        setBackerId(null);
        setLoading(false);

        return;
      }

      console.log("Found backer:", backerData);
      setBackerId(backerData.backer_id);

      // Fetch backer's active benefits
      const { data: benefitsData, error: benefitsError } = await supabase
        .schema("crowdfunding")
        .from("v_active_backer_benefits")
        .select("*")
        .eq("backer_id", backerData.backer_id);

      console.log("Active benefits from view:", benefitsData);
      console.log("Active benefits error:", benefitsError);

      if (benefitsError) {
        console.error("Error fetching benefits:", benefitsError);
        setBenefits([]);
      } else {
        setBenefits(benefitsData || []);
      }
    } catch (error) {
      console.error("Error searching backer:", error);
    } finally {
      setLoading(false);
    }
  }, [searchEmail]);

  const loadUsageHistory = useCallback(async (allocationId: string) => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase
        .schema("crowdfunding")
        .from("benefit_usage_log")
        .select("*")
        .eq("allocation_id", allocationId)
        .order("usage_time", { ascending: false });

      if (error) throw error;

      setUsageHistory((prev) => ({
        ...prev,
        [allocationId]: data || [],
      }));
    } catch (error) {
      console.error("Error loading usage history:", error);
    }
  }, []);

  const handleRedeem = (benefit: BackerBenefit) => {
    setSelectedBenefit(benefit);
    setShowRedeemModal(true);
  };

  const handleRedemptionSuccess = async () => {
    // Refresh benefits list
    if (backerId) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const { data, error } = await supabase
          .schema("crowdfunding")
          .from("v_active_backer_benefits")
          .select("*")
          .eq("backer_id", backerId);

        if (!error) {
          setBenefits(data || []);
        }
      } catch (error) {
        console.error("Error refreshing benefits:", error);
      }
    }
  };

  const formatBenefitType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getBenefitTypeIcon = (type: string) => {
    switch (type) {
      case "court_time_hours":
        return "solar:court-bold";
      case "dink_board_sessions":
      case "ball_machine_sessions":
        return "solar:tennis-bold";
      case "pro_shop_discount":
        return "solar:ticket-sale-bold";
      case "membership_months":
        return "solar:card-bold";
      case "private_lessons":
        return "solar:user-speak-bold";
      case "guest_passes":
        return "solar:users-group-two-rounded-bold";
      case "priority_booking":
        return "solar:star-bold";
      case "recognition":
        return "solar:medal-star-bold";
      default:
        return "solar:gift-bold";
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Benefit Redemption</h1>
          <p className="text-gray-400 mt-1">
            Search for backers and redeem their crowdfunding benefits
          </p>
        </div>

        {/* Search Card */}
        <Card className="bg-zinc-900">
          <CardBody>
            <div className="flex gap-4">
              <Input
                className="flex-1"
                placeholder="Enter backer email address..."
                startContent={<Icon icon="solar:magnifer-linear" width={20} />}
                value={searchEmail}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    searchBacker();
                  }
                }}
                onValueChange={setSearchEmail}
              />
              <Button
                className="bg-[#B3FF00] text-black"
                isLoading={loading}
                onPress={searchBacker}
              >
                Search
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Benefits List */}
        {benefits.length > 0 && (
          <Card className="bg-zinc-900">
            <CardHeader className="border-b border-zinc-800">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-bold text-white">
                  Available Benefits ({benefits.length})
                </h2>
                <Chip color="success" variant="flat">
                  Active Backer
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <Card key={benefit.id} className="bg-zinc-800">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="p-3 bg-zinc-700 rounded-lg">
                            <Icon
                              className="text-[#B3FF00]"
                              icon={getBenefitTypeIcon(benefit.benefit_type)}
                              width={32}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {benefit.benefit_name}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {formatBenefitType(benefit.benefit_type)}
                            </p>
                            <div className="flex gap-4 mt-2">
                              {benefit.remaining !== null && (
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Remaining
                                  </p>
                                  <p className="text-lg font-bold text-white">
                                    {benefit.remaining}
                                    <span className="text-sm text-gray-400">
                                      {" "}
                                      / {benefit.total_allocated}
                                    </span>
                                  </p>
                                </div>
                              )}
                              {benefit.total_used !== null &&
                                benefit.total_used > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Used
                                    </p>
                                    <p className="text-lg font-bold text-gray-400">
                                      {benefit.total_used}
                                    </p>
                                  </div>
                                )}
                              {benefit.valid_until && (
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Valid Until
                                  </p>
                                  <p className="text-sm text-white">
                                    {new Date(
                                      benefit.valid_until,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            className="bg-[#B3FF00] text-black"
                            isDisabled={
                              !benefit.is_valid ||
                              (benefit.remaining !== null &&
                                benefit.remaining <= 0)
                            }
                            size="sm"
                            onPress={() => handleRedeem(benefit)}
                          >
                            Redeem
                          </Button>
                          {(benefit.total_used ?? 0) > 0 && (
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => loadUsageHistory(benefit.id)}
                            >
                              History
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Usage History */}
                      {usageHistory[benefit.id] &&
                        usageHistory[benefit.id].length > 0 && (
                          <div className="mt-4 pt-4 border-t border-zinc-700">
                            <Accordion variant="light">
                              <AccordionItem
                                title={
                                  <span className="text-sm text-gray-400">
                                    Usage History (
                                    {usageHistory[benefit.id].length})
                                  </span>
                                }
                              >
                                <div className="space-y-2">
                                  {usageHistory[benefit.id].map((usage) => (
                                    <div
                                      key={usage.id}
                                      className="p-3 bg-zinc-700 rounded-lg"
                                    >
                                      <div className="flex justify-between">
                                        <div>
                                          <p className="text-sm font-semibold text-white">
                                            {usage.used_for}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {new Date(
                                              usage.usage_time,
                                            ).toLocaleString()}
                                          </p>
                                          {usage.notes && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              {usage.notes}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-lg font-bold text-white">
                                            {usage.quantity_used}
                                          </p>
                                          {usage.staff_verified && (
                                            <Chip
                                              color="success"
                                              size="sm"
                                              startContent={
                                                <Icon
                                                  icon="solar:shield-check-bold"
                                                  width={12}
                                                />
                                              }
                                              variant="flat"
                                            >
                                              Verified
                                            </Chip>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* No Results */}
        {!loading &&
          searchEmail &&
          benefits.length === 0 &&
          backerId === null && (
            <Card className="bg-zinc-900">
              <CardBody className="text-center py-12">
                <Icon
                  className="text-gray-600 mx-auto mb-4"
                  icon="solar:user-cross-bold"
                  width={64}
                />
                <p className="text-xl text-gray-400">No backer found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try searching with a different email address
                </p>
              </CardBody>
            </Card>
          )}

        {/* No Benefits */}
        {!loading && benefits.length === 0 && backerId !== null && (
          <Card className="bg-zinc-900">
            <CardBody className="text-center py-12">
              <Icon
                className="text-gray-600 mx-auto mb-4"
                icon="solar:gift-bold"
                width={64}
              />
              <p className="text-xl text-gray-400">No active benefits</p>
              <p className="text-sm text-gray-500 mt-2">
                This backer has no redeemable benefits at this time
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Redemption Modal */}
      <BenefitRedemptionModal
        benefit={selectedBenefit}
        isOpen={showRedeemModal}
        onClose={() => {
          setShowRedeemModal(false);
          setSelectedBenefit(null);
        }}
        onSuccess={handleRedemptionSuccess}
      />
    </div>
  );
}
