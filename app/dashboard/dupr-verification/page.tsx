"use client";

import type {
  PendingDUPRVerification,
  PendingVerificationsResponse,
} from "@/types/player";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Icon } from "@iconify/react";
import { useDisclosure } from "@heroui/react";

import { useAuth } from "@/context/auth-context";
import VerificationModal from "@/components/dupr/VerificationModal";
import { createClient } from "@/lib/supabase/client";

export default function DUPRVerificationPage() {
  const { employee } = useAuth();
  const [verifications, setVerifications] = useState<PendingDUPRVerification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] =
    useState<PendingDUPRVerification | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const supabase = createClient();

  const fetchPendingVerifications = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "get_pending_dupr_verifications",
        {
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (error) {
        console.error("Error fetching verifications:", error);

        return;
      }

      const response = data as PendingVerificationsResponse;

      if (response.success && response.data) {
        setVerifications(response.data);
      }
    } catch (err) {
      console.error("Exception fetching verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleOpenVerification = (player: PendingDUPRVerification) => {
    setSelectedPlayer(player);
    onOpen();
  };

  const handleVerify = async (verified: boolean, notes: string) => {
    if (!selectedPlayer || !employee) return;

    try {
      const { data, error } = await supabase.rpc("verify_player_dupr", {
        p_player_id: selectedPlayer.id,
        p_admin_id: employee.id,
        p_verified: verified,
        p_notes: notes || null,
      });

      if (error) {
        console.error("Error verifying DUPR:", error);

        return;
      }

      if (data?.success) {
        console.log(data.message || "DUPR rating processed successfully");
        // Refresh the list
        await fetchPendingVerifications();
      } else {
        console.error(data?.error || "Failed to process verification");
      }
    } catch (err) {
      console.error("Exception verifying DUPR:", err);
    }
  };

  const renderCell = (
    player: PendingDUPRVerification,
    columnKey: React.Key,
  ) => {
    switch (columnKey) {
      case "player":
        return (
          <div>
            <p className="font-semibold">{player.full_name}</p>
            <p className="text-sm text-default-500">{player.email}</p>
          </div>
        );
      case "dupr_rating":
        return (
          <Chip
            className="font-mono font-semibold"
            color="warning"
            size="lg"
            variant="flat"
          >
            {player.dupr_rating.toFixed(2)}
          </Chip>
        );
      case "submitted_at":
        return (
          <div>
            <p>{new Date(player.submitted_at).toLocaleDateString()}</p>
            <p className="text-sm text-default-500">
              {new Date(player.submitted_at).toLocaleTimeString()}
            </p>
          </div>
        );
      case "membership":
        return (
          <Chip size="sm" variant="flat">
            {player.membership_level}
          </Chip>
        );
      case "actions":
        return (
          <Button
            color="primary"
            size="sm"
            startContent={<Icon icon="solar:document-text-bold" />}
            onPress={() => handleOpenVerification(player)}
          >
            Verify
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-athletic">
            DUPR Verification Queue
          </h1>
          <p className="mt-2 text-default-500">
            Review and verify player DUPR ratings
          </p>
        </div>
        <Button
          color="default"
          startContent={<Icon icon="solar:refresh-bold" />}
          variant="flat"
          onPress={fetchPendingVerifications}
        >
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardBody className="flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100">
              <Icon
                className="text-warning-600"
                icon="solar:hourglass-bold"
                width={24}
              />
            </div>
            <div>
              <p className="text-sm text-default-500">Pending</p>
              <p className="text-2xl font-bold">{verifications.length}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Pending Verifications</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : verifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Icon
                className="mb-4 text-default-300"
                icon="solar:check-circle-bold"
                width={64}
              />
              <p className="text-lg font-semibold text-default-500">
                All caught up!
              </p>
              <p className="text-sm text-default-400">
                No pending DUPR verifications at this time
              </p>
            </div>
          ) : (
            <Table aria-label="Pending DUPR Verifications">
              <TableHeader>
                <TableColumn key="player">PLAYER</TableColumn>
                <TableColumn key="dupr_rating">DUPR RATING</TableColumn>
                <TableColumn key="submitted_at">SUBMITTED</TableColumn>
                <TableColumn key="membership">MEMBERSHIP</TableColumn>
                <TableColumn key="actions">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={verifications}>
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(item, columnKey)}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={isOpen}
        player={selectedPlayer}
        onClose={onClose}
        onVerify={handleVerify}
      />
    </div>
  );
}
