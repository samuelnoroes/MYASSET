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
