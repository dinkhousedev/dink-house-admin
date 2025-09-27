import { useState, useEffect } from "react";

import { Employee, EmployeeProfile } from "@/types/database";

interface UseEmployeeReturn {
  employee: Employee | null;
  profile: EmployeeProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateEmployee: (
    data: Partial<Employee> & { profile?: Partial<EmployeeProfile> },
  ) => Promise<boolean>;
}

export function useEmployee(): UseEmployeeReturn {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/employee");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch employee data");
      }

      setEmployee(data.employee);
      setProfile(data.profile || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setEmployee(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (
    data: Partial<Employee> & { profile?: Partial<EmployeeProfile> },
  ): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch("/api/employee", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update employee data");
      }

      // Refetch to get the latest data
      await fetchEmployee();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");

      return false;
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  return {
    employee,
    profile,
    loading,
    error,
    refetch: fetchEmployee,
    updateEmployee,
  };
}
