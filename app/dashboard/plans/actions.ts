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

  const text = await res.text();
  if (!res.ok) throw new Error(`Asaas error ${res.status}: ${text}`);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Asaas parse error: ${text}`);
  }
}

// Retorna { url } ou { error } em vez de redirect()
// Assim o redirect fica no componente cliente, sem conflito com NEXT_REDIRECT
export async function createCheckout(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Usuário não autenticado" };

  const plan = formData.get("plan") as string;
  if (!["essencial", "pro"].includes(plan)) return { error: "Plano inválido" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, asaas_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Perfil não encontrado" };

  try {
    let asaasCustomerId = profile.asaas_customer_id;

    // 1. Criar customer se não existir
    if (!asaasCustomerId) {
      const customer = await asaasFetch("/customers", "POST", {
        name: profile.full_name || user.email,
        email: user.email,
        mobilePhone: profile.phone?.replace(/\D/g, "") || "",
        externalReference: user.id,
        notificationDisabled: false,
      });

      asaasCustomerId = customer.id;
      await supabase
        .from("user_profiles")
        .update({ asaas_customer_id: asaasCustomerId })
        .eq("id", user.id);
    }

    // 2. Criar assinatura
    const value = PLAN_VALUES[plan];
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split("T")[0];

    const subscription = await asaasFetch("/subscriptions", "POST", {
      customer: asaasCustomerId,
      billingType: "CREDIT_CARD",
      value,
      nextDueDate: dueDateStr,
      cycle: "MONTHLY",
      description: `MyAsset ${plan === "pro" ? "Pro" : "Essencial"} — assinatura mensal`,
      externalReference: `${user.id}:${plan}`,
    });

    await supabase
      .from("user_profiles")
      .update({ asaas_subscription_id: subscription.id, plan_pending: plan })
      .eq("id", user.id);

    // 3. Buscar primeira cobrança da assinatura
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentsResponse = await asaasFetch(
      `/subscriptions/${subscription.id}/payments`,
 "GET"
    );

    const firstPayment = paymentsResponse?.data?.[0];

    const checkoutUrl =
      firstPayment?.invoiceUrl ||
      firstPayment?.bankSlipUrl ||
      subscription.invoiceUrl ||
      subscription.url ||
      null;

    console.log("checkoutUrl:", checkoutUrl);
    console.log("subscription:", JSON.stringify(subscription));
    console.log("firstPayment:", JSON.stringify(firstPayment));

    if (!checkoutUrl) return { error: "Link de pagamento não gerado. Tente novamente." };

    return { url: checkoutUrl };

  } catch (err) {
    console.error("createCheckout error:", err);
    return { error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}

export async function cancelPlan() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("asaas_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.asaas_subscription_id) {
    try {
      await asaasFetch(`/subscriptions/${profile.asaas_subscription_id}`, "DELETE");
    } catch (err) {
      console.error("cancelPlan error:", err);
    }
  }

  await supabase.from("user_profiles").update({
    plan: "trial",
    asaas_subscription_id: null,
    plan_started_at: null,
    plan_pending: null,
  }).eq("id", user.id);

  revalidatePath("/dashboard/plans");
  redirect("/dashboard/plans?canceled=true");
}
