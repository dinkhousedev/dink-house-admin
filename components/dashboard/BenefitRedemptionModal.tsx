"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Icon } from "@iconify/react";

interface Benefit {
  id: string;
  backer_id: string;
  email: string;
  first_name: string;
  last_initial: string;
  benefit_type: string;
  benefit_name: string;
  total_allocated: number | null;
  remaining: number | null;
  valid_until: string | null;
}

interface BenefitRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  benefit: Benefit | null;
  onSuccess: () => void;
}

export default function BenefitRedemptionModal({
  isOpen,
  onClose,
  benefit,
  onSuccess,
}: BenefitRedemptionModalProps) {
  const [quantityUsed, setQuantityUsed] = useState("1");
  const [usedFor, setUsedFor] = useState("");
  const [notes, setNotes] = useState("");
  const [staffVerified, setStaffVerified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!benefit) return;

    const quantity = parseInt(quantityUsed);
    if (isNaN(quantity) || quantity < 1) {
      setError("Please enter a valid quantity");
      return;
    }

    if (benefit.remaining !== null && quantity > benefit.remaining) {
      setError(`Only ${benefit.remaining} units remaining`);
      return;
    }

    if (!usedFor.trim()) {
      setError("Please describe what the benefit was used for");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Insert usage log
      const { error: logError } = await supabase
        .schema("crowdfunding")
        .from("benefit_usage_log")
        .insert({
          allocation_id: benefit.id,
          backer_id: benefit.backer_id,
          quantity_used: quantity,
          used_for: usedFor,
          notes: notes || null,
          staff_verified: staffVerified,
          // staff_id: "current-user-id", // TODO: Get from auth
        });

      if (logError) throw logError;

      // Reset form
      setQuantityUsed("1");
      setUsedFor("");
      setNotes("");
      setStaffVerified(true);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while redeeming the benefit");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantityUsed("1");
    setUsedFor("");
    setNotes("");
    setStaffVerified(true);
    setError("");
    onClose();
  };

  if (!benefit) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent className="bg-zinc-900 text-white">
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" className="text-[#B3FF00]" width={24} />
            <span>Redeem Benefit</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Backer Info */}
            <div className="p-3 bg-zinc-800 rounded-lg">
              <p className="text-sm text-gray-400">Backer</p>
              <p className="font-semibold">
                {benefit.first_name} {benefit.last_initial}.
              </p>
              <p className="text-sm text-gray-500">{benefit.email}</p>
            </div>

            {/* Benefit Info */}
            <div className="p-3 bg-zinc-800 rounded-lg">
              <p className="text-sm text-gray-400">Benefit</p>
              <p className="font-semibold">{benefit.benefit_name}</p>
              {benefit.remaining !== null && (
                <p className="text-sm text-gray-500 mt-1">
                  Remaining: {benefit.remaining} / {benefit.total_allocated}
                </p>
              )}
              {benefit.valid_until && (
                <p className="text-sm text-gray-500">
                  Valid until: {new Date(benefit.valid_until).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Quantity Input */}
            <Input
              label="Quantity Used"
              type="number"
              min="1"
              max={benefit.remaining ?? undefined}
              value={quantityUsed}
              onValueChange={setQuantityUsed}
              description={
                benefit.remaining !== null
                  ? `Maximum: ${benefit.remaining}`
                  : "Unlimited usage"
              }
              isRequired
            />

            {/* Used For Input */}
            <Input
              label="Used For"
              placeholder="e.g., Court 3 reservation, Ball machine session"
              value={usedFor}
              onValueChange={setUsedFor}
              description="What was this benefit used for?"
              isRequired
            />

            {/* Notes */}
            <Textarea
              label="Additional Notes"
              placeholder="Any additional details about this redemption..."
              value={notes}
              onValueChange={setNotes}
              minRows={2}
            />

            {/* Staff Verification */}
            <Checkbox
              isSelected={staffVerified}
              onValueChange={setStaffVerified}
              classNames={{
                label: "text-sm",
              }}
            >
              Staff verified - I confirm this benefit was redeemed
            </Checkbox>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-[#B3FF00] text-black"
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={loading}
          >
            {loading ? "Processing..." : "Redeem Benefit"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
