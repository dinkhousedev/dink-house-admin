export default function SessionBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[1920px]">{children}</div>
    </div>
  );
}
