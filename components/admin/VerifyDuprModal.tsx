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
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";

import type { Member } from "@/types/admin/member";

interface VerifyDuprModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSuccess?: () => void;
}

export default function VerifyDuprModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: VerifyDuprModalProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (verified: boolean) => {
    if (!member) return;

    setLoading(true);
    try {
      // Get current admin user info
      const userResponse = await fetch("/api/auth/user");
      const userData = await userResponse.json();

      if (!userData.success || !userData.user?.id) {
        alert("Failed to get current user information");

        return;
      }

      const response = await fetch(
        `/api/admin/members/${member.id}/verify-dupr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verified,
            verified_by: userData.user.id,
            notes: notes || null,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert(
          data.message ||
            `DUPR rating ${verified ? "verified" : "rejected"} successfully`,
        );
        setNotes("");
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(data.error || "Failed to verify DUPR rating");
      }
    } catch (error) {
      console.error("Error verifying DUPR:", error);
      alert("An error occurred while verifying DUPR rating");
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Modal
      classNames={{
        base: "bg-[#0F0F0F] border border-dink-gray",
        header: "border-b border-dink-gray",
        footer: "border-t border-dink-gray",
      }}
      isOpen={isOpen}
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Icon
              className="text-warning"
              icon="solar:shield-check-bold"
              width={28}
            />
            <span className="text-athletic text-xl">Verify DUPR Rating</span>
          </div>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Member Info */}
            <div className="rounded-lg border border-dink-gray bg-[#151515] p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-default-500">
                Member Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-default-500">Name</p>
                  <p className="font-medium text-dink-white">
                    {member.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-500">Email</p>
                  <p className="text-sm text-default-400">{member.email}</p>
                </div>
                <div>
                  <p className="text-xs text-default-500">Membership Level</p>
                  <Chip className="mt-1" size="sm" variant="flat">
                    {member.membership_level.toUpperCase()}
                  </Chip>
                </div>
              </div>
            </div>

            {/* DUPR Rating */}
            <div className="rounded-lg border border-warning bg-warning/10 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-warning">
                Submitted DUPR Rating
              </h3>
              <div className="flex items-center gap-3">
                <Chip
                  className="font-mono text-2xl"
                  color="warning"
                  size="lg"
                  variant="flat"
                >
                  {member.dupr_rating?.toFixed(2) || "N/A"}
                </Chip>
                <div className="flex-1">
                  <p className="text-xs text-default-500">Current Status</p>
                  <p className="text-sm text-default-400">
                    {member.profile_status === "pending_verification"
                      ? "Pending Verification"
                      : member.profile_status === "verified"
                        ? "Verified"
                        : "Incomplete"}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Textarea
                classNames={{
                  input: "text-sm",
                  inputWrapper: "bg-[#151515] border border-dink-gray",
                }}
                label="Verification Notes (Optional)"
                placeholder="Add any notes about this verification..."
                value={notes}
                variant="bordered"
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="mt-2 text-xs text-default-500">
                These notes will be stored with the verification record
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="danger"
            isDisabled={loading}
            startContent={<Icon icon="solar:close-circle-bold" />}
            variant="flat"
            onPress={() => handleVerify(false)}
          >
            Reject
          </Button>
          <Button
            className="bg-success text-success-foreground"
            isDisabled={loading}
            isLoading={loading}
            startContent={
              !loading && <Icon icon="solar:check-circle-bold" />
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
