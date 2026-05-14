import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateProperty } from "../../actions";
import PropertyFormFields from "../../_components/PropertyFormFields";

type EditPropertyPageProps = {
  params: { id: string };
};

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </Link>
          <Link
            href={`/dashboard/properties/${params.id}`}
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
            Editar imóvel
          </p>
          <h1 className="font-display text-4xl text-ink">{property.name}</h1>
        </div>

        <form action={updateProperty} className="space-y-10">
          <input type="hidden" name="id" value={property.id} />

          <PropertyFormFields
            defaults={{
              name: property.name,
              nickname: property.nickname,
              modality: property.modality || "annual_lease",
              property_type: property.property_type,
              address: property.address,
              city: property.city,
              state: property.state,
              acquisition_value: property.acquisition_value,
              acquisition_date: property.acquisition_date,
              current_value: property.current_value,
              monthly_rent: property.monthly_rent,
              lease_due_day: property.lease_due_day,
              lease_renewal_date: property.lease_renewal_date,
              adjustment_index: property.adjustment_index,
              daily_rate: property.daily_rate,
              target_occupancy: property.target_occupancy,
              delivery_date: property.delivery_date,
              total_investment: property.total_investment,
            }}
          />

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Salvar alterações
            </button>
            <Link
              href={`/dashboard/properties/${params.id}`}
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
  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
              Portfólio
            </p>
            <h1 className="font-display text-4xl text-ink">Seus imóveis</h1>
            <p className="text-sm text-ink/60 mt-2">
              {properties?.length ?? 0}{" "}
              {properties?.length === 1
                ? "imóvel cadastrado"
                : "imóveis cadastrados"}
            </p>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="self-start md:self-end px-6 py-3 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
          >
            + Novo imóvel
          </Link>
        </div>

        {(!properties || properties.length === 0) && (
          <div className="border border-dashed border-ink/15 p-12 text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
              Nenhum imóvel
            </p>
            <p className="font-display text-2xl text-ink/70 mb-3">
              Comece adicionando seu primeiro ativo
            </p>
            <p className="text-sm text-ink/50 max-w-md mx-auto mb-6">
              Cadastre cada imóvel do seu portfólio pra acompanhar yield, ROI e
              fluxo de caixa.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="inline-block px-6 py-3 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Cadastrar imóvel
            </Link>
          </div>
        )}

        {properties && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white border border-ink/10 p-6 group"
              >
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-forest/60 mb-1">
                      {PROPERTY_TYPE_LABELS[property.property_type] ||
                        property.property_type}
                    </p>
                    {/* Nome clicável → página de detalhe */}
                    <Link
                      href={`/dashboard/properties/${property.id}`}
                      className="block font-display text-2xl text-ink leading-tight mb-1 truncate hover:text-forest transition-colors"
                    >
                      {property.name}
                    </Link>
                    <p className="text-xs text-ink/40 font-mono">
                      @{property.nickname}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Link
                      href={`/dashboard/properties/${property.id}/edit`}
                      className="text-[10px] uppercase tracking-wider text-ink/40 hover:text-forest transition-colors whitespace-nowrap"
                    >
                      Editar
                    </Link>
                    <form action={deleteProperty}>
                      <input type="hidden" name="id" value={property.id} />
                      <button
                        type="submit"
                        className="text-[10px] uppercase tracking-wider text-ink/30 hover:text-red-700 transition-colors whitespace-nowrap"
                        title="Remover imóvel"
                      >
                        Remover
                      </button>
                    </form>
                  </div>
                </div>

                {(property.city || property.state) && (
                  <p className="text-xs text-ink/50 mb-4">
                    {[property.city, property.state]
                      .filter(Boolean)
                      .join(" — ")}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-1">
                      Valor atual
                    </p>
                    <p className="text-sm text-ink font-medium">
                      {formatCurrency(property.current_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink/40 mb-1">
                      Aluguel esperado
                    </p>
                    <p className="text-sm text-ink font-medium">
                      {formatCurrency(property.monthly_rent)}
                    </p>
                  </div>
                </div>

                {/* Link pra detalhe */}
                <div className="mt-4 pt-4 border-t border-ink/5">
                  <Link
                    href={`/dashboard/properties/${property.id}`}
                    className="text-[10px] uppercase tracking-wider text-forest/60 hover:text-forest transition-colors"
                  >
                    Ver transações →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
