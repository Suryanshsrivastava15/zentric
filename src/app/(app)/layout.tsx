import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6EFE5]">
      <Sidebar />
      <main className="zentric-light-main flex-1 overflow-y-auto md:ml-64">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
