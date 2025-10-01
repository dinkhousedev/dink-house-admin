"use client";

import { useState, useEffect, useMemo } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/context/auth-context";

const staticMetrics = [
  {
    key: "utilization",
    label: "Court Utilization",
    value: "78%",
    delta: "+4.0%",
    caption: "14 courts live",
    icon: "solar:tennis-racket-linear",
    tone: "positive" as const,
    progress: 78,
  },
  {
    key: "revenue",
    label: "Pro Shop Revenue",
    value: "$12.4K",
    delta: "+12%",
    caption: "week-to-date",
    icon: "solar:cart-3-linear",
    tone: "positive" as const,
  },
  {
    key: "maintenance",
    label: "Maintenance Tickets",
    value: "3 open",
    delta: "-2",
    caption: "resolved today",
    icon: "solar:tools-linear",
    tone: "neutral" as const,
  },
];

const sessions = [
  {
    time: "6:00 PM",
    name: "Open Play - Level 4.0",
    court: "Courts 3 & 4",
    capacity: 24,
    booked: 18,
    coach: "Ortiz",
  },
  {
    time: "7:00 PM",
    name: "Beginner Clinic",
    court: "Training Hall",
    capacity: 12,
    booked: 12,
    coach: "Nguyen",
  },
  {
    time: "8:30 PM",
    name: "League Play - D1 Semis",
    court: "Show Court",
    capacity: 80,
    booked: 72,
    coach: "Broadcast",
  },
];

const coaches = [
  {
    name: "Lena Ortiz",
    role: "Head Coach",
    rating: "4.9",
    sessions: "3 sessions",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Marcus Nguyen",
    role: "Player Development",
    rating: "4.8",
    sessions: "2 clinics",
    image:
      "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Tara Singh",
    role: "League Commissioner",
    rating: "4.7",
    sessions: "Tonight's playoffs",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
  },
];

const tasks = [
  {
    name: "Resurface Court 2 baselines",
    detail: "Materials onsite - crew scheduled 7 AM",
    status: "Scheduled",
  },
  {
    name: "Install new swing sensors",
    detail: "Awaiting shipment confirmation",
    status: "Pending",
  },
  {
    name: "Update member onboarding drip",
    detail: "Marketing review due Friday",
    status: "In review",
  },
];

const feedback = [
  {
    member: "Alex J.",
    note: "Loved the new ladder matchmaking — keep the late slots!",
    tags: ["Programs", "Positive"],
  },
  {
    member: "Priya N.",
    note: "Requesting more weekend beginner clinics.",
    tags: ["Scheduling"],
  },
  {
    member: "Chris B.",
    note: "Scoreboards in Court 5 flickered during playoffs.",
    tags: ["Facilities", "Urgent"],
  },
];

export default function Home() {
  const { employee, loading } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [subscriberStats, setSubscriberStats] = useState<any>(null);

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

    const fetchSubscriberStats = async () => {
      try {
        const response = await fetch("/api/subscribers/count");

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            setSubscriberStats(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching subscriber stats:", error);
      }
    };

    fetchUserInfo();
    fetchSubscriberStats();
  }, []);

  const metrics = useMemo(() => {
    const subscriberMetric = {
      key: "subscribers",
      label: "Newsletter Subscribers",
      value: subscriberStats?.active?.toLocaleString() || "Loading...",
      delta: subscriberStats?.growthRate || "+0%",
      caption: "vs. last week",
      icon: "solar:letter-unread-linear",
      tone: "positive" as const,
    };

    return [subscriberMetric, ...staticMetrics];
  }, [subscriberStats]);

  return (
    <>
      <section className="hidden min-h-[calc(100vh-80px)] flex-1 gap-8 lg:flex lg:flex-row">
        <DashboardSidebar />

        <div className="flex flex-1 flex-col gap-6 2xl:gap-8">
          <header className="rounded-3xl border border-dink-gray/80 bg-[#101010]/80 p-6 shadow-[0_20px_60px_-40px_rgba(179,255,0,0.45)] 2xl:p-8">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
              <div className="space-y-2 pr-0 lg:pr-6 2xl:pr-12">
                <p className="text-athletic text-xs text-default-500">
                  Daily Snapshot
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-dink-white sm:text-4xl">
                  {userLoading
                    ? "Loading..."
                    : userInfo
                      ? `Welcome back, ${userInfo.first_name}`
                      : employee
                        ? `Welcome back, ${employee.first_name}`
                        : "Welcome back"}
                </h1>
                <p className="text-sm text-default-500 sm:text-base">
                  {userInfo && (
                    <>
                      <span className="text-dink-lime">
                        {userInfo.position || userInfo.role}
                      </span>
                      {userInfo.department && ` • ${userInfo.department}`}{" "}
                      •{" "}
                    </>
                  )}
                  Courts are <span className="text-dink-lime">78% booked</span>{" "}
                  with three sold-out clinics tonight.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  className="min-w-[160px]"
                  color="primary"
                  radius="lg"
                  variant="shadow"
                >
                  New Session
                </Button>
                <Button
                  className="min-w-[160px] border-dink-gray bg-transparent text-default-500 hover:text-dink-white"
                  radius="lg"
                  variant="bordered"
                >
                  Export Report
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
              {metrics.map((metric) => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] 2xl:gap-8">
            <Card
              className="border border-dink-gray/80 bg-[#0C0C0C]/90"
              radius="lg"
            >
              <CardHeader className="items-start justify-between gap-4">
                <div>
                  <p className="text-athletic text-xs text-default-500">
                    Tonight
                  </p>
                  <h2 className="text-xl font-semibold text-dink-white">
                    Featured Sessions
                  </h2>
                </div>
                <Chip color="primary" variant="flat">
                  Updated 4 mins ago
                </Chip>
              </CardHeader>
              <CardBody className="gap-5">
                {sessions.map((session, index) => (
                  <div
                    key={session.name}
                    className="rounded-2xl border border-dink-gray/60 bg-black/30 p-4 2xl:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                          {session.time}
                        </p>
                        <p className="text-lg font-semibold text-dink-white">
                          {session.name}
                        </p>
                        <p className="text-sm text-default-500">
                          {session.court}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <Progress
                          aria-label={`${session.name} fill`}
                          classNames={{
                            indicator: "bg-dink-lime",
                            track: "bg-[#1A1A1A]",
                          }}
                          maxValue={session.capacity}
                          minValue={0}
                          value={session.booked}
                        />
                        <p className="text-xs text-default-500">
                          {session.booked}/{session.capacity} players - Coach{" "}
                          {session.coach}
                        </p>
                      </div>
                    </div>
                    {index < sessions.length - 1 ? (
                      <Divider className="mt-4 border-dink-gray/60" />
                    ) : null}
                  </div>
                ))}
              </CardBody>
              <CardFooter className="justify-end">
                <Button radius="lg" variant="light">
                  Manage Schedule
                </Button>
              </CardFooter>
            </Card>

            <Card
              className="border border-dink-gray/80 bg-[#0C0C0C]/90"
              radius="lg"
            >
              <CardHeader className="items-start justify-between">
                <div>
                  <p className="text-athletic text-xs text-default-500">Team</p>
                  <h2 className="text-xl font-semibold text-dink-white">
                    Coach Spotlight
                  </h2>
                </div>
                <Tooltip
                  content="Coach ratings are updated nightly"
                  placement="left"
                >
                  <Icon
                    className="text-default-500"
                    icon="solar:info-circle-line-duotone"
                    width={20}
                  />
                </Tooltip>
              </CardHeader>
              <CardBody className="gap-4">
                {coaches.map((coach) => (
                  <div
                    key={coach.name}
                    className="flex items-center gap-4 rounded-2xl border border-dink-gray/60 bg-black/30 p-4"
                  >
                    <Avatar
                      isBordered
                      radius="lg"
                      size="md"
                      src={coach.image}
                    />
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-semibold text-dink-white">
                        {coach.name}
                      </p>
                      <p className="text-xs text-default-500">{coach.role}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Chip color="success" size="sm" variant="flat">
                        {coach.rating}
                      </Chip>
                      <p className="text-xs text-default-500">
                        {coach.sessions}
                      </p>
                    </div>
                  </div>
                ))}
              </CardBody>
              <CardFooter>
                <Button fullWidth color="primary" radius="lg" variant="flat">
                  Assign Coaches
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] 2xl:gap-8">
            <Card
              className="border border-dink-gray/80 bg-[#0C0C0C]/85"
              radius="lg"
            >
              <CardHeader className="items-start justify-between">
                <div>
                  <p className="text-athletic text-xs text-default-500">
                    Operations
                  </p>
                  <h2 className="text-xl font-semibold text-dink-white">
                    Priority Tasks
                  </h2>
                </div>
                <Chip color="warning" variant="flat">
                  3 in progress
                </Chip>
              </CardHeader>
              <CardBody className="gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.name}
                    className="space-y-2 rounded-2xl border border-dink-gray/60 bg-black/30 p-4 2xl:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-dink-white">
                        {task.name}
                      </p>
                      <Chip size="sm" variant="flat">
                        {task.status}
                      </Chip>
                    </div>
                    <p className="text-xs text-default-500">{task.detail}</p>
                  </div>
                ))}
              </CardBody>
              <CardFooter className="justify-end">
                <Button radius="lg" variant="light">
                  View Kanban
                </Button>
              </CardFooter>
            </Card>

            <Card
              className="border border-dink-gray/80 bg-[#0C0C0C]/85"
              radius="lg"
            >
              <CardHeader className="items-start justify-between">
                <div>
                  <p className="text-athletic text-xs text-default-500">
                    Community
                  </p>
                  <h2 className="text-xl font-semibold text-dink-white">
                    Member Feedback
                  </h2>
                </div>
                <Button color="primary" radius="lg" size="sm" variant="flat">
                  Respond
                </Button>
              </CardHeader>
              <CardBody className="gap-4">
                {feedback.map((item) => (
                  <div
                    key={item.member}
                    className="space-y-3 rounded-2xl border border-dink-gray/60 bg-black/30 p-4 2xl:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-dink-white">
                        {item.member}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <Chip key={tag} size="sm" variant="flat">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-default-400">{item.note}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      <MobileRestriction />
    </>
  );
}

type Metric = (typeof staticMetrics)[number] | {
  key: string;
  label: string;
  value: string;
  delta: string;
  caption: string;
  icon: string;
  tone: "positive" | "neutral";
  progress?: number;
};

function MetricCard({ metric }: { metric: Metric }) {
  const toneClass =
    metric.tone === "positive" ? "text-dink-lime" : "text-default-400";

  return (
    <Card
      className="border border-dink-gray/70 bg-black/40"
      radius="lg"
      shadow="lg"
    >
      <CardBody className="gap-4 2xl:gap-5 2xl:p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-2xl bg-[#141414] p-3">
            <Icon className="text-dink-lime" icon={metric.icon} width={22} />
          </div>
          <Chip color="primary" size="sm" variant="flat">
            {metric.delta}
          </Chip>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-default-500">
            {metric.label}
          </p>
          <p className="text-2xl font-semibold text-dink-white">
            {metric.value}
          </p>
          <p className={`text-xs ${toneClass}`}>{metric.caption}</p>
        </div>
        {typeof metric.progress === "number" ? (
          <Progress
            aria-label={`${metric.label} progress`}
            classNames={{
              indicator: "bg-dink-lime",
              track: "bg-[#1A1A1A]",
            }}
            value={metric.progress}
          />
        ) : null}
      </CardBody>
    </Card>
  );
}

function MobileRestriction() {
  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center px-6 text-center lg:hidden">
      <Card
        className="max-w-sm border border-dink-gray/80 bg-[#0F0F0F]/90"
        radius="lg"
        shadow="lg"
      >
        <CardBody className="gap-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-dink-gradient text-dink-black shadow-dink-lime/40">
            <Icon icon="solar:monitor-outline" width={26} />
          </div>
          <h1 className="text-2xl font-semibold text-dink-white">
            Desktop experience only
          </h1>
          <p className="text-sm text-default-500">
            The Dink House admin console is optimized for screens wider than
            1024px. Please switch to a desktop or expand your browser window to
            continue.
          </p>
        </CardBody>
      </Card>
    </section>
  );
}
