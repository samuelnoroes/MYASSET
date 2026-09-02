import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileForm from "./_components/ProfileForm";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, creci, agency_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white ">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#C4A96B" }}>Asset</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="section-title">Conta</p>

        <div className="card">
          <h1 className="text-xl font-bold text-ink mb-6">Seu perfil</h1>
          <ProfileForm
            email={user.email || ""}
            defaultFullName={profile?.full_name || ""}
            defaultPhone={profile?.phone || ""}
            defaultCreci={profile?.creci || ""}
            defaultAgencyName={profile?.agency_name || ""}
          />
        </div>
      </div>
    </main>
  );
}
