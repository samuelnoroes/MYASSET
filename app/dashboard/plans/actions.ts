"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL!;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;

const PLAN_VALUES: Record<string, number> = {
  essencial: 27.90,
  pro: 37.90,
};

async function asaasFetch(path: string, method: string, body?: object) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      "access_token": ASAAS_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Asaas error ${res.status}: ${error}`);
  }

  return res.json();
}

export async function selectPlan(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const plan = formData.get("plan") as string;

  if (!["essencial", "pro"].includes(plan)) {
    redirect("/error?message=" + encodeURIComponent("Plano inválido"));
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, asaas_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/error?message=" + encodeURIComponent("Perfil não encontrado"));
  }

  let asaasCustomerId = profile.asaas_customer_id;

  // 1. Criar customer no Asaas se ainda não existir
  if (!asaasCustomerId) {
    const customer = await asaasFetch("/customers", "POST", {
      name: profile.full_name || user.email,
      email: user.email,
      mobilePhone: profile.phone?.replace(/\D/g, "") || "",
      externalReference: user.id, // UUID do usuário no Supabase
      notificationDisabled: false,
    });

    asaasCustomerId = customer.id;

    // Salvar customer ID no banco
    await supabase
      .from("user_profiles")
      .update({ asaas_customer_id: asaasCustomerId })
      .eq("id", user.id);
  }

  // 2. Criar assinatura recorrente mensal
  const value = PLAN_VALUES[plan];
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1); // vence amanhã (1 dia de carência)
  const dueDateStr = nextDueDate.toISOString().split("T")[0];

  const subscription = await asaasFetch("/subscriptions", "POST", {
    customer: asaasCustomerId,
    billingType: "CREDIT_CARD",
    value,
    nextDueDate: dueDateStr,
    cycle: "MONTHLY",
    description: `MyAsset ${plan === "pro" ? "Pro" : "Essencial"} — assinatura mensal`,
    externalReference: `${user.id}:${plan}`, // pra identificar no webhook
  });

  // 3. Salvar assinatura no banco (status pendente até webhook confirmar)
  await supabase.from("user_profiles").update({
    asaas_subscription_id: subscription.id,
    plan_pending: plan, // campo temporário — vira plan_started_at quando pagar
  }).eq("id", user.id);

  // 4. Redirecionar pro link de pagamento do Asaas
  const checkoutUrl = subscription.invoiceUrl || subscription.url;

  if (!checkoutUrl) {
    redirect("/error?message=" + encodeURIComponent("Erro ao gerar link de pagamento"));
  }

  redirect(checkoutUrl);
}

export async function cancelPlan() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("asaas_subscription_id, plan")
    .eq("id", user.id)
    .single();

  if (!profile?.asaas_subscription_id) {
    redirect("/dashboard/plans");
  }

  // Cancelar assinatura no Asaas
  await asaasFetch(`/subscriptions/${profile.asaas_subscription_id}`, "DELETE");

  // Atualizar banco — volta pra trial (acesso até fim do período)
  await supabase.from("user_profiles").update({
    plan: "trial",
    asaas_subscription_id: null,
    plan_started_at: null,
  }).eq("id", user.id);

  revalidatePath("/dashboard/plans");
  redirect("/dashboard/plans?canceled=true");
}
