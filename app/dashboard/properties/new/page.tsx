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

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <Link
            href="/dashboard/properties"
            className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-forest mb-2">
            Novo imóvel
          </p>
          <h1 className="text-3xl font-bold text-ink">Cadastre um ativo</h1>
          <p className="text-sm text-ink-2 mt-2">
            Selecione a modalidade correta para ver os campos relevantes.
          </p>
        </div>

        <form action={createProperty} className="space-y-5">
          <PropertyFormFields />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="px-8 py-4 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Cadastrar imóvel
            </button>
            <Link
              href="/dashboard/properties"
              className="px-8 py-4 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
