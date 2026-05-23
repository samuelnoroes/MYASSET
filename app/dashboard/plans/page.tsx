"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { createCheckout, cancelPlan } from "./actions";

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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700 text-sm font-semibold mb-4">
              ✅ Plano ativado com sucesso! Bem-vindo.
            </div>
          )}
          {canceled === "true" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-700 text-sm font-semibold mb-4">
              ✓ Assinatura cancelada. Você voltou ao plano Trial.
            </div>
          )}
          {hasPendingPayment && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-semibold mb-4">
              ⏳ Aguardando confirmação do pagamento...
            </div>
          )}
          {plan === "trial" && !isTrialExpired && !hasPendingPayment && (
            <p className="text-ink-2">
              Você ainda tem <span className="font-bold text-ink">{daysLeft} dias</span> de trial gratuito.
            </p>
          )}
          {isTrialExpired && plan === "trial" && (
            <p className="text-red-600 font-semibold">
              Seu trial de 30 dias expirou. Escolha um plano para continuar.
            </p>
          )}
          {plan === "essencial" && (
            <p className="text-ink-2">Você está no plano <span className="font-bold">Essencial</span>. Faça upgrade para Pro e libere o WhatsApp.</p>
          )}
          {plan === "pro" && (
            <p className="text-ink-2">Você está no plano <span className="font-bold text-green-600">Pro</span>. Aproveite todos os recursos! 🚀</p>
          )}
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Essencial */}
          <div className={`card border-2 transition-all ${plan === "essencial" ? "border-blue-500" : "border-border hover:border-blue-300"}`}>
            {plan === "essencial" && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                ✓ Plano atual
              </div>
            )}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-ink mb-1">Essencial</h2>
              <p className="text-sm text-ink-3">Gestão completa do seu portfólio</p>
            </div>
            <div className="mb-6">
              <p className="text-4xl font-bold text-ink">R$ 27,90<span className="text-base font-normal text-ink-3">/mês</span></p>
            </div>
            <ul className="space-y-3 mb-6">
              {["Imóveis ilimitados", "Dashboard completo com gráficos", "Controle de transações", "Relatório IR (Carnê-Leão)", "Alertas de vencimento"].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="text-positive text-lg">✓</span>
                  <span className="text-ink-2">{item}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm opacity-40">
                <span className="text-ink-3 text-lg">✕</span>
                <span className="text-ink-3 line-through">WhatsApp integrado</span>
              </li>
            </ul>

            {plan === "essencial" ? (
              <div className="space-y-2">
                <div className="text-center py-3 px-4 bg-blue-50 rounded text-sm text-blue-700 font-semibold">
                  Plano atual — renovação automática mensal
                </div>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="w-full py-2 px-4 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {canceling ? "Cancelando..." : "Cancelar assinatura"}
                </button>
              </div>
            ) : plan === "pro" ? (
              <div className="text-center py-3 px-4 bg-gray-50 rounded text-sm text-ink-3">Você já tem o Pro 🚀</div>
            ) : (
              <button
                onClick={() => handleSelectPlan("essencial")}
                disabled={!!processingPlan}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50"
              >
                {processingPlan === "essencial" ? "Aguarde..." : "Assinar Essencial — R$ 27,90/mês"}
              </button>
            )}
          </div>

          {/* Pro */}
          <div className={`card border-2 relative transition-all ${plan === "pro" ? "border-green-500" : "border-blue-500 hover:border-blue-600"}`}>
            {plan !== "pro" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Recomendado
              </div>
            )}
            {plan === "pro" && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                ✓ Plano atual
              </div>
            )}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-ink mb-1">Pro</h2>
              <p className="text-sm text-ink-3">Tudo do Essencial + WhatsApp</p>
            </div>
            <div className="mb-6">
              <p className="text-4xl font-bold text-ink">R$ 37,90<span className="text-base font-normal text-ink-3">/mês</span></p>
              {plan !== "pro" && <p className="text-xs text-blue-600 mt-1">+R$ 10,00/mês vs Essencial</p>}
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2 font-semibold">Tudo do Essencial, mais:</span>
              </li>
              {["Assistente WhatsApp inteligente", "Resumo semanal automático", "Registrar receitas/despesas por texto", "Consultar rentabilidade via WhatsApp"].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="text-positive text-lg">✓</span>
                  <span className="text-ink-2">{item}</span>
                </li>
              ))}
            </ul>

            {plan === "pro" ? (
              <div className="space-y-2">
                <div className="text-center py-3 px-4 bg-green-50 rounded text-sm text-green-700 font-semibold">
                  Plano atual — renovação automática mensal
                </div>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="w-full py-2 px-4 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {canceling ? "Cancelando..." : "Cancelar assinatura"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSelectPlan("pro")}
                disabled={!!processingPlan}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50"
              >
                {processingPlan === "pro" ? "Aguarde..." : "Assinar Pro — R$ 37,90/mês"}
              </button>
            )}
          </div>

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
