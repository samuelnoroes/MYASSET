import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { activateRentCollection } from "../actions";

type Props = { params: { id: string } };

export default async function ActivateRentCollectionPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, monthly_rent, lease_due_day")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!property) notFound();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, email")
    .eq("property_id", params.id)
    .eq("user_id", user.id)
    .single();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const rent = Number(property.monthly_rent || 0);
  const ownerReceives = rent * 0.95;
  const myassetFee = rent * 0.05;

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="mb-6">
          <Link href={`/dashboard/properties/${params.id}`} className="text-sm text-ink-3 hover:text-ink">
            ← Voltar ao imóvel
          </Link>
          <h1 className="text-2xl font-bold text-ink mt-3">Ativar cobrança automática</h1>
        </div>

        <div className="card space-y-5">

          {/* Resumo */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-3">Imóvel</span>
              <span className="font-semibold text-ink">{property.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-3">Inquilino</span>
              <span className="font-semibold text-ink">{tenant?.name || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-3">Email do inquilino</span>
              <span className="font-semibold text-ink">{tenant?.email || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-3">Vencimento</span>
              <span className="font-semibold text-ink">Todo dia {property.lease_due_day || 5}</span>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Divisão financeira */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Divisão por cobrança</p>
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">Aluguel bruto</span>
              <span className="font-bold text-ink">{formatCurrency(rent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">Taxa MyAsset (5%)</span>
              <span className="text-negative">-{formatCurrency(myassetFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
              <span className="text-ink">Você recebe</span>
              <span className="text-positive">{formatCurrency(ownerReceives)}</span>
            </div>
          </div>

          <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            💳 O inquilino escolhe pagar via <strong>Pix</strong> ou <strong>cartão de crédito</strong>.
            O valor cai na sua conta em <strong>D+1</strong> útil após o pagamento.
          </div>

          {/* Botão confirmar */}
          <form action={activateRentCollection}>
            <input type="hidden" name="property_id" value={params.id} />
            <button
              type="submit"
              className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              ⚡ Confirmar e ativar
            </button>
          </form>

          <Link
            href={`/dashboard/properties/${params.id}`}
            className="block text-center text-sm text-ink-3 hover:text-ink"
          >
            Cancelar
          </Link>
        </div>

      </div>
    </main>
  );
}
