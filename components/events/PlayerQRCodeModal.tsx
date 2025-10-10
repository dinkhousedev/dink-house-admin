"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import { QRCodeSVG } from "qrcode.react";

interface PlayerQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

interface PlayerInfo {
  player_id: string;
  player_name: string;
  dupr_rating: number | null;
  email: string;
  registration_status: string;
}

export function PlayerQRCodeModal({
  isOpen,
  onClose,
  eventId,
}: PlayerQRCodeModalProps) {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlayerInfo();
    }
  }, [isOpen]);

  const fetchPlayerInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current user's player info
      const response = await fetch("/api/auth/player");
      const data = await response.json();

      if (data.success && data.player) {
        setPlayerInfo({
          player_id: data.player.id,
          player_name: `${data.player.first_name} ${data.player.last_name}`,
          dupr_rating: data.player.dupr_rating,
          email: data.player.email,
          registration_status: "registered",
        });
      } else {
        setError("Unable to load player information");
      }
    } catch (err) {
      console.error("Error fetching player info:", err);
      setError("Failed to load player information");
    } finally {
      setLoading(false);
    }
  };

  const qrData = playerInfo
    ? JSON.stringify({
        playerId: playerInfo.player_id,
        eventId: eventId,
        timestamp: Date.now(),
      })
    : "";

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-[#0F0F0F] border border-dink-gray",
        header: "border-b border-dink-gray",
        body: "py-6",
        footer: "border-t border-dink-gray",
      }}
      isOpen={isOpen}
      size="lg"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-dink-white">
            Your Check-In QR Code
          </h3>
          <p className="text-sm font-normal text-default-500">
            Show this code to staff to check in
          </p>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner color="primary" size="lg" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Icon
                className="text-danger"
                icon="solar:danger-triangle-bold"
                width={48}
              />
              <p className="text-danger">{error}</p>
              <Button color="primary" variant="flat" onPress={fetchPlayerInfo}>
                Retry
              </Button>
            </div>
          ) : playerInfo ? (
            <div className="flex flex-col items-center gap-6">
              {/* Player Info Card */}
              <Card className="w-full border border-dink-gray bg-[#151515]">
                <CardBody className="gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-dink-white">
                        {playerInfo.player_name}
                      </p>
                      <p className="text-sm text-default-500">
                        {playerInfo.email}
                      </p>
                    </div>
                    {playerInfo.dupr_rating && (
                      <Chip color="primary" size="lg" variant="flat">
                        <span className="font-mono text-sm">
                          DUPR: {playerInfo.dupr_rating.toFixed(2)}
                        </span>
                      </Chip>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      className="text-success"
                      icon="solar:check-circle-bold"
                      width={20}
                    />
                    <span className="text-sm text-success">
                      Registered for this event
                    </span>
                  </div>
                </CardBody>
              </Card>

              {/* QR Code */}
              <div className="rounded-2xl bg-white p-8 shadow-xl">
                <QRCodeSVG
                  includeMargin={false}
                  level="H"
                  size={256}
                  value={qrData}
                />
              </div>

              {/* Instructions */}
              <div className="w-full rounded-lg border border-dink-lime/20 bg-dink-lime/5 p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 shrink-0 text-dink-lime"
                    icon="solar:info-circle-bold"
                    width={24}
                  />
                  <div className="text-sm text-default-400">
                    <p className="mb-2 font-semibold text-dink-white">
                      How to check in:
                    </p>
                    <ol className="list-inside list-decimal space-y-1">
                      <li>Show this QR code to the staff</li>
                      <li>They will scan it with their device</li>
                      <li>You&apos;ll be checked in instantly</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="flat" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
