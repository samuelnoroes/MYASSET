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

  if (!res.ok) {
    throw new Error(`Asaas error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Asaas response parse error: ${text}`);
  }
}

export async function selectPlan(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const plan = formData.get("plan") as string;

  if (!["essencial", "pro"].includes(plan)) {
    redirect("/error?message=" + encodeURIComponent("Plano inválido"));
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, asaas_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/error?message=" + encodeURIComponent("Perfil não encontrado"));
  }

  // Resultado final — preenchido dentro do bloco de lógica
  let checkoutUrl: string | null = null;
  let errorMessage: string | null = null;

  // ── Lógica Asaas (sem redirect aqui dentro) ──────────────
  let asaasCustomerId = profile.asaas_customer_id;

  try {
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
      .update({
        asaas_subscription_id: subscription.id,
        plan_pending: plan,
      })
      .eq("id", user.id);

    // 3. Aguardar e buscar cobrança gerada pela assinatura
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentsResponse = await asaasFetch(
      `/subscriptions/${subscription.id}/payments`,
      "GET"
    );

    const firstPayment = paymentsResponse?.data?.[0];

    console.log("Subscription:", JSON.stringify(subscription));
    console.log("First payment:", JSON.stringify(firstPayment));

    checkoutUrl =
      firstPayment?.invoiceUrl ||
      firstPayment?.bankSlipUrl ||
      subscription.invoiceUrl ||
      subscription.url ||
      null;

    if (!checkoutUrl) {
      errorMessage = "Link de pagamento não disponível. Tente novamente em instantes.";
    }

  } catch (error) {
    console.error("selectPlan error:", error);
    errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
  }

  // ── Redirects FORA do try/catch ───────────────────────────
  if (errorMessage) {
    redirect("/error?message=" + encodeURIComponent(errorMessage));
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect("/error?message=" + encodeURIComponent("Erro inesperado. Tente novamente."));
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
    } catch (error) {
      console.error("cancelPlan error:", error);
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
