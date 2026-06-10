import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabase = createClient();
    const { event, payment, subscription } = payload;

    const externalRef = payment?.externalReference || subscription?.externalReference || "";

    console.log(`Webhook event: ${event} | ref: ${externalRef}`);

    // ── IDENTIFICAR TIPO DE PAGAMENTO ─────────────────────
    // Assinatura do app: "userId:plan"       (ex: "abc123:essencial")
    // Aluguel: "rent:propertyId:userId" (ex: "rent:prop123:abc123")

    // Pagamentos de aluguel ("rent:...") agora são tratados pelo MyRent — ignorar aqui.
    if (externalRef.startsWith("rent:")) {
      return NextResponse.json({ received: true });
    }

    // ══════════════════════════════════════════════════════
    // PAGAMENTOS DE ASSINATURA DO APP (planos Essencial/Pro)
    // ══════════════════════════════════════════════════════

    // ── PLANO ATIVADO ───────────────────────────────────
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      if (!externalRef) return NextResponse.json({ received: true });

      const [userId, plan] = externalRef.split(":");
      if (!userId || !plan) return NextResponse.json({ received: true });

      await supabase.from("user_profiles").update({
        plan,
        plan_started_at: new Date().toISOString(),
        plan_pending: null,
      }).eq("id", userId);

      console.log(`✅ Plano ${plan} ativado para usuário ${userId}`);
    }

    // ── ASSINATURA EM ATRASO ────────────────────────────
    if (event === "PAYMENT_OVERDUE") {
      if (!externalRef) return NextResponse.json({ received: true });

      const [userId] = externalRef.split(":");

      await supabase.from("notifications").upsert({
        id: `overdue-${userId}`,
        title: "⚠️ Pagamento em atraso",
        body: "Sua assinatura está com pagamento pendente. Acesse Meu Plano para regularizar.",
        type: "news",
        active: true,
        contact_label: "Regularizar agora",
        contact_url: "/dashboard/plans",
      });

      console.log(`⚠️ Pagamento de assinatura atrasado — usuário ${userId}`);
    }

    // ── ASSINATURA CANCELADA ────────────────────────────
    if (event === "SUBSCRIPTION_DELETED" || event === "PAYMENT_DELETED") {
      if (!externalRef) return NextResponse.json({ received: true });

      const [userId] = externalRef.split(":");

      await supabase.from("user_profiles").update({
        plan: "trial",
        plan_started_at: null,
        asaas_subscription_id: null,
        plan_pending: null,
      }).eq("id", userId);

      console.log(`❌ Assinatura cancelada — usuário ${userId}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook Asaas error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
