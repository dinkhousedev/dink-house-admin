"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Icon } from "@iconify/react";
import Link from "next/link";

import { DinkHouseLogo } from "@/components/icons";

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] px-4">
      <Card className="w-full max-w-md border border-dink-gray/80 bg-[#0F0F0F]/90">
        <CardHeader className="flex-col gap-4 pb-0 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-dink-gradient text-dink-black shadow-lg shadow-dink-lime/20">
              <DinkHouseLogo size={26} />
            </div>
            <div>
              <p className="text-athletic text-lg font-semibold text-dink-lime">
                Dink House
              </p>
              <p className="text-sm text-default-500">Employee Portal</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="gap-6 px-8 pb-8 pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Icon
                className="text-success"
                icon="solar:check-circle-bold"
                width={32}
              />
            </div>
            <h1 className="text-2xl font-semibold text-dink-white">
              Account Created!
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Your employee account has been successfully created.
            </p>
          </div>

          <div className="rounded-lg border border-dink-gray bg-black/40 p-4">
            <h3 className="text-sm font-semibold text-dink-white">
              What&apos;s Next?
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-default-500">
              <li className="flex items-start gap-2">
                <Icon
                  className="mt-0.5 text-dink-lime"
                  icon="solar:check-circle-linear"
                  width={16}
                />
                <span>Your account is now active and ready to use</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon
                  className="mt-0.5 text-dink-lime"
                  icon="solar:check-circle-linear"
                  width={16}
                />
                <span>Sign in with your email and password</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon
                  className="mt-0.5 text-dink-lime"
                  icon="solar:check-circle-linear"
                  width={16}
                />
                <span>Access your employee dashboard and tools</span>
              </li>
            </ul>
          </div>

          <Button
            as={Link}
            className="w-full"
            color="primary"
            href="/auth/login"
            radius="lg"
            size="lg"
            startContent={<Icon icon="solar:login-3-linear" width={20} />}
          >
            Sign In to Your Account
          </Button>

          <div className="text-center">
            <p className="text-xs text-default-500">
              Need help? Contact your manager or{" "}
              <Link
                className="text-dink-lime hover:underline"
                href="mailto:support@dinkhouse.com"
              >
                support@dinkhouse.com
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
