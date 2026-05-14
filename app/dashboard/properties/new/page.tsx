import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createProperty } from "../actions";
import PropertyFormFields from "../_components/PropertyFormFields";

export default async function NewPropertyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </Link>
          <Link
            href="/dashboard/properties"
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
            Novo imóvel
          </p>
          <h1 className="font-display text-4xl text-ink">Cadastre um ativo</h1>
          <p className="text-sm text-ink/60 mt-3">
            Selecione a modalidade correta pra ver os campos relevantes.
          </p>
        </div>

        <form action={createProperty} className="space-y-10">
          <PropertyFormFields />

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Cadastrar imóvel
            </button>
            <Link
              href="/dashboard/properties"
              className="w-full py-4 bg-transparent border border-ink/20 text-ink font-medium tracking-wider uppercase text-xs hover:border-forest hover:text-forest transition-colors text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
