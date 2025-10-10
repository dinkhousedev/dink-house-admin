import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  PaymentStatus,
  {
    color: "warning" | "success" | "danger" | "default";
    icon: string;
    label: string;
  }
> = {
  pending: {
    color: "warning",
    icon: "solar:clock-circle-bold",
    label: "Pending",
  },
  completed: {
    color: "success",
    icon: "solar:check-circle-bold",
    label: "Paid",
  },
  failed: {
    color: "danger",
    icon: "solar:close-circle-bold",
    label: "Failed",
  },
  refunded: {
    color: "default",
    icon: "solar:refresh-circle-bold",
    label: "Refunded",
  },
};

export function PaymentStatusBadge({
  status,
  size = "sm",
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Chip
      color={config.color}
      size={size}
      startContent={<Icon icon={config.icon} width={16} />}
      variant="flat"
    >
      {config.label}
    </Chip>
  );
}
