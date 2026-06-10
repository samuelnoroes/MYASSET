"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { createCheckout, cancelPlan } from "./actions";
import { PLAN_LIMITS, type PlanId } from "@/app/lib/plans";

type Profile = {
  plan: string;
  trial_started_at: string | null;
  plan_started_at: string | null;
  plan_pending: string | null;
};

export default function PlansPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
  const upgraded = searchParams.get("upgraded");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return; }
      supabase
        .from("user_profiles")
        .select("plan, trial_started_at, plan_started_at, plan_pending")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    });
  }, []);

  async function handleSelectPlan(plan: string) {
    setProcessingPlan(plan);
    const formData = new FormData();
    formData.set("plan", plan);
    const result = await createCheckout(formData);

    if (result.url) {
      window.location.href = result.url;
    } else {
      alert(result.error || "Erro ao gerar link de pagamento. Tente novamente.");
      setProcessingPlan(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) return;
    setCanceling(true);
    await cancelPlan();
    window.location.href = "/dashboard/plans?canceled=true";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-ink-3 text-sm">Carregando...</p>
      </main>
    );
  }

  const trialStarted = profile?.trial_started_at ? new Date(profile.trial_started_at) : null;
  const daysSinceStart = trialStarted
    ? Math.floor((Date.now() - trialStarted.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysLeft = Math.max(0, 30 - daysSinceStart);
  const isTrialExpired = daysLeft === 0;
  const plan = profile?.plan ?? "trial";
  const hasPendingPayment = !!profile?.plan_pending;

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-ink mb-2">Meu Plano</h1>

          {upgraded === "true" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-400/30 rounded-full text-emerald-300 text-sm font-semibold mb-4">
              ✅ Plano ativado com sucesso! Bem-vindo.
            </div>
          )}
          {canceled === "true" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-700 text-sm font-semibold mb-4">
              ✓ Assinatura cancelada. Você voltou ao plano Trial.
            </div>
          )}
          {hasPendingPayment && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full text-blue-300 text-sm font-semibold mb-4">
              ⏳ Aguardando confirmação do pagamento...
            </div>
          )}
          {plan === "trial" && !isTrialExpired && !hasPendingPayment && (
            <p className="text-ink-2">
              Você ainda tem <span className="font-bold text-ink">{daysLeft} dias</span> de trial gratuito.
            </p>
          )}
          {isTrialExpired && plan === "trial" && (
            <p className="text-red-300 font-semibold">
              Seu trial de 30 dias expirou. Escolha um plano para continuar.
            </p>
          )}
          {(plan === "essencial" || plan === "plus") && (
            <p className="text-ink-2">Você está no plano <span className="font-bold">{PLAN_LIMITS[plan as PlanId]?.label}</span>. Faça upgrade para ampliar seus limites.</p>
          )}
          {plan === "pro" && (
            <p className="text-ink-2">Você está no plano <span className="font-bold text-emerald-300">Pro</span>. Aproveite todos os recursos! 🚀</p>
          )}
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {(["essencial", "plus", "pro"] as PlanId[]).map((pid) => {
            const cfg = PLAN_LIMITS[pid];
            const isCurrent = plan === pid;
            const featured = pid === "plus";
            const features = [
              `Até ${cfg.maxProperties} imóveis no portfólio`,
              `${cfg.monthlyMessages} mensagens/mês no WhatsApp`,
              "Dashboard completo com gráficos",
              "Relatório IR (Carnê-Leão)",
              "Alertas de vencimento e renovação",
              ...(pid === "essencial" ? [] : ["Agente WhatsApp inteligente", "Inteligência de mercado (MarketDataCard)"]),
              ...(cfg.marketRefresh === "mensal"
                ? ["Atualização de mercado mensal"]
                : cfg.marketRefresh === "trimestral"
                ? ["Atualização de mercado trimestral"]
                : []),
            ];
            return (
              <div
                key={pid}
                className={`card border transition-all relative ${isCurrent ? "border-forest" : featured ? "border-moss hover:border-forest" : "border-border hover:border-moss"}`}
              >
                {featured && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-forest text-[#0C0D0F] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.1em]">
                    Recomendado
                  </div>
                )}
                {isCurrent && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-forest/10 text-forest text-[10px] font-bold rounded-full uppercase tracking-[0.1em] mb-3">
                    ✓ Plano atual
                  </div>
                )}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-ink mb-1">{cfg.label}</h2>
                  <p className="text-sm text-ink-3">
                    {pid === "essencial" ? "Para começar com clareza" : pid === "plus" ? "Para portfólios em crescimento" : "Para investidores ativos"}
                  </p>
                </div>
                <div className="mb-6">
                  <p className="font-mono text-3xl font-medium text-ink">
                    R$ {cfg.price.toFixed(2).replace(".", ",")}
                    <span className="text-sm font-normal text-ink-3">/mês</span>
                  </p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {features.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <span className="text-forest">✓</span>
                      <span className="text-ink-2">{item}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="space-y-2">
                    <div className="text-center py-3 px-4 bg-forest/10 rounded text-sm text-forest font-semibold">
                      Plano atual — renovação mensal
                    </div>
                    <button
                      onClick={handleCancel}
                      disabled={canceling}
                      className="w-full py-2 px-4 border border-red-400/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                    >
                      {canceling ? "Cancelando..." : "Cancelar assinatura"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(pid)}
                    disabled={!!processingPlan}
                    className={`w-full py-3 px-4 font-semibold rounded transition-colors disabled:opacity-50 text-[13px] uppercase tracking-[0.06em] ${featured ? "bg-forest text-[#0C0D0F] hover:bg-forest-light" : "bg-transparent border border-border text-ink-2 hover:border-moss hover:text-ink"}`}
                  >
                    {processingPlan === pid ? "Aguarde..." : `Assinar ${cfg.label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-ink-3">💳 Pagamento seguro via cartão de crédito · Cancele quando quiser</p>
          <p className="text-xs text-ink-3">Processado por <span className="font-semibold">Asaas</span> — instituição de pagamento regulada pelo Banco Central</p>
        </div>

        {!isTrialExpired && (
          <div className="text-center mt-4">
            <Link href="/dashboard" className="text-sm text-ink-3 hover:text-ink underline">
              ← Voltar para o dashboard
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
