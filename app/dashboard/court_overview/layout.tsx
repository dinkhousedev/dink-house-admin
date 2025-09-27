import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Court Overview | Dink House Admin",
  description: "View and manage court bookings and availability",
};

export default function CourtOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
