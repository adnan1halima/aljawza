import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Sidebar, { SidebarDesktop } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header teacherName={profile?.name ?? "المعلم"} />
      <div className="max-w-5xl mx-auto flex gap-6 px-4 py-6">
        <SidebarDesktop />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Sidebar />
    </div>
  );
}
