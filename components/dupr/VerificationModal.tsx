"use client";

import type { PendingDUPRVerification } from "@/types/player";

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
import { Icon } from "@iconify/react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PendingDUPRVerification | null;
  onVerify: (verified: boolean, notes: string) => Promise<void>;
}

export default function VerificationModal({
  isOpen,
  onClose,
  player,
  onVerify,
}: VerificationModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async (verified: boolean) => {
    setIsSubmitting(true);

    try {
      await onVerify(verified, notes);
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Error verifying DUPR:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!player) return null;

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Verify DUPR Rating</h2>
          <p className="text-sm font-normal text-default-500">
            {player.full_name}
          </p>
        </ModalHeader>
        <ModalBody className="gap-6 py-6">
          {/* Player Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-default-200 bg-default-50 p-4">
            <div>
              <p className="text-sm text-default-500">Email</p>
              <p className="font-medium">{player.email}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Phone</p>
              <p className="font-medium">{player.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Submitted DUPR</p>
              <p className="text-2xl font-bold text-dink-lime">
                {player.dupr_rating.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-default-500">Submitted Date</p>
              <p className="font-medium">
                {new Date(player.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="flex gap-3 rounded-lg border border-warning-200 bg-warning-50/50 p-4">
            <Icon
              className="mt-0.5 flex-shrink-0 text-warning-600"
              icon="solar:info-circle-bold"
              width={20}
            />
            <div className="text-sm text-warning-800">
              <p className="mb-1 font-semibold">Verification Instructions</p>
              <p>
                Please verify that this player&apos;s DUPR rating matches their
                official DUPR app profile. You may request a screenshot or check
                their profile directly if they&apos;ve shared their DUPR profile
                link.
              </p>
            </div>
          </div>

          {/* Notes Field */}
          <Textarea
            description="Optional notes about the verification (e.g., 'Verified via DUPR app screenshot')"
            label="Verification Notes"
            placeholder="Add any notes about this verification..."
            value={notes}
            variant="bordered"
            onChange={(e) => setNotes(e.target.value)}
          />
        </ModalBody>
        <ModalFooter className="gap-3">
          <Button color="default" variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="danger"
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            startContent={
              !isSubmitting && <Icon icon="solar:close-circle-bold" />
            }
            variant="flat"
            onPress={() => handleVerify(false)}
          >
            Reject
          </Button>
          <Button
            className="btn-athletic"
            color="success"
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            startContent={
              !isSubmitting && <Icon icon="solar:check-circle-bold" />
            }
            onPress={() => handleVerify(true)}
          >
            Approve & Verify
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
