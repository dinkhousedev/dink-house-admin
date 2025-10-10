"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Html5Qrcode } from "html5-qrcode";

interface QRCodeScannerProps {
  onScan: (playerId: string) => void;
  eventId: string;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

export function QRCodeScanner({
  onScan,
  eventId,
  isScanning,
  setIsScanning,
}: QRCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors, they're frequent during scanning
          // console.log("Scan error:", errorMessage);
        },
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Failed to start camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  };

  const handleScan = (decodedText: string) => {
    // Prevent duplicate scans within 2 seconds
    if (lastScan === decodedText) {
      return;
    }

    setLastScan(decodedText);
    setTimeout(() => setLastScan(null), 2000);

    try {
      const data = JSON.parse(decodedText);

      if (data.playerId && data.eventId === eventId) {
        onScan(data.playerId);
      } else if (data.playerId && data.eventId !== eventId) {
        setError("QR code is for a different event");
      } else {
        setError("Invalid QR code format");
      }
    } catch (err) {
      console.error("Error parsing QR code:", err);
      setError("Invalid QR code");
    }
  };

  return (
    <Card className="border border-dink-gray bg-[#151515]">
      <CardBody className="gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              className="text-dink-lime"
              icon="solar:qr-scan-bold"
              width={32}
            />
            <div>
              <h3 className="font-semibold text-dink-white">QR Code Scanner</h3>
              <p className="text-sm text-default-500">
                Scan player QR codes to check them in
              </p>
            </div>
          </div>
          <Button
            className={
              isScanning
                ? "bg-danger text-white"
                : "bg-dink-lime text-dink-black"
            }
            startContent={
              <Icon
                icon={
                  isScanning ? "solar:stop-bold" : "solar:camera-bold-duotone"
                }
                width={20}
              />
            }
            onPress={isScanning ? stopScanning : startScanning}
          >
            {isScanning ? "Stop Scanning" : "Start Scanner"}
          </Button>
        </div>

        {/* Scanner Preview */}
        <div
          className={`relative overflow-hidden rounded-xl ${
            isScanning ? "bg-black" : "bg-[#0F0F0F]"
          }`}
        >
          {!isScanning && (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
              <Icon
                className="text-default-300"
                icon="solar:camera-minimalistic-outline"
                width={64}
              />
              <p className="text-default-500">
                Camera preview will appear here
              </p>
            </div>
          )}
          <div
            className={isScanning ? "h-[400px] w-full" : "hidden"}
            id="qr-reader"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4">
            <Icon className="text-danger" icon="solar:danger-bold" width={24} />
            <p className="text-sm text-danger">{error}</p>
            <Button
              className="ml-auto"
              color="danger"
              size="sm"
              variant="flat"
              onPress={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!isScanning && (
          <div className="rounded-lg border border-dink-lime/20 bg-dink-lime/5 p-4">
            <div className="flex items-start gap-3">
              <Icon
                className="mt-0.5 shrink-0 text-dink-lime"
                icon="solar:info-circle-bold"
                width={20}
              />
              <div className="text-sm text-default-400">
                <p className="mb-2 font-semibold text-dink-white">
                  How to scan:
                </p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>
                    Click &quot;Start Scanner&quot; to activate the camera
                  </li>
                  <li>Position the player&apos;s QR code in the camera view</li>
                  <li>
                    The system will automatically detect and check in the player
                  </li>
                  <li>
                    You&apos;ll see confirmation when check-in is successful
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
