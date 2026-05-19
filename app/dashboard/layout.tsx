import WhatsAppButton from "./_components/WhatsAppButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <WhatsAppButton />
    </>
  );
}
