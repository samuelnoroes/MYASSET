import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createProperty } from "../actions";
import PropertyFormFields from "../_components/PropertyFormFields";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: { parent?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all properties to populate parent select
  const { data: allProperties } = await supabase
    .from("properties")
    .select("id, name, nickname, address, city, state, property_type, modality")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const parentProperties = allProperties || [];

  // Pre-fill parent if ?parent= is in URL
  const preSelectedParent = searchParams.parent
    ? parentProperties.find((p) => p.id === searchParams.parent)
    : null;

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white ">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#C4A96B" }}>Asset</span>
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
            {preSelectedParent ? `Nova unidade · ${preSelectedParent.name}` : "Novo imóvel"}
          </p>
          <h1 className="text-3xl font-bold text-ink">
            {preSelectedParent ? "Cadastre a unidade" : "Cadastre um ativo"}
          </h1>
          <p className="text-sm text-ink-2 mt-2">
            Selecione a modalidade correta para ver os campos relevantes.
          </p>
        </div>

        <form action={createProperty} className="space-y-5">
          <PropertyFormFields
            parentProperties={parentProperties}
            defaults={
              preSelectedParent
                ? { parent_property_id: preSelectedParent.id }
                : {}
            }
          />

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
