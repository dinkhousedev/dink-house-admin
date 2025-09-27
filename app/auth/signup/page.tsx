"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { Link } from "@heroui/link";

import { EmployeeRole } from "@/types/database";
import { DinkHouseLogo } from "@/components/icons";

const employeeRoles: {
  value: EmployeeRole;
  label: string;
  description: string;
}[] = [
  {
    value: "manager",
    label: "Manager",
    description: "Oversee facility operations and staff",
  },
  {
    value: "coach",
    label: "Coach",
    description: "Lead pickleball sessions and provide training",
  },
  {
    value: "admin",
    label: "Administrative Staff",
    description: "Handle administrative and operational tasks",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    role: EmployeeRole;
  }>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "coach",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Check if email is allowed in the database
    try {
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const checkData = await checkResponse.json();

      if (!checkData.allowed) {
        setError(
          checkData.message ||
            "This email is not authorized to sign up. Please contact your administrator.",
        );
        setIsLoading(false);

        return;
      }

      // Pre-fill name and role if available from database
      if (checkData.firstName || checkData.lastName) {
        setFormData((prev) => ({
          ...prev,
          firstName: checkData.firstName || prev.firstName,
          lastName: checkData.lastName || prev.lastName,
          role: checkData.role || prev.role,
        }));
      }
    } catch (error) {
      setError("Failed to verify email authorization");
      setIsLoading(false);

      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);

      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);

      return;
    }

    try {
      // Call our custom signup API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");

        return;
      }

      if (data.success) {
        // Store user data in localStorage for client access
        localStorage.setItem("user", JSON.stringify(data.user));

        router.push("/auth/signup/success");
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] px-4 py-8">
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
              <p className="text-sm text-default-500">Employee Registration</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="gap-6 px-8 pb-8 pt-6">
          <div>
            <h1 className="text-2xl font-semibold text-dink-white">
              Create Account
            </h1>
            <p className="mt-1 text-sm text-default-500">
              Sign up for your employee account
            </p>
          </div>

          {/* Allowed Users Notice */}
          <div className="rounded-lg border border-dink-lime/20 bg-dink-lime/5 p-3">
            <div className="flex gap-2">
              <Icon
                className="mt-0.5 text-dink-lime"
                icon="solar:lock-keyhole-minimalistic-bold"
                width={18}
              />
              <div className="text-xs text-default-500">
                <p className="font-semibold text-dink-lime">Limited Access</p>
                <p className="mt-1">
                  Only pre-authorized email addresses can sign up. Contact your
                  administrator if you need access.
                </p>
              </div>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                required
                classNames={{
                  inputWrapper: "bg-[#151515] border border-dink-gray",
                }}
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
              <Input
                required
                classNames={{
                  inputWrapper: "bg-[#151515] border border-dink-gray",
                }}
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>

            <Input
              required
              classNames={{
                inputWrapper: "bg-[#151515] border border-dink-gray",
              }}
              label="Email Address"
              placeholder="you@dinkhouse.com"
              startContent={
                <Icon
                  className="text-default-400"
                  icon="solar:letter-linear"
                  width={20}
                />
              }
              type="email"
              value={formData.email}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <Select
              classNames={{ trigger: "bg-[#151515] border border-dink-gray" }}
              description="Your role determines your access level"
              label="Employee Role"
              placeholder="Select your role"
              selectedKeys={[formData.role]}
              variant="bordered"
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  role: Array.from(keys)[0] as EmployeeRole,
                })
              }
            >
              {employeeRoles.map((role) => (
                <SelectItem key={role.value} description={role.description}>
                  {role.label}
                </SelectItem>
              ))}
            </Select>

            <Input
              required
              classNames={{
                inputWrapper: "bg-[#151515] border border-dink-gray",
              }}
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
              placeholder="Create a strong password"
              startContent={
                <Icon
                  className="text-default-400"
                  icon="solar:lock-password-linear"
                  width={20}
                />
              }
              type={showPassword ? "text" : "password"}
              value={formData.password}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />

            <Input
              required
              classNames={{
                inputWrapper: "bg-[#151515] border border-dink-gray",
              }}
              label="Confirm Password"
              placeholder="Re-enter your password"
              startContent={
                <Icon
                  className="text-default-400"
                  icon="solar:lock-password-linear"
                  width={20}
                />
              }
              type="password"
              value={formData.confirmPassword}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />

            {error && (
              <div className="rounded-lg bg-danger-50/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              color="primary"
              isLoading={isLoading}
              radius="lg"
              size="lg"
              type="submit"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dink-gray" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0F0F0F] px-4 text-default-500">
                Already have an account?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              className="text-sm text-dink-lime hover:underline"
              href="/auth/login"
            >
              Sign in to your account
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
