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
    // Assinatura do app:  "userId:plan"       (ex: "abc123:essencial")
    // Aluguel:            "rent:propertyId:userId" (ex: "rent:prop123:abc123")

    const isRentPayment = externalRef.startsWith("rent:");

    // ══════════════════════════════════════════════════════
    // PAGAMENTOS DE ALUGUEL
    // ══════════════════════════════════════════════════════
    if (isRentPayment) {
      const parts = externalRef.split(":");
      const propertyId = parts[1];
      const userId = parts[2];

      if (!propertyId || !userId) {
        return NextResponse.json({ received: true });
      }

      // ── ALUGUEL PAGO ────────────────────────────────────
      if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        const grossAmount = Number(payment?.value || 0);
        const netValue = Number(payment?.netValue || grossAmount);
        const asaasFee = grossAmount - netValue;
        const platformFee = grossAmount * 0.05;
        const netToOwner = grossAmount * 0.95;

        // 1. Inserir cobrança em rent_charges
        const { data: charge } = await supabase
          .from("rent_charges")
          .insert({
            user_id: userId,
            property_id: propertyId,
            tenant_id: null, // preenchemos com upsert abaixo se tiver
            amount: grossAmount,
            due_date: payment?.dueDate || new Date().toISOString().split("T")[0],
            status: "paid",
            payment_method: payment?.billingType || null,
            asaas_payment_id: payment?.id || null,
            paid_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        // Buscar tenant_id e atualizar
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("property_id", propertyId)
          .eq("user_id", userId)
          .single();

        if (charge?.id && tenant?.id) {
          await supabase
            .from("rent_charges")
            .update({ tenant_id: tenant.id })
            .eq("id", charge.id);
        }

        // 2. Registrar comissão em platform_fees
        if (charge?.id) {
          await supabase.from("platform_fees").insert({
            rent_charge_id: charge.id,
            user_id: userId,
            gross_amount: grossAmount,
            asaas_fee: asaasFee,
            platform_fee: platformFee,
            net_to_owner: netToOwner,
          });
        }

        // 3. Criar transação de receita no dashboard do proprietário
        await supabase.from("transactions").insert({
          user_id: userId,
          property_id: propertyId,
          transaction_type: "income",
          category: "rent",
          amount: netToOwner,
          transaction_date: new Date().toISOString().split("T")[0],
          description: `Aluguel recebido via MyAsset (líquido após taxa de 5%)`,
        });

        console.log(`✅ Aluguel pago — imóvel ${propertyId} — R$${grossAmount} bruto / R$${netToOwner} líquido`);
      }

      // ── ALUGUEL ATRASADO ────────────────────────────────
      if (event === "PAYMENT_OVERDUE") {
        // Registrar cobrança como overdue
        await supabase
          .from("rent_charges")
          .upsert({
            user_id: userId,
            property_id: propertyId,
            tenant_id: null,
            amount: Number(payment?.value || 0),
            due_date: payment?.dueDate || new Date().toISOString().split("T")[0],
            status: "overdue",
            asaas_payment_id: payment?.id || null,
            invoice_url: payment?.invoiceUrl || null,
          }, { onConflict: "asaas_payment_id" });

        // Notificação pro proprietário
        await supabase.from("notifications").upsert({
          id: `rent-overdue-${propertyId}`,
          title: "🔴 Aluguel em atraso",
          body: "Um inquilino não pagou o aluguel no prazo. Verifique no portfólio.",
          type: "optimization",
          active: true,
          contact_label: "Ver imóvel",
          contact_url: `/dashboard/properties/${propertyId}`,
        });

        console.log(`⚠️ Aluguel atrasado — imóvel ${propertyId}`);
      }

      // ── COBRANÇA CANCELADA ──────────────────────────────
      if (event === "SUBSCRIPTION_DELETED") {
        await supabase
          .from("properties")
          .update({
            rent_collection_enabled: false,
            asaas_subscription_rent_id: null,
          })
          .eq("id", propertyId)
          .eq("user_id", userId);

        console.log(`❌ Cobrança de aluguel cancelada — imóvel ${propertyId}`);
      }

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
