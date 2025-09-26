"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to log in");

        return;
      }

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on role
        if (data.user.role === "admin" || data.user.role === "manager") {
          router.push("/");
        } else {
          router.push("/employee/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] px-4">
      <Card className="w-full max-w-md border border-dink-gray/80 bg-[#0F0F0F]/90">
        <CardHeader className="flex-col gap-4 pb-0 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-dink-gradient text-dink-black shadow-lg shadow-dink-lime/20">
              <Icon icon="game-icons:tennis-ball" width={26} />
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
          <div>
            <h1 className="text-2xl font-semibold text-dink-white">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-default-500">
              Sign in to access your employee dashboard
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <Input
              required
              classNames={{
                inputWrapper: "bg-[#151515] border border-dink-gray",
              }}
              disabled={isLoading}
              label="Email"
              placeholder="you@dinkhouse.com"
              startContent={
                <Icon
                  className="text-default-400"
                  icon="solar:letter-linear"
                  width={20}
                />
              }
              type="email"
              value={email}
              variant="bordered"
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              required
              classNames={{
                inputWrapper: "bg-[#151515] border border-dink-gray",
              }}
              disabled={isLoading}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    className="text-default-400 transition-opacity hover:opacity-70"
                    icon={
                      showPassword
                        ? "solar:eye-closed-linear"
                        : "solar:eye-linear"
                    }
                    width={20}
                  />
                </button>
              }
              label="Password"
              placeholder="Enter your password"
              startContent={
                <Icon
                  className="text-default-400"
                  icon="solar:lock-password-linear"
                  width={20}
                />
              }
              type={showPassword ? "text" : "password"}
              value={password}
              variant="bordered"
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-lg bg-danger-50/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link
                className="text-sm text-default-500 hover:text-dink-lime"
                href="/auth/forgot-password"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              className="w-full"
              color="primary"
              isLoading={isLoading}
              radius="lg"
              size="lg"
              startContent={
                !isLoading && <Icon icon="solar:login-3-linear" width={20} />
              }
              type="submit"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dink-gray" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0F0F0F] px-4 text-default-500">
                New employee?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              className="text-sm text-dink-lime hover:underline"
              href="/auth/signup"
            >
              Create your employee account
            </Link>
          </div>

          <div className="mt-4 rounded-lg border border-warning-500/20 bg-warning-50/5 p-4">
            <div className="flex gap-3">
              <Icon
                className="text-warning-500"
                icon="solar:info-circle-bold"
                width={20}
              />
              <div className="text-xs text-default-500">
                <p className="font-semibold">First time signing in?</p>
                <p className="mt-1">
                  Contact your manager for account creation instructions and
                  your temporary password.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
