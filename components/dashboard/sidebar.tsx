"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spacer } from "@heroui/spacer";
import { Icon } from "@iconify/react";
import clsx from "clsx";

import { useAuth } from "@/context/auth-context";
import { DinkHouseLogo } from "@/components/icons";

type NavItem = {
  key: string;
  label: string;
  icon: string;
  href?: string;
  badge?: string;
  badgeTone?: "default" | "success" | "warning";
};

type NavSection = {
  key: string;
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    key: "operations",
    title: "Operations",
    items: [
      {
        key: "overview",
        label: "Court Overview",
        icon: "solar:home-2-linear",
        href: "/dashboard/court_overview",
      },
      {
        key: "bookings",
        label: "Session Bookings",
        icon: "solar:calendar-linear",
        href: "/dashboard/session_booking",
      },
      {
        key: "open-play",
        label: "Open Play Playground",
        icon: "solar:calendar-bold",
        href: "/dashboard/open-play-playground",
      },
      {
        key: "live-events",
        label: "Live Events",
        icon: "solar:qr-scan-bold",
        href: "/admin/operations/live-events",
      },
    ],
  },
  // {
  //   key: "point-of-sale",
  //   title: "Point-of-Sale",
  //   items: [
  //     { key: "merchandise", label: "Merchandise", icon: "solar:t-shirt-bold" },
  //     { key: "rentals", label: "Rentals", icon: "solar:tennis-outline" },
  //     { key: "open-play", label: "Open Play", icon: "solar:cart-3-linear" },
  //   ],
  // },
  // {
  //   key: "employees",
  //   title: "Employee Management",
  //   items: [
  //     {
  //       key: "employee-dashboard",
  //       label: "My Dashboard",
  //       icon: "solar:user-bold-duotone",
  //     },
  //     {
  //       key: "employee-roster",
  //       label: "Employee Roster",
  //       icon: "solar:users-group-two-rounded-outline",
  //     },
  //     { key: "payroll", label: "Payroll", icon: "solar:wallet-linear" },
  //     {
  //       key: "documents",
  //       label: "Documents",
  //       icon: "solar:folder-with-files-linear",
  //     },
  //     {
  //       key: "onboarding",
  //       label: "Onboarding",
  //       icon: "solar:user-plus-linear",
  //       badge: "3",
  //     },
  //   ],
  // },
  // {
  //   key: "performance",
  //   title: "Performance",
  //   items: [
  //     { key: "coaching", label: "Coaching", icon: "solar:user-speak-linear" },
  //     {
  //       key: "leagues",
  //       label: "League Play",
  //       icon: "solar:trophy-linear",
  //       badge: "Live",
  //       badgeTone: "success",
  //     },
  //     { key: "events", label: "Events", icon: "solar:star-fall-linear" },
  //     { key: "analytics", label: "Analytics", icon: "solar:chart-outline" },
  //   ],
  // },
  // {
  //   key: "Security Cameras",
  //   title: "Security Cameras",
  //   items: [
  //     { key: "overview", label: "Overview", icon: "solar:home-2-linear" },
  //     {
  //       key: "recordings",
  //       label: "Recordings",
  //       icon: "solar:videocamera-record-bold",
  //     },
  //     { key: "alarms", label: "Alarms", icon: "solar:alarm-bold" },
  //     { key: "motion", label: "Motion", icon: "solar:running-bold-duotone" },
  //     { key: "events", label: "Events", icon: "solar:shield-warning-bold" },
  //     { key: "settings", label: "Settings", icon: "solar:settings-bold" },
  //   ],
  // },
  {
    key: "crowdfunding",
    title: "Crowdfunding",
    items: [
      {
        key: "contributors",
        label: "Contributors",
        icon: "solar:users-group-rounded-bold",
        href: "/dashboard/crowdfunding/contributors",
      },
      {
        key: "benefits",
        label: "Benefits",
        icon: "solar:gift-bold",
        href: "/dashboard/crowdfunding/benefits",
      },
      {
        key: "recognition",
        label: "Recognition Items",
        icon: "solar:medal-star-bold",
        href: "/dashboard/crowdfunding/recognition",
      },
    ],
  },
  {
    key: "marketing",
    title: "Marketing",
    items: [
      {
        key: "subscribers",
        label: "Subscribers",
        icon: "solar:letter-unread-linear",
        href: "/dashboard/marketing",
      },
      {
        key: "email-campaigns",
        label: "Email Campaigns",
        icon: "solar:station-minimalistic-outline",
        href: "/dashboard/marketing/email-campaigns",
      },
    ],
  },
  {
    key: "community",
    title: "Community",
    items: [
      {
        key: "members",
        label: "Members",
        icon: "solar:users-group-rounded-outline",
        href: "/admin/community/members",
      },
      {
        key: "feedback",
        label: "Feedback",
        icon: "solar:chat-dots-line-duotone",
        badge: "5",
      },
    ],
  },
];

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeKey, setActiveKey] = useState<string>(
    navSections[0]?.items[0]?.key ?? "overview",
  );
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const { employee, signOut, loading } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("dink-collapsed-sections");

    if (saved) {
      setCollapsedSections(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setUserLoading(true);
        const response = await fetch("/api/auth/user");

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            setUserInfo(data.user);
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    // Set active key based on current pathname
    for (const section of navSections) {
      for (const item of section.items) {
        if (item.href === pathname) {
          setActiveKey(item.key);

          return;
        }
      }
    }
  }, [pathname]);

  const toggleSection = (sectionKey: string) => {
    const newCollapsed = new Set(collapsedSections);

    if (newCollapsed.has(sectionKey)) {
      newCollapsed.delete(sectionKey);
    } else {
      newCollapsed.add(sectionKey);
    }
    setCollapsedSections(newCollapsed);
    localStorage.setItem(
      "dink-collapsed-sections",
      JSON.stringify(Array.from(newCollapsed)),
    );
  };

  return (
    <aside className="hidden min-w-[320px] max-w-[360px] flex-col rounded-3xl border border-dink-gray bg-[#0F0F0F]/90 p-6 text-sm backdrop-blur-xl xl:p-7 2xl:p-8 lg:flex">
      <button
        className="flex items-center gap-3 px-1 transition-opacity hover:opacity-80"
        onClick={() => router.push("/")}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-dink-gradient text-dink-black shadow-lg shadow-dink-lime/20">
          <DinkHouseLogo size={22} />
        </div>
        <div className="text-left">
          <p className="text-athletic text-sm text-dink-lime">Dink House</p>
          <p className="text-xs text-default-500">Admin Console</p>
        </div>
      </button>

      <Spacer y={6} />

      <div className="flex items-center gap-3 rounded-2xl border border-dink-gray bg-black/40 px-3 py-3">
        <Avatar
          isBordered
          classNames={{
            base: "border-dink-lime",
          }}
          name={
            userInfo
              ? `${userInfo.first_name} ${userInfo.last_name}`
              : !loading && employee
                ? `${employee.first_name} ${employee.last_name}`
                : "User"
          }
          size="sm"
        />
        <div className="flex flex-col">
          <p className="text-sm font-medium text-dink-white">
            {userLoading
              ? "Loading..."
              : userInfo
                ? `${userInfo.first_name} ${userInfo.last_name}`
                : employee
                  ? `${employee.first_name} ${employee.last_name}`
                  : "User"}
          </p>
          <p className="text-xs text-default-500">
            {userLoading
              ? "..."
              : userInfo?.position ||
                userInfo?.department ||
                employee?.position_title ||
                employee?.role ||
                "Employee"}
          </p>
        </div>
      </div>

      <Spacer y={5} />

      <Input
        aria-label="Search dashboard"
        classNames={{
          input: "text-sm",
          inputWrapper: "bg-[#151515] border border-dink-gray",
        }}
        endContent={<KbdIcon />}
        placeholder="Search modules"
        startContent={
          <Icon
            className="text-default-500"
            icon="solar:magnifer-linear"
            width={20}
          />
        }
        variant="bordered"
      />

      <ScrollShadow className="-mx-1 mt-6 flex-1 px-1">
        <nav className="flex flex-col gap-8">
          {navSections.map((section) => {
            const isCollapsed = collapsedSections.has(section.key);

            return (
              <div key={section.key}>
                <button
                  className="group flex w-full items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-default-500 transition-colors hover:text-dink-lime"
                  onClick={() => toggleSection(section.key)}
                >
                  <span>{section.title}</span>
                  <Icon
                    className={clsx(
                      "transition-transform duration-200",
                      isCollapsed ? "-rotate-90" : "rotate-0",
                    )}
                    icon="solar:alt-arrow-down-linear"
                    width={16}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="mt-4 flex flex-col gap-2">
                        {section.items.map((item) => {
                          const isActive = activeKey === item.key;

                          return (
                            <Button
                              key={item.key}
                              className={clsx(
                                "w-full justify-between gap-3 px-4 py-3 text-left text-sm transition-all",
                                isActive
                                  ? "bg-dink-lime text-dink-black shadow-lg shadow-dink-lime/30"
                                  : "bg-transparent text-default-500 hover:bg-[#1C1C1C]",
                              )}
                              color={isActive ? "primary" : "default"}
                              radius="lg"
                              startContent={
                                <Icon
                                  className={clsx(
                                    "transition-colors",
                                    isActive
                                      ? "text-dink-black"
                                      : "text-default-500",
                                  )}
                                  icon={item.icon}
                                  width={22}
                                />
                              }
                              variant={isActive ? "solid" : "light"}
                              onPress={() => {
                                setActiveKey(item.key);
                                if (item.href) {
                                  router.push(item.href);
                                }
                              }}
                            >
                              <span className="flex-1 text-left font-medium">
                                {item.label}
                              </span>
                              {item.badge ? (
                                <Chip
                                  color={
                                    item.badgeTone === "success"
                                      ? "success"
                                      : "default"
                                  }
                                  size="sm"
                                  variant={
                                    item.badgeTone === "success"
                                      ? "solid"
                                      : "flat"
                                  }
                                >
                                  {item.badge}
                                </Chip>
                              ) : null}
                            </Button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <Card
          className="mt-8 border border-dink-gray/80 bg-gradient-to-b from-[#111] to-[#050505]"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-3">
            <Chip color="success" size="sm" variant="flat">
              Growth Tip
            </Chip>
            <h3 className="text-lg font-semibold text-dink-white">
              Launch the fall club challenge
            </h3>
            <p className="text-sm text-default-500">
              Engage teams in a bracket-style tournament and showcase match
              stats in real time.
            </p>
          </CardBody>
          <CardFooter>
            <Button
              className="w-full"
              color="primary"
              radius="lg"
              variant="shadow"
            >
              Build Campaign
            </Button>
          </CardFooter>
        </Card>
      </ScrollShadow>

      <Spacer y={6} />

      <div className="mt-auto flex flex-col gap-2">
        <Button
          className="justify-start text-default-500 hover:text-dink-white"
          startContent={
            <Icon
              className="text-default-500"
              icon="solar:info-circle-line-duotone"
              width={22}
            />
          }
          variant="light"
        >
          Help Center
        </Button>
        <Button
          className="justify-start text-default-500 hover:text-dink-white"
          startContent={
            <Icon
              className="rotate-180 text-default-500"
              icon="solar:logout-2-linear"
              width={22}
            />
          }
          variant="light"
          onPress={signOut}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

function KbdIcon() {
  return (
    <span className="hidden items-center gap-1 rounded-md border border-dink-gray px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-default-500 md:inline-flex">
      CMD + K
    </span>
  );
}
