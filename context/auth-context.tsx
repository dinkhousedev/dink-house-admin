"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Employee, EmployeeProfile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  profile: EmployeeProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  canAccessAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employee: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshEmployee: async () => {},
  hasRole: () => false,
  isAdmin: () => false,
  canAccessAdmin: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchEmployeeData(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await fetchEmployeeData(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setEmployee(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchEmployeeData = async (authId: string) => {
    try {
      // Get current session to ensure we have valid auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("No valid session found");

        return;
      }

      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("account_id", authId)
        .maybeSingle();

      if (playerError) {
        console.error("Error fetching player:", playerError);

        return;
      }

      if (playerData) {
        // Map player data to employee structure for compatibility
        const mappedEmployee: Partial<Employee> = {
          id: playerData.id,
          auth_id: authId,
          email: session.user.email || "",
          first_name: playerData.first_name,
          last_name: playerData.last_name,
          role: "admin" as const, // Default role for admin access
          status: "active",
          employment_type: "full_time",
          date_of_birth: "",
          created_at: playerData.created_at || new Date().toISOString(),
          updated_at: playerData.updated_at || new Date().toISOString(),
        };

        setEmployee(mappedEmployee as Employee);

        // Note: player profiles may not exist in the same way as employee profiles
        // Skip profile fetching for now or implement player-specific profile logic
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear the session cookie first
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to clear session cookie");
      }

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setEmployee(null);
      setProfile(null);

      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshEmployee = async () => {
    if (user) {
      await fetchEmployeeData(user.id);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!employee) return false;

    return roles.includes(employee.role);
  };

  const isAdmin = () => {
    if (!employee) return false;

    return employee.role === "admin";
  };

  const canAccessAdmin = () => {
    if (!employee) return false;

    return ["admin", "manager"].includes(employee.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        profile,
        loading,
        signOut,
        refreshEmployee,
        hasRole,
        isAdmin,
        canAccessAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
