import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateProfile } from "./actions";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
            Conta
          </p>
          <h1 className="font-display text-4xl text-ink">Seu perfil</h1>
        </div>

        <form action={updateProfile} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full px-4 py-3 bg-ink/5 border border-ink/10 text-ink/50 cursor-not-allowed"
            />
            <p className="text-[10px] text-ink/40 mt-2">
              O e-mail não pode ser alterado.
            </p>
          </div>

          <div>
            <label
              htmlFor="full_name"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              Nome completo
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={profile?.full_name || ""}
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              WhatsApp
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile?.phone || ""}
              placeholder="(85) 99999-9999"
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
            <p className="text-[10px] text-ink/40 mt-2">
              Usado para alertas de aluguel e oportunidades do portfólio.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
