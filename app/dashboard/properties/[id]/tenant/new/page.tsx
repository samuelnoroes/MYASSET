import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { saveTenant } from "./actions";

type Props = { params: { id: string } };

export default async function TenantNewPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verificar se o imóvel pertence ao usuário
  const { data: property } = await supabase
    .from("properties")
    .select("id, name, monthly_rent, lease_due_day")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!property) notFound();

  // Verificar se já tem inquilino
  const { data: existingTenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", params.id)
    .eq("user_id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/properties/${params.id}`}
            className="text-sm text-ink-3 hover:text-ink"
          >
            ← Voltar ao imóvel
          </Link>
          <h1 className="text-2xl font-bold text-ink mt-3">
            {existingTenant ? "Atualizar inquilino" : "Cadastrar inquilino"}
          </h1>
          <p className="text-sm text-ink-2 mt-1">
            Imóvel: <span className="font-semibold">{property.name}</span>
          </p>
        </div>

        {/* Info */}
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">Para que serve</p>
          <p className="text-sm text-blue-700">
            Os dados do inquilino são usados nos <strong>lembretes de aluguel</strong>, alertas de renovação de contrato e no agente do WhatsApp.
          </p>
        </div>

        {/* Formulário */}
        <form action={saveTenant} className="card space-y-5">
          <input type="hidden" name="property_id" value={params.id} />
          {existingTenant && (
            <input type="hidden" name="tenant_id" value={existingTenant.id} />
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Nome completo do inquilino"
              defaultValue={existingTenant?.name || ""}
              className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              name="cpf"
              type="text"
              required
              placeholder="000.000.000-00"
              defaultValue={existingTenant?.cpf || ""}
              className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="email@exemplo.com"
              defaultValue={existingTenant?.email || ""}
              className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
            />
            <p className="text-xs text-ink-3 mt-1">
              O link de pagamento será enviado para este e-mail todo mês.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
              Telefone / WhatsApp
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="(85) 99999-9999"
              defaultValue={existingTenant?.phone || ""}
              className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-ink-3 mb-4">
              Os dados ficam armazenados com segurança e são visíveis apenas para você.
              O inquilino não precisa criar conta no MyAsset.
            </p>
            <button
              type="submit"
              className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              {existingTenant ? "Atualizar inquilino" : "Salvar inquilino"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}
