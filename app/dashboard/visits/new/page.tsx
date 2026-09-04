import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import NewVisitForm from "../_components/NewVisitForm";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: { property?: string; lead?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sem filtro de user_id: inclui imóveis da imobiliária (RLS controla a visibilidade)
  const [{ data: properties }, { data: leads }] = await Promise.all([
    supabase.from("properties").select("id, name, city, listing_status").eq("is_active", true).order("name"),
    supabase.from("leads").select("id, name, phone").eq("user_id", user.id).order("name"),
  ]);

  const props = (properties ?? []).filter(p => p.listing_status !== "closed");
  const preselectedProperty = searchParams.property ?? "";
  const preselectedLead = searchParams.lead ?? "";

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Agendar visita</h1>
            <p className="text-sm text-ink-2 mt-1">
              Marque a visita de um contato já cadastrado a um imóvel da sua carteira.
            </p>
          </div>
          <Link href="/dashboard/visits" className="text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider">
            ← Voltar
          </Link>
        </div>

        <div className="card">
          {props.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-ink-2 mb-2">Você ainda não tem imóveis disponíveis na carteira.</p>
              <Link href="/dashboard/properties/new" className="inline-block mt-3 px-6 py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors">
                + Cadastrar imóvel
              </Link>
            </div>
          ) : (
            <NewVisitForm
              properties={props}
              leads={leads ?? []}
              defaultPropertyId={preselectedProperty}
              defaultLeadId={preselectedLead}
            />
          )}
        </div>
      </div>
    </main>
  );
}
