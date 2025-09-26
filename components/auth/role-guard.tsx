"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

import { useAuth } from "@/context/auth-context";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAdmin?: boolean;
  requireActive?: boolean;
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles = [],
  requireAdmin = false,
  requireActive = true,
  fallbackPath = "/employee/dashboard",
  showUnauthorized = true,
}: RoleGuardProps) {
  const { employee, loading, isAdmin, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/auth/login");
    }
  }, [loading, employee, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Icon
          className="text-dink-lime animate-spin"
          icon="solar:spinner-linear"
          width={40}
        />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  // Check if employee is active
  if (requireActive && employee.status !== "active") {
    if (showUnauthorized) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-md border border-dink-gray/80 bg-[#0F0F0F]/90">
            <CardBody className="gap-4 p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/20">
                <Icon
                  className="text-warning"
                  icon="solar:clock-circle-bold"
                  width={28}
                />
              </div>
              <h2 className="text-center text-xl font-semibold text-dink-white">
                Account Pending Activation
              </h2>
              <p className="text-center text-sm text-default-500">
                Your account is currently {employee.status}. Please wait for an
                administrator to activate your account.
              </p>
              <Button
                color="primary"
                radius="lg"
                variant="flat"
                onClick={() => router.push("/employee/dashboard")}
              >
                Return to Dashboard
              </Button>
            </CardBody>
          </Card>
        </div>
      );
    }
    router.push(fallbackPath);

    return null;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    if (showUnauthorized) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-md border border-dink-gray/80 bg-[#0F0F0F]/90">
            <CardBody className="gap-4 p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/20">
                <Icon
                  className="text-danger"
                  icon="solar:shield-warning-bold"
                  width={28}
                />
              </div>
              <h2 className="text-center text-xl font-semibold text-dink-white">
                Admin Access Required
              </h2>
              <p className="text-center text-sm text-default-500">
                You need administrator privileges to access this area.
              </p>
              <Button
                color="primary"
                radius="lg"
                variant="flat"
                onClick={() => router.push(fallbackPath)}
              >
                Return to Dashboard
              </Button>
            </CardBody>
          </Card>
        </div>
      );
    }
    router.push(fallbackPath);

    return null;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    if (showUnauthorized) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-md border border-dink-gray/80 bg-[#0F0F0F]/90">
            <CardBody className="gap-4 p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/20">
                <Icon
                  className="text-danger"
                  icon="solar:user-block-bold"
                  width={28}
                />
              </div>
              <h2 className="text-center text-xl font-semibold text-dink-white">
                Unauthorized Access
              </h2>
              <p className="text-center text-sm text-default-500">
                Your role ({employee.role}) does not have permission to access
                this area.
              </p>
              <Button
                color="primary"
                radius="lg"
                variant="flat"
                onClick={() => router.push(fallbackPath)}
              >
                Return to Dashboard
              </Button>
            </CardBody>
          </Card>
        </div>
      );
    }
    router.push(fallbackPath);

    return null;
  }

  return <>{children}</>;
}
