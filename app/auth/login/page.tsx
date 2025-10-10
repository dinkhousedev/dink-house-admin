"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

import { DinkHouseLogo } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Always use current origin for development flexibility
      const redirectUrl = `${window.location.origin}/auth/callback`;

      console.log("Attempting Google OAuth...");
      console.log("Redirect URL:", redirectUrl);

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      console.log("OAuth response:", { data, error: signInError });

      if (signInError) {
        setError(signInError.message || "Failed to initiate Google sign-in");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

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
          <div>
            <h1 className="text-2xl font-semibold text-dink-white">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-default-500">
              Sign in to access your employee dashboard
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button
            className="w-full bg-white text-gray-800 hover:bg-gray-100"
            isLoading={isLoading}
            radius="lg"
            size="lg"
            startContent={
              !isLoading && (
                <svg height="20" viewBox="0 0 24 24" width="20">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )
            }
            onClick={handleGoogleLogin}
          >
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>

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
                  Contact your manager to ensure your Google account is
                  authorized for access.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
