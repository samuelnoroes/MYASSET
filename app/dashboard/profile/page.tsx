import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BrandMark from "../_components/BrandMark";
import ProfileForm from "./_components/ProfileForm";
import { createAgencyAction, joinAgencyAction } from "./agencyActions";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, creci, agency_name, agency_id, agency_role")
    .eq("id", user.id)
    .single();

  const { data: agency } = profile?.agency_id
    ? await supabase
        .from("agencies")
        .select("name, invite_code")
        .eq("id", profile.agency_id)
        .single()
    : { data: null };

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-ink ">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandMark agencyName={profile?.agency_name} />
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

        {/* ── IMOBILIÁRIA ─────────────────────────────── */}
        <div className="card mt-6">
          <h2 className="text-xl font-bold text-ink mb-2">Imobiliária</h2>

          {profile?.agency_id && agency ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-2">
                Você está vinculado à <strong className="text-ink">{agency.name}</strong> como{" "}
                <span className={`font-bold ${profile.agency_role === "gestor" ? "text-forest" : "text-ink"}`}>
                  {profile.agency_role === "gestor" ? "Gestor" : "Corretor"}
                </span>.
              </p>
              {profile.agency_role === "gestor" && (
                <>
                  <div className="bg-surface border border-border rounded p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-2 mb-1">
                      Código de convite da equipe
                    </p>
                    <p className="font-mono text-2xl font-bold text-forest tracking-[0.3em]">{agency.invite_code}</p>
                    <p className="text-xs text-ink-3 mt-2">
                      Passe este código para os corretores — eles informam no cadastro (ou aqui no Perfil) e entram na sua imobiliária.
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    className="inline-block px-6 py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors"
                  >
                    Abrir console do gestor →
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form action={joinAgencyAction} className="space-y-3 border border-border rounded p-5 bg-surface">
                <p className="text-sm font-bold text-ink">Entrar em uma imobiliária</p>
                <p className="text-xs text-ink-3">Peça o código de convite ao gestor da sua imobiliária.</p>
                <input
                  name="invite_code"
                  type="text"
                  required
                  placeholder="Ex: 3FA9B2"
                  className="w-full px-4 py-3 bg-card border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm uppercase font-mono tracking-widest"
                />
                <button type="submit" className="w-full py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">
                  Entrar com código
                </button>
              </form>

              <form action={createAgencyAction} className="space-y-3 border border-border rounded p-5 bg-surface">
                <p className="text-sm font-bold text-ink">Criar minha imobiliária</p>
                <p className="text-xs text-ink-3">Você vira o gestor: define a meta geral e gerencia os corretores.</p>
                <input
                  name="agency_name"
                  type="text"
                  required
                  placeholder="Nome da imobiliária"
                  className="w-full px-4 py-3 bg-card border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                />
                <button type="submit" className="w-full py-3 bg-header border border-border text-white text-xs font-bold uppercase tracking-wider rounded hover:opacity-85 transition-opacity">
                  Criar imobiliária
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
