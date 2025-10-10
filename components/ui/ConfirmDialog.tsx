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
import { Icon } from "@iconify/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

/**
 * Branded confirmation dialog for Dink House Admin
 * Replaces native window.confirm() with athletic-themed modal
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const variantConfig = {
    danger: {
      icon: "solar:danger-triangle-bold",
      iconColor: "text-danger",
      bgColor: "bg-danger/10",
      borderColor: "border-danger/30",
      buttonColor: "danger" as const,
    },
    warning: {
      icon: "solar:shield-warning-bold",
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
      buttonColor: "warning" as const,
    },
    info: {
      icon: "solar:info-circle-bold",
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      buttonColor: "primary" as const,
    },
  };

  const config = variantConfig[variant];

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
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-dink-white">{title}</h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div
              className={`flex items-center gap-3 rounded-lg p-4 ${config.bgColor} border ${config.borderColor}`}
            >
              <Icon
                className={config.iconColor}
                icon={config.icon}
                width={32}
              />
              <div className="flex-1">
                <p className="text-sm text-dink-white whitespace-pre-wrap">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            isDisabled={loading || isLoading}
            variant="flat"
            onPress={onClose}
          >
            {cancelText}
          </Button>
          <Button
            color={config.buttonColor}
            isLoading={loading || isLoading}
            onPress={handleConfirm}
          >
            {loading || isLoading ? "Processing..." : confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Hook to use ConfirmDialog with promise-based API
 * Usage:
 *   const { confirm, ConfirmDialogComponent } = useConfirmDialog();
 *   const result = await confirm({ message: "Are you sure?" });
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<
    Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">
  >({
    message: "",
  });
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm = (
    options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">,
  ): Promise<boolean> => {
    setConfig(options);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    resolvePromise?.(true);
    setIsOpen(false);
  };

  const handleClose = () => {
    resolvePromise?.(false);
    setIsOpen(false);
  };

  const ConfirmDialogComponent = (
    <ConfirmDialog
      {...config}
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, ConfirmDialogComponent };
}
