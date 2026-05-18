import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { saveProfile } from "./actions";

export default async function OnboardingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl text-ink mb-2">
            My<span className="italic text-forest">Asset</span>
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mt-4">
            Complete seu perfil
          </p>
          <p className="text-sm text-ink/60 mt-3">
            Precisamos de mais algumas informações pra personalizar sua
            experiência.
          </p>
        </div>

        <form action={saveProfile} className="space-y-5">
          <div>
            <label
              htmlFor="full_name"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              Nome completo <span className="text-forest">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              WhatsApp <span className="text-forest">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="(85) 99999-9999"
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
            <p className="text-[10px] text-ink/40 mt-2">
              Usado para alertas de aluguel, reajuste e oportunidades do
              portfólio.
            </p>
          </div>

          <div>
            <label
              htmlFor="buying_intent"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              Pretende comprar outro imóvel nos próximos 12 meses?
            </label>
            <select
              id="buying_intent"
              name="buying_intent"
              defaultValue=""
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            >
              <option value="" disabled>
                Selecione
              </option>
              <option value="yes">Sim</option>
              <option value="maybe">Talvez</option>
              <option value="no">Não por enquanto</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Continuar para o dashboard
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
