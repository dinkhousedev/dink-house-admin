import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-screen gap-8 p-6 lg:p-8">
      <DashboardSidebar />
      <div className="flex-1 max-w-[1600px]">{children}</div>
    </section>
  );
}
