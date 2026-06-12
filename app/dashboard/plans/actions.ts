"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.myasset.tech";

// IDs do Stripe (TEST). Trocar pelos IDs LIVE ao migrar para producao.
const PLAN_PRICE: Record<string, string> = {
  essencial: "price_1ThKIwE8nvqjK40ToNXmxOSn",
  plus: "price_1ThKJ5E8nvqjK40THlcXT1uR",
  pro: "price_1ThKJ6E8nvqjK40TBX6oN32y",
};

// Promocao de junho: 1o mes ao preco do Essencial (cupom duration=once)
const PLAN_COUPON: Record<string, string> = {
  plus: "cVOMZLQO",
  pro: "kz9tq1Fd",
};

async function stripeFetch(path: string, method: string, form?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${text}`);
  return JSON.parse(text);
}

// Retorna { url } ou { error } — o redirect acontece no componente cliente.
export async function createCheckout(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuario nao autenticado" };

  const plan = formData.get("plan") as string;
  if (!["essencial", "plus", "pro"].includes(plan)) return { error: "Plano invalido" };

  try {
    const form: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": PLAN_PRICE[plan],
      "line_items[0][quantity]": "1",
      customer_email: user.email ?? "",
      client_reference_id: user.id,
      "metadata[plan]": plan,
      "subscription_data[metadata][plan]": plan,
      success_url: `${SITE_URL}/dashboard/plans?upgraded=true`,
      cancel_url: `${SITE_URL}/dashboard/plans?canceled=true`,
    };
    if (PLAN_COUPON[plan]) form["discounts[0][coupon]"] = PLAN_COUPON[plan];

    const session = await stripeFetch("/checkout/sessions", "POST", form);
    if (!session.url) return { error: "Link de pagamento nao gerado. Tente novamente." };

    // plan_pending so para UX ("aguardando confirmacao"); plan/status sao definidos pelo webhook.
    await supabase.from("user_profiles").update({ plan_pending: plan }).eq("id", user.id);

    return { url: session.url };
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
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_subscription_id) {
    try {
      await stripeFetch(`/subscriptions/${profile.stripe_subscription_id}`, "DELETE");
    } catch (err) {
      console.error("cancelPlan error:", err);
    }
  }
  // O webhook (customer.subscription.deleted) define account_status = suspended.
  redirect("/dashboard/plans?canceled=true");
}
