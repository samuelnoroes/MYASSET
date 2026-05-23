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
    <main className="min-h-screen bg-header flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl italic text-white">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mt-3">
            Complete seu perfil
          </p>
        </div>
        <div className="bg-card rounded-card shadow-card-md p-8">
          <p className="text-sm text-ink-2 mb-6">
            Precisamos de mais algumas informações para personalizar sua
            experiência e enviar alertas importantes.
          </p>
          <form action={saveProfile} className="space-y-5">
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Nome completo <span className="text-forest">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                WhatsApp <span className="text-forest">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="(85) 99999-9999"
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              />
              <p className="text-xs text-ink-3 mt-1">
                Para alertas de aluguel e oportunidades do portfólio.
              </p>
            </div>
            <div>
              <label
                htmlFor="buying_intent"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Pretende comprar outro imóvel nos próximos 12 meses?
              </label>
              <select
                id="buying_intent"
                name="buying_intent"
                defaultValue=""
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              >
                <option value="" disabled>Selecione</option>
                <option value="yes">Sim</option>
                <option value="maybe">Talvez</option>
                <option value="no">Não por enquanto</option>
              </select>
            </div>

            {/* Aceite dos Termos */}
            <div className="border border-border rounded p-4 bg-surface">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  required
                  className="mt-0.5 h-4 w-4 accent-forest flex-shrink-0"
                />
                <span className="text-xs text-ink-2 leading-relaxed">
                  Li e concordo com os{" "}
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-forest font-semibold underline hover:opacity-80"
                  >
                    Termos de Uso, Política de Privacidade e Termo de Adesão
                  </a>{" "}
                  do MyAsset.
                </span>
              </label>
              <p className="text-xs text-ink-3 mt-2 pl-7">
                Seus dados são protegidos conforme a LGPD (Lei 13.709/2018).
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded mt-2"
            >
              Continuar para o dashboard
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
