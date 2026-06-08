import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateProperty } from "../../actions";
import PropertyFormFields from "../../_components/PropertyFormFields";

type Props = { params: { id: string } };

export default async function EditPropertyPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: property, error }, { data: allProperties }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", params.id).eq("user_id", user.id).single(),
    supabase
      .from("properties")
      .select("id, name, nickname, address, city, state, property_type, modality")
      .eq("user_id", user.id)
      .neq("id", params.id) // exclude self from parent list
      .order("name", { ascending: true }),
  ]);

  if (error || !property) notFound();

  const parentProperties = allProperties || [];

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <Link
            href={`/dashboard/properties/${params.id}`}
            className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-forest mb-2">
            Editar imóvel
          </p>
          <h1 className="text-3xl font-bold text-ink">{property.name}</h1>
        </div>

        <form action={updateProperty} className="space-y-5">
          <input type="hidden" name="id" value={property.id} />

          <PropertyFormFields
            parentProperties={parentProperties}
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
              parent_property_id: property.parent_property_id,
              unit_identifier: property.unit_identifier,
            }}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="px-8 py-4 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Salvar alterações
            </button>
            <Link
              href={`/dashboard/properties/${params.id}`}
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
