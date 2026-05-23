"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL!;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;

async function asaasFetch(path: string, method: string, body?: object) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      "access_token": ASAAS_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Asaas error ${res.status}: ${text}`);

  try { return JSON.parse(text); }
  catch { throw new Error(`Asaas parse error: ${text}`); }
}

export async function activateRentCollection(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id") || "");

  // Buscar imóvel
  const { data: property } = await supabase
    .from("properties")
    .select("id, name, monthly_rent, lease_due_day, asaas_subscription_rent_id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!property) redirect("/error?message=" + encodeURIComponent("Imóvel não encontrado."));
  if (!property.monthly_rent) redirect("/error?message=" + encodeURIComponent("Cadastre o valor do aluguel no imóvel antes de ativar a cobrança."));

  // Buscar inquilino
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!tenant) redirect("/error?message=" + encodeURIComponent("Cadastre o inquilino antes de ativar a cobrança."));

  // Buscar conta bancária do proprietário
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("asaas_account_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.asaas_account_id) redirect("/error?message=" + encodeURIComponent("Configure sua conta bancária antes de ativar a cobrança."));

  let errorMessage: string | null = null;
  let subscriptionId: string | null = null;

  try {
    // Garantir que o inquilino tem customer ID no Asaas
    let asaasCustomerId = tenant.asaas_customer_id;
    if (!asaasCustomerId) {
      const customer = await asaasFetch("/customers", "POST", {
        name: tenant.name,
        cpfCnpj: tenant.cpf,
        email: tenant.email,
        mobilePhone: tenant.phone || undefined,
        externalReference: `tenant:${propertyId}:${user.id}`,
        notificationDisabled: false,
      });
      asaasCustomerId = customer.id;

      await supabase
        .from("tenants")
        .update({ asaas_customer_id: asaasCustomerId })
        .eq("id", tenant.id);
    }

    // Calcular data da próxima cobrança
    const now = new Date();
    const dueDay = property.lease_due_day || 5;
    let nextDue = new Date(now.getFullYear(), now.getMonth(), dueDay);
    // Se o dia já passou esse mês, usar o próximo mês
    if (nextDue <= now) {
      nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    }
    const nextDueStr = nextDue.toISOString().split("T")[0];

    // Criar assinatura recorrente com split 95/5
    const subscription = await asaasFetch("/subscriptions", "POST", {
      customer: asaasCustomerId,
      billingType: "UNDEFINED", // inquilino escolhe Pix ou cartão
      value: Number(property.monthly_rent),
      nextDueDate: nextDueStr,
      cycle: "MONTHLY",
      description: `Aluguel — ${property.name} (via MyAsset)`,
      externalReference: `rent:${propertyId}:${user.id}`,

      // Split: 95% pro proprietário, 5% fica na conta master (MyAsset)
      split: [{
        walletId: profile.asaas_account_id,
        percentualValue: 95,
      }],
    });

    subscriptionId = subscription.id;
    console.log("Rent subscription created:", JSON.stringify(subscription));

  } catch (err) {
    console.error("activateRentCollection error:", err);
    errorMessage = err instanceof Error ? err.message : "Erro ao ativar cobrança.";
  }

  if (errorMessage) {
    redirect("/error?message=" + encodeURIComponent(errorMessage));
  }

  // Ativar cobrança no imóvel
  await supabase
    .from("properties")
    .update({
      rent_collection_enabled: true,
      asaas_subscription_rent_id: subscriptionId,
    })
    .eq("id", propertyId);

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}?collection=activated`);
}

export async function deactivateRentCollection(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id") || "");

  const { data: property } = await supabase
    .from("properties")
    .select("id, asaas_subscription_rent_id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!property) redirect("/error?message=" + encodeURIComponent("Imóvel não encontrado."));

  // Cancelar assinatura no Asaas
  if (property.asaas_subscription_rent_id) {
    try {
      await asaasFetch(`/subscriptions/${property.asaas_subscription_rent_id}`, "DELETE");
    } catch (err) {
      console.error("deactivateRentCollection Asaas error:", err);
    }
  }

  // Desativar no banco
  await supabase
    .from("properties")
    .update({
      rent_collection_enabled: false,
      asaas_subscription_rent_id: null,
    })
    .eq("id", propertyId);

  revalidatePath(`/dashboard/properties/${propertyId}`);
  redirect(`/dashboard/properties/${propertyId}?collection=deactivated`);
}
