import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </h1>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
            Bem-vindo
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-4">
            Seu portfólio
          </h2>
          <p className="text-ink/60">{user.email}</p>
        </div>

        <div className="border border-dashed border-ink/15 p-12 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
            Em breve
          </p>
          <p className="font-display text-2xl text-ink/70 mb-3">
            Cadastre seu primeiro imóvel
          </p>
          <p className="text-sm text-ink/50 max-w-md mx-auto">
            No próximo sprint você poderá adicionar imóveis e começar a
            acompanhar yield, ROI e fluxo de caixa.
          </p>
        </div>
      </div>
    </main>
  );
}
