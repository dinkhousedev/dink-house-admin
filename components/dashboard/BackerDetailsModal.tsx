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
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Icon } from "@iconify/react";
import { Tabs, Tab } from "@heroui/tabs";

interface BackerDetails {
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
}

interface Contribution {
  contribution_id: string;
  contribution_date: string;
  tier_name: string;
  contribution_amount: number;
  campaign_name: string;
  status?: string;
  refunded_at?: string | null;
}

interface BenefitDetail {
  allocation_id: string;
  benefit_type: string;
  benefit_name: string;
  benefit_description: string | null;
  quantity_allocated: number | null;
  quantity_used: number | null;
  quantity_remaining: number | null;
  fulfillment_status: string;
  valid_from: string;
  valid_until: string | null;
  is_valid: boolean;
  days_until_expiration: number | null;
  tier_name: string;
  contribution_amount: number;
  contribution_date: string;
}

interface MerchandiseItem {
  id: string;
  allocation_id: string;
  item_type: string;
  item_description: string;
  quantity: number;
  size: string | null;
  pickup_status: string;
  ready_for_pickup_date: string | null;
  picked_up_at: string | null;
  pickup_notes: string | null;
}

interface EventAccess {
  id: string;
  allocation_id: string;
  event_type: string;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  guest_count_allowed: number;
  rsvp_status: string;
  attendance_status: string;
  check_in_time: string | null;
}

interface BackerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  backerId: string;
}

export default function BackerDetailsModal({
  isOpen,
  onClose,
  backerId,
}: BackerDetailsModalProps) {
  const [backer, setBacker] = useState<BackerDetails | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [benefits, setBenefits] = useState<BenefitDetail[]>([]);
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [events, setEvents] = useState<EventAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitDetail | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimQuantity, setClaimQuantity] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (isOpen && backerId) {
      fetchBackerDetails();
    }
  }, [isOpen, backerId]);

  const fetchBackerDetails = async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Fetch backer info - use public.backers view
      const { data: backerData, error: backerError } = await supabase
        .from("backers")
        .select("*")
        .eq("id", backerId)
        .single();

      if (backerError) throw backerError;
      setBacker(backerData);

      // Fetch ALL contributions directly using RPC to bypass view limitations
      const { data: contribData, error: contribError } = await supabase
        .rpc('get_backer_contributions', {
          p_backer_id: backerId
        });

      if (contribError) {
        console.error("Error fetching contributions via RPC:", contribError);
        throw contribError;
      }

      console.log("Contributions data from RPC:", contribData);

      const formattedContributions = (contribData || []).map((c: any) => ({
        contribution_id: c.id,
        contribution_date: c.completed_at,
        tier_name: c.tier_name || "Custom",
        contribution_amount: c.amount,
        campaign_name: c.campaign_name || "Campaign",
        status: c.status,
        refunded_at: c.refunded_at,
      }));
      setContributions(formattedContributions);

      // Fetch benefits - exclude recognition-only benefits
      const { data: benefitsData, error: benefitsError } = await supabase
        .from("v_backer_benefits_detailed")
        .select("*")
        .eq("backer_id", backerId)
        .neq("benefit_type", "recognition")
        .order("contribution_date", { ascending: false });

      if (benefitsError) {
        console.error("Error fetching benefits:", benefitsError);
        throw benefitsError;
      }

      console.log("Benefits data:", benefitsData);
      setBenefits(benefitsData || []);

      // Fetch merchandise items
      const { data: merchandiseData, error: merchandiseError } = await supabase
        .schema("crowdfunding")
        .from("benefit_merchandise_items")
        .select("*")
        .eq("backer_id", backerId)
        .order("created_at", { ascending: false });

      if (merchandiseError) {
        console.error("Error fetching merchandise:", merchandiseError);
      } else {
        console.log("Merchandise data:", merchandiseData);
        setMerchandise(merchandiseData || []);
      }

      // Fetch event access
      const { data: eventsData, error: eventsError } = await supabase
        .schema("crowdfunding")
        .from("benefit_event_access")
        .select("*")
        .eq("backer_id", backerId)
        .order("event_date", { ascending: true });

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
      } else {
        console.log("Events data:", eventsData);
        setEvents(eventsData || []);
      }
    } catch (error) {
      console.error("Error fetching backer details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBenefit = async () => {
    if (!selectedBenefit || !claimQuantity) return;

    setClaiming(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const quantity = parseFloat(claimQuantity);

      // Call redeem_benefit RPC
      const { error } = await supabase.rpc("redeem_benefit", {
        p_allocation_id: selectedBenefit.allocation_id,
        p_quantity: quantity,
        p_used_for: claimNotes || `Claimed by staff on ${new Date().toLocaleDateString()}`,
        p_staff_id: null, // TODO: Get actual staff ID from auth
        p_notes: claimNotes,
      });

      if (error) throw error;

      // Refresh data
      await fetchBackerDetails();
      setShowClaimModal(false);
      setSelectedBenefit(null);
      setClaimQuantity("");
      setClaimNotes("");
    } catch (error) {
      console.error("Error claiming benefit:", error);
      alert("Failed to claim benefit. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  const handleRefundContribution = async () => {
    if (!selectedContribution) return;

    setRefunding(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Call refund_contribution RPC
      const { data, error } = await supabase.rpc("refund_contribution", {
        p_contribution_id: selectedContribution.contribution_id,
        p_refund_reason: refundReason || "Admin refund",
        p_staff_id: null, // TODO: Get actual staff ID from auth
        p_stripe_refund_id: null, // TODO: Integrate with Stripe refund if needed
      });

      if (error) throw error;

      // Check if refund was successful
      if (data && data.length > 0 && data[0].success) {
        // Refresh data
        await fetchBackerDetails();
        setShowRefundModal(false);
        setSelectedContribution(null);
        setRefundReason("");
        alert(`Refund successful: ${data[0].message}`);
      } else {
        throw new Error(data && data[0]?.message || "Refund failed");
      }
    } catch (error: any) {
      console.error("Error refunding contribution:", error);
      alert(`Failed to refund contribution: ${error.message || "Please try again."}`);
    } finally {
      setRefunding(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const getBenefitIcon = (type: string) => {
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-zinc-900 border-2 border-zinc-800",
          header: "border-b border-zinc-800",
          body: "py-6",
          footer: "border-t border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Backer Details</h2>
            {backer && (
              <p className="text-sm text-gray-400 font-normal">
                Member since {backer.created_at ? new Date(backer.created_at).toLocaleDateString() : 'N/A'}
              </p>
            )}
          </ModalHeader>

          <ModalBody>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icon
                  icon="solar:loading-linear"
                  className="text-[#B3FF00] animate-spin"
                  width={48}
                />
              </div>
            ) : backer ? (
              <div className="space-y-6">
                {/* Backer Info */}
                <Card className="bg-zinc-800">
                  <CardBody className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Name</p>
                        <p className="text-lg font-semibold text-white">
                          {backer.first_name} {backer.last_initial}.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                        <p className="text-sm text-white">{backer.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                        <p className="text-sm text-white">{backer.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Location</p>
                        <p className="text-sm text-white">
                          {backer.city && backer.state
                            ? `${backer.city}, ${backer.state}`
                            : backer.city || backer.state || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Total Contributed</p>
                        <p className="text-lg font-bold text-[#B3FF00]">
                          {formatCurrency(backer.total_contributed)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Contributions</p>
                        <p className="text-lg font-semibold text-white">
                          {backer.contribution_count}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Tabs for Contributions, Benefits, Merchandise, and Events */}
                {(benefits.length > 0 || merchandise.length > 0 || events.length > 0) ? (
                  <Tabs
                    aria-label="Backer details tabs"
                    classNames={{
                      tabList: "bg-zinc-800",
                      cursor: "bg-[#B3FF00]",
                      tab: "text-white",
                      tabContent: "group-data-[selected=true]:text-black",
                    }}
                  >
                    <Tab
                      key="contributions"
                      title={
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:dollar-minimalistic-bold" width={18} />
                          <span>Contributions ({contributions.length})</span>
                        </div>
                      }
                    >
                    <div className="space-y-3 mt-4">
                      {contributions.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No contributions found</p>
                      ) : (
                        contributions.map((contribution) => (
                          <Card key={contribution.contribution_id} className="bg-zinc-800">
                            <CardBody className="p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-white">
                                      {contribution.tier_name}
                                    </p>
                                    {contribution.status === "refunded" && (
                                      <Chip size="sm" color="danger" variant="flat">
                                        Refunded
                                      </Chip>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {contribution.campaign_name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(contribution.contribution_date).toLocaleDateString()}
                                    {contribution.refunded_at && (
                                      <span className="text-red-400 ml-2">
                                        • Refunded on {new Date(contribution.refunded_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className={`text-xl font-bold ${contribution.status === "refunded" ? "text-gray-500 line-through" : "text-[#B3FF00]"}`}>
                                    {formatCurrency(contribution.contribution_amount)}
                                  </p>
                                  {contribution.status === "completed" && (
                                    <Button
                                      size="sm"
                                      color="danger"
                                      variant="flat"
                                      onPress={() => {
                                        setSelectedContribution(contribution);
                                        setShowRefundModal(true);
                                      }}
                                    >
                                      Refund
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))
                      )}
                    </div>
                  </Tab>

                  <Tab
                    key="benefits"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:gift-bold" width={18} />
                        <span>Benefits ({benefits.length})</span>
                      </div>
                    }
                  >
                    <div className="space-y-3 mt-4">
                      {benefits.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No benefits allocated</p>
                      ) : (
                        benefits.map((benefit) => (
                          <Card key={benefit.allocation_id} className="bg-zinc-800">
                            <CardBody className="p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-3 flex-1">
                                  <div className="p-2 bg-zinc-700 rounded-lg h-fit">
                                    <Icon
                                      icon={getBenefitIcon(benefit.benefit_type)}
                                      className="text-[#B3FF00]"
                                      width={24}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-white">
                                        {benefit.benefit_name}
                                      </p>
                                      <Chip
                                        size="sm"
                                        color={getStatusColor(benefit.fulfillment_status)}
                                        variant="flat"
                                      >
                                        {benefit.fulfillment_status}
                                      </Chip>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      {formatBenefitType(benefit.benefit_type)} • {benefit.tier_name}
                                    </p>
                                    <div className="flex gap-4 mt-2 text-sm">
                                      {benefit.quantity_allocated !== null && (
                                        <div>
                                          <span className="text-gray-500">Allocated: </span>
                                          <span className="text-white font-semibold">
                                            {benefit.quantity_allocated}
                                          </span>
                                        </div>
                                      )}
                                      {benefit.quantity_used !== null && benefit.quantity_used > 0 && (
                                        <div>
                                          <span className="text-gray-500">Used: </span>
                                          <span className="text-yellow-500 font-semibold">
                                            {benefit.quantity_used}
                                          </span>
                                        </div>
                                      )}
                                      {benefit.quantity_remaining !== null && (
                                        <div>
                                          <span className="text-gray-500">Remaining: </span>
                                          <span className="text-[#B3FF00] font-semibold">
                                            {benefit.quantity_remaining}
                                          </span>
                                        </div>
                                      )}
                                      {benefit.valid_until && (
                                        <div>
                                          <span className="text-gray-500">Expires: </span>
                                          <span
                                            className={
                                              benefit.days_until_expiration !== null &&
                                              benefit.days_until_expiration < 30
                                                ? "text-red-400 font-semibold"
                                                : "text-white"
                                            }
                                          >
                                            {new Date(benefit.valid_until).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {benefit.is_valid &&
                                  benefit.fulfillment_status !== "fulfilled" &&
                                  benefit.quantity_remaining !== 0 && (
                                    <Button
                                      size="sm"
                                      className="bg-[#B3FF00] text-black font-semibold"
                                      onPress={() => {
                                        setSelectedBenefit(benefit);
                                        setClaimQuantity(
                                          benefit.quantity_remaining?.toString() || "1"
                                        );
                                        setShowClaimModal(true);
                                      }}
                                    >
                                      Mark as Claimed
                                    </Button>
                                  )}
                              </div>
                            </CardBody>
                          </Card>
                        ))
                      )}
                    </div>
                  </Tab>

                  {/* Merchandise Tab */}
                  {merchandise.length > 0 && (
                    <Tab
                      key="merchandise"
                      title={
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:bag-4-bold" width={18} />
                          <span>Merchandise ({merchandise.length})</span>
                        </div>
                      }
                    >
                      <div className="space-y-3 mt-4">
                        {merchandise.map((item) => (
                          <Card key={item.id} className="bg-zinc-800">
                            <CardBody className="p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-3 flex-1">
                                  <div className="p-2 bg-zinc-700 rounded-lg h-fit">
                                    <Icon
                                      icon="solar:bag-4-bold"
                                      className="text-[#B3FF00]"
                                      width={24}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-white capitalize">
                                        {item.item_type.replace(/_/g, ' ')}
                                      </p>
                                      <Chip
                                        size="sm"
                                        color={
                                          item.pickup_status === 'picked_up' ? 'success' :
                                          item.pickup_status === 'ready' ? 'warning' :
                                          'default'
                                        }
                                        variant="flat"
                                      >
                                        {item.pickup_status.replace(/_/g, ' ')}
                                      </Chip>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      {item.item_description}
                                    </p>
                                    <div className="flex gap-4 mt-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Quantity: </span>
                                        <span className="text-white font-semibold">
                                          {item.quantity}
                                        </span>
                                      </div>
                                      {item.size && (
                                        <div>
                                          <span className="text-gray-500">Size: </span>
                                          <span className="text-white font-semibold">
                                            {item.size}
                                          </span>
                                        </div>
                                      )}
                                      {item.ready_for_pickup_date && (
                                        <div>
                                          <span className="text-gray-500">Ready: </span>
                                          <span className="text-white">
                                            {new Date(item.ready_for_pickup_date).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                      {item.picked_up_at && (
                                        <div>
                                          <span className="text-gray-500">Picked up: </span>
                                          <span className="text-[#B3FF00]">
                                            {new Date(item.picked_up_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {item.pickup_notes && (
                                      <p className="text-xs text-gray-500 mt-2 italic">
                                        Note: {item.pickup_notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {item.pickup_status === 'ready' && (
                                  <Chip
                                    size="sm"
                                    color="warning"
                                    variant="solid"
                                    className="font-semibold"
                                  >
                                    Ready for Pickup
                                  </Chip>
                                )}
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                  )}

                  {/* Events Tab */}
                  {events.length > 0 && (
                    <Tab
                      key="events"
                      title={
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:calendar-mark-bold" width={18} />
                          <span>Events ({events.length})</span>
                        </div>
                      }
                    >
                      <div className="space-y-3 mt-4">
                        {events.map((event) => (
                          <Card key={event.id} className="bg-zinc-800">
                            <CardBody className="p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-3 flex-1">
                                  <div className="p-2 bg-zinc-700 rounded-lg h-fit">
                                    <Icon
                                      icon="solar:calendar-mark-bold"
                                      className="text-[#B3FF00]"
                                      width={24}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-white">
                                        {event.event_name}
                                      </p>
                                      <Chip
                                        size="sm"
                                        color={
                                          event.rsvp_status === 'confirmed' ? 'success' :
                                          event.rsvp_status === 'declined' ? 'danger' :
                                          'default'
                                        }
                                        variant="flat"
                                      >
                                        RSVP: {event.rsvp_status}
                                      </Chip>
                                      {event.attendance_status === 'attended' && (
                                        <Chip size="sm" color="success" variant="solid">
                                          Attended
                                        </Chip>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400 capitalize">
                                      {event.event_type.replace(/_/g, ' ')}
                                    </p>
                                    <div className="flex gap-4 mt-2 text-sm">
                                      {event.event_date && (
                                        <div>
                                          <span className="text-gray-500">Date: </span>
                                          <span className="text-white font-semibold">
                                            {new Date(event.event_date).toLocaleDateString()}
                                          </span>
                                          {event.event_time && (
                                            <span className="text-gray-500 ml-2">
                                              {event.event_time}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {event.guest_count_allowed > 0 && (
                                        <div>
                                          <span className="text-gray-500">Guests allowed: </span>
                                          <span className="text-[#B3FF00] font-semibold">
                                            {event.guest_count_allowed}
                                          </span>
                                        </div>
                                      )}
                                      {event.check_in_time && (
                                        <div>
                                          <span className="text-gray-500">Checked in: </span>
                                          <span className="text-white">
                                            {new Date(event.check_in_time).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                  )}
                </Tabs>
                ) : (
                  /* Show contributions only (no benefits tab) */
                  <Card className="bg-zinc-800">
                    <CardHeader className="border-b border-zinc-700">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:dollar-minimalistic-bold" className="text-[#B3FF00]" width={20} />
                        <h3 className="text-lg font-semibold text-white">
                          Contributions ({contributions.length})
                        </h3>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-3">
                        {contributions.length === 0 ? (
                          <p className="text-gray-400 text-center py-8">No contributions found</p>
                        ) : (
                          contributions.map((contribution) => (
                            <Card key={contribution.contribution_id} className="bg-zinc-800">
                              <CardBody className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-white">
                                        {contribution.tier_name}
                                      </p>
                                      {contribution.status === "refunded" && (
                                        <Chip size="sm" color="danger" variant="flat">
                                          Refunded
                                        </Chip>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      {contribution.campaign_name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(contribution.contribution_date).toLocaleDateString()}
                                      {contribution.refunded_at && (
                                        <span className="text-red-400 ml-2">
                                          • Refunded on {new Date(contribution.refunded_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className={`text-xl font-bold ${contribution.status === "refunded" ? "text-gray-500 line-through" : "text-[#B3FF00]"}`}>
                                      {formatCurrency(contribution.contribution_amount)}
                                    </p>
                                    {contribution.status === "completed" && (
                                      <Button
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        onPress={() => {
                                          setSelectedContribution(contribution);
                                          setShowRefundModal(true);
                                        }}
                                      >
                                        Refund
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))
                        )}
                      </div>
                      <div className="mt-4 p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                          <Icon icon="solar:info-circle-bold" width={16} className="text-[#B3FF00]" />
                          This backer has no claimable benefits (donation only)
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Backer not found</p>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Claim Benefit Modal */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false);
          setSelectedBenefit(null);
          setClaimQuantity("");
          setClaimNotes("");
        }}
        size="lg"
        classNames={{
          base: "bg-zinc-900 border-2 border-zinc-800",
          header: "border-b border-zinc-800",
          body: "py-6",
          footer: "border-t border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-white">Mark Benefit as Claimed</h3>
          </ModalHeader>
          <ModalBody>
            {selectedBenefit && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Benefit</p>
                  <p className="font-semibold text-white">{selectedBenefit.benefit_name}</p>
                </div>
                {selectedBenefit.quantity_allocated !== null && (
                  <Input
                    type="number"
                    label="Quantity to Claim"
                    placeholder="Enter quantity"
                    value={claimQuantity}
                    onValueChange={setClaimQuantity}
                    min="0"
                    max={selectedBenefit.quantity_remaining?.toString()}
                    description={`Available: ${selectedBenefit.quantity_remaining}`}
                    classNames={{
                      input: "bg-zinc-800 text-white",
                      inputWrapper: "bg-zinc-800 border-zinc-700",
                    }}
                  />
                )}
                <Textarea
                  label="Notes (optional)"
                  placeholder="Add notes about this redemption..."
                  value={claimNotes}
                  onValueChange={setClaimNotes}
                  classNames={{
                    input: "bg-zinc-800 text-white",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setShowClaimModal(false);
                setSelectedBenefit(null);
              }}
              isDisabled={claiming}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#B3FF00] text-black font-semibold"
              onPress={handleClaimBenefit}
              isLoading={claiming}
              isDisabled={!claimQuantity || parseFloat(claimQuantity) <= 0}
            >
              Confirm Claim
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Refund Contribution Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedContribution(null);
          setRefundReason("");
        }}
        size="lg"
        classNames={{
          base: "bg-zinc-900 border-2 border-zinc-800",
          header: "border-b border-zinc-800",
          body: "py-6",
          footer: "border-t border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold text-white">Refund Contribution</h3>
          </ModalHeader>
          <ModalBody>
            {selectedContribution && (
              <div className="space-y-4">
                <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon icon="solar:danger-triangle-bold" className="text-red-500 mt-1" width={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-400">Warning</p>
                      <p className="text-xs text-red-300 mt-1">
                        This will refund the contribution and deactivate all associated benefits.
                        This action cannot be undone from the admin panel.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Contribution Details</p>
                  <div className="p-3 bg-zinc-800 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Tier:</span>
                      <span className="text-sm font-semibold text-white">{selectedContribution.tier_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Campaign:</span>
                      <span className="text-sm font-semibold text-white">{selectedContribution.campaign_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Amount:</span>
                      <span className="text-sm font-bold text-[#B3FF00]">
                        {formatCurrency(selectedContribution.contribution_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Date:</span>
                      <span className="text-sm text-white">
                        {new Date(selectedContribution.contribution_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Textarea
                  label="Refund Reason"
                  placeholder="Enter reason for refund (optional)..."
                  value={refundReason}
                  onValueChange={setRefundReason}
                  classNames={{
                    input: "bg-zinc-800 text-white",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setShowRefundModal(false);
                setSelectedContribution(null);
                setRefundReason("");
              }}
              isDisabled={refunding}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleRefundContribution}
              isLoading={refunding}
            >
              Confirm Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
