import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-mosque-dark">إعدادات الحساب</h1>
      <SettingsForm currentName={profile?.name ?? ""} email={profile?.email ?? user!.email!} />
    </div>
  );
}
