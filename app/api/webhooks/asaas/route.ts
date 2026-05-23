import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabase = createClient();

    const { event, payment, subscription } = payload;

    // ── PAGAMENTO CONFIRMADO ──────────────────────────────
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      const externalRef = payment?.externalReference || subscription?.externalReference;

      if (!externalRef) {
        return NextResponse.json({ received: true });
      }

      // externalReference = "user_id:plan"
      const [userId, plan] = externalRef.split(":");

      if (!userId || !plan) {
        return NextResponse.json({ received: true });
      }

      // Ativar plano no banco
      await supabase.from("user_profiles").update({
        plan: plan,
        plan_started_at: new Date().toISOString(),
        plan_pending: null,
      }).eq("id", userId);

      console.log(`✅ Plano ${plan} ativado para usuário ${userId}`);
    }

    // ── PAGAMENTO ATRASADO ────────────────────────────────
    if (event === "PAYMENT_OVERDUE") {
      const externalRef = payment?.externalReference;
      if (!externalRef) return NextResponse.json({ received: true });

      const [userId] = externalRef.split(":");

      // Opcional: criar notificação crítica no banco
      await supabase.from("notifications").upsert({
        id: `overdue-${userId}`,
        // user_id: userId, // se sua tabela suportar user_id
        title: "⚠️ Pagamento em atraso",
        body: "Sua assinatura está com pagamento pendente. Acesse Meu Plano para regularizar.",
        type: "news",
        active: true,
        contact_label: "Regularizar agora",
        contact_url: "/dashboard/plans",
      });

      console.log(`⚠️ Pagamento atrasado para usuário ${userId}`);
    }

    // ── ASSINATURA CANCELADA ──────────────────────────────
    if (event === "SUBSCRIPTION_DELETED" || event === "PAYMENT_DELETED") {
      const externalRef = payment?.externalReference || subscription?.externalReference;
      if (!externalRef) return NextResponse.json({ received: true });

      const [userId] = externalRef.split(":");

      await supabase.from("user_profiles").update({
        plan: "trial",
        plan_started_at: null,
        asaas_subscription_id: null,
        plan_pending: null,
      }).eq("id", userId);

      console.log(`❌ Assinatura cancelada para usuário ${userId}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook Asaas error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
