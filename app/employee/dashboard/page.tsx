"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Employee, EmployeeProfile } from "@/types/database";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");

        return;
      }

      const { data: employeeData } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (employeeData) {
        setEmployee(employeeData);

        const { data: profileData } = await supabase
          .from("employee_profiles")
          .select("*")
          .eq("employee_id", employeeData.id)
          .single();

        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const { signOut } = useAuth();

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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="border border-dink-gray/80 bg-[#0F0F0F]/90 p-8">
          <CardBody>
            <p className="text-default-500">No employee data found</p>
            <Button
              className="mt-4"
              color="primary"
              radius="lg"
              onClick={signOut}
            >
              Return to Login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const completionPercentage = calculateProfileCompletion(employee, profile);

  return (
    <div className="min-h-screen bg-[#000000] p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              isBordered
              classNames={{ base: "border-dink-lime" }}
              name={`${employee.first_name} ${employee.last_name}`}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-semibold text-dink-white">
                Welcome back, {employee.first_name}!
              </h1>
              <p className="text-default-500">
                {employee.position_title || employee.role}
              </p>
            </div>
          </div>
          <Button
            radius="lg"
            startContent={<Icon icon="solar:logout-2-linear" width={20} />}
            variant="light"
            onClick={signOut}
          >
            Sign Out
          </Button>
        </div>

        {/* Status Banner */}
        <Card className="mb-6 border border-dink-gray/80 bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A]">
          <CardBody className="flex flex-row items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Icon
                className={
                  employee.status === "active"
                    ? "text-dink-lime"
                    : "text-warning"
                }
                icon={
                  employee.status === "active"
                    ? "solar:check-circle-bold"
                    : "solar:clock-circle-bold"
                }
                width={32}
              />
              <div>
                <p className="text-sm text-default-500">Account Status</p>
                <p className="text-lg font-semibold text-dink-white">
                  {employee.status === "active"
                    ? "Active Employee"
                    : "Pending Approval"}
                </p>
              </div>
            </div>
            <Chip
              color={employee.status === "active" ? "success" : "warning"}
              variant="flat"
            >
              {employee.status.toUpperCase()}
            </Chip>
          </CardBody>
        </Card>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Completion */}
          <Card className="border border-dink-gray/80 bg-[#0F0F0F]/90">
            <CardHeader>
              <h2 className="text-lg font-semibold text-dink-white">
                Profile Completion
              </h2>
            </CardHeader>
            <CardBody className="gap-4">
              <Progress
                aria-label="Profile completion"
                classNames={{
                  indicator: "bg-dink-lime",
                  track: "bg-[#1A1A1A]",
                }}
                value={completionPercentage}
              />
              <p className="text-sm text-default-500">
                {completionPercentage}% Complete
              </p>
              <Button
                as="a"
                className="w-full"
                color="primary"
                href="/employee/profile"
                radius="lg"
                variant="flat"
              >
                Complete Profile
              </Button>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-dink-gray/80 bg-[#0F0F0F]/90">
            <CardHeader>
              <h2 className="text-lg font-semibold text-dink-white">
                Quick Actions
              </h2>
            </CardHeader>
            <CardBody className="gap-3">
              <Button
                className="justify-start border-dink-gray"
                radius="lg"
                startContent={
                  <Icon icon="solar:document-text-linear" width={20} />
                }
                variant="bordered"
              >
                View Pay Stubs
              </Button>
              <Button
                className="justify-start border-dink-gray"
                radius="lg"
                startContent={<Icon icon="solar:calendar-linear" width={20} />}
                variant="bordered"
              >
                View Schedule
              </Button>
              <Button
                className="justify-start border-dink-gray"
                radius="lg"
                startContent={
                  <Icon icon="solar:folder-with-files-linear" width={20} />
                }
                variant="bordered"
              >
                Upload Documents
              </Button>
            </CardBody>
          </Card>

          {/* Employment Details */}
          <Card className="border border-dink-gray/80 bg-[#0F0F0F]/90">
            <CardHeader>
              <h2 className="text-lg font-semibold text-dink-white">
                Employment Details
              </h2>
            </CardHeader>
            <CardBody className="gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-default-500">Employee ID</span>
                <span className="text-sm font-medium text-dink-white">
                  {employee.employee_id || "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-default-500">Department</span>
                <span className="text-sm font-medium text-dink-white">
                  {employee.department || "Not assigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-default-500">Type</span>
                <Chip size="sm" variant="flat">
                  {employee.employment_type.replace("_", " ").toUpperCase()}
                </Chip>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-default-500">Start Date</span>
                <span className="text-sm font-medium text-dink-white">
                  {employee.hire_date
                    ? new Date(employee.hire_date).toLocaleDateString()
                    : "TBD"}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Documents Section */}
        <Card className="mt-6 border border-dink-gray/80 bg-[#0F0F0F]/90">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dink-white">
              Required Documents
            </h2>
            <Button
              color="primary"
              radius="lg"
              size="sm"
              startContent={<Icon icon="solar:upload-linear" width={18} />}
              variant="flat"
            >
              Upload Document
            </Button>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: "I-9 Form",
                  status: "pending",
                  icon: "solar:document-text-linear",
                },
                {
                  name: "W-4 Form",
                  status: "pending",
                  icon: "solar:document-text-linear",
                },
                {
                  name: "Direct Deposit",
                  status: "pending",
                  icon: "solar:card-linear",
                },
                {
                  name: "ID Verification",
                  status: "pending",
                  icon: "solar:user-id-linear",
                },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-3 rounded-lg border border-dink-gray/60 bg-black/30 p-3"
                >
                  <Icon
                    className="text-default-400"
                    icon={doc.icon}
                    width={24}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-dink-white">
                      {doc.name}
                    </p>
                    <p className="text-xs text-default-500">
                      {doc.status === "pending" ? "Required" : "Uploaded"}
                    </p>
                  </div>
                  {doc.status === "pending" ? (
                    <Icon
                      className="text-warning"
                      icon="solar:clock-circle-linear"
                      width={20}
                    />
                  ) : (
                    <Icon
                      className="text-success"
                      icon="solar:check-circle-linear"
                      width={20}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6 border border-dink-gray/80 bg-[#0F0F0F]/90">
          <CardHeader>
            <h2 className="text-lg font-semibold text-dink-white">
              Contact Information
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-default-500">Email</p>
                <p className="text-sm font-medium text-dink-white">
                  {employee.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">Phone</p>
                <p className="text-sm font-medium text-dink-white">
                  {employee.phone || "Not provided"}
                </p>
              </div>
              {profile && (
                <>
                  <div>
                    <p className="text-sm text-default-500">Address</p>
                    <p className="text-sm font-medium text-dink-white">
                      {profile.street_address ? (
                        <>
                          {profile.street_address} {profile.apartment_unit}
                          <br />
                          {profile.city}, {profile.state} {profile.zip_code}
                        </>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">
                      Emergency Contact
                    </p>
                    <p className="text-sm font-medium text-dink-white">
                      {profile.emergency_contact_name || "Not provided"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function calculateProfileCompletion(
  employee: Employee,
  profile: EmployeeProfile | null,
): number {
  let completed = 0;
  let total = 10;

  // Basic employee fields
  if (employee.first_name) completed++;
  if (employee.last_name) completed++;
  if (employee.email) completed++;
  if (employee.phone) completed++;
  if (employee.date_of_birth) completed++;

  // Profile fields
  if (profile) {
    if (profile.street_address) completed++;
    if (profile.city && profile.state && profile.zip_code) completed++;
    if (profile.emergency_contact_name) completed++;
    if (profile.emergency_contact_phone) completed++;
    if (profile.emergency_contact_relationship) completed++;
  }

  return Math.round((completed / total) * 100);
}
