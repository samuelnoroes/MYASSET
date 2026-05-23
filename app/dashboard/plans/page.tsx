import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { selectPlan } from "./actions";

export default async function PlansPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan, trial_started_at, full_name")
    .eq("id", user.id)
    .single();
  
  // Calcular dias restantes de trial
  const trialStarted = profile?.trial_started_at ? new Date(profile.trial_started_at) : null;
  const now = new Date();
  const daysSinceStart = trialStarted 
    ? Math.floor((now.getTime() - trialStarted.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const daysLeft = Math.max(0, 30 - daysSinceStart);
  const isTrialExpired = daysLeft === 0;
  
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-ink mb-2">
            Escolha seu plano
          </h1>
          {profile?.plan === 'trial' && !isTrialExpired && (
            <p className="text-ink-2">
              Você ainda tem <span className="font-bold text-ink">{daysLeft} dias</span> de trial gratuito. 
              Escolha um plano agora e garanta acesso contínuo.
            </p>
          )}
          {isTrialExpired && (
            <p className="text-red-600 font-semibold">
              Seu trial de 30 dias expirou. Escolha um plano para continuar usando o MyAsset.
            </p>
          )}
          {profile?.plan === 'essencial' && (
            <p className="text-ink-2">
              Você está no plano <span className="font-bold">Essencial</span>. 
              Faça upgrade para Pro e libere o WhatsApp.
            </p>
          )}
        </div>

        {/* Cards de planos */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Plano Essencial */}
          <div className="card border-2 border-border hover:border-blue-300 transition-all">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-ink mb-1">Essencial</h2>
              <p className="text-sm text-ink-3">Gestão completa do seu portfólio</p>
            </div>
            
            <div className="mb-6">
              <p className="text-4xl font-bold text-ink">
                R$ 27,90
                <span className="text-base font-normal text-ink-3">/mês</span>
              </p>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Imóveis ilimitados</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Dashboard completo com gráficos</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Controle de transações</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Relatório IR (Carnê-Leão)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Alertas de vencimento</span>
              </li>
              <li className="flex items-start gap-2 text-sm opacity-40">
                <span className="text-ink-3 text-lg">✕</span>
                <span className="text-ink-3 line-through">WhatsApp integrado</span>
              </li>
            </ul>
            
            {profile?.plan === 'essencial' ? (
              <div className="text-center py-3 px-4 bg-gray-100 rounded text-sm text-ink-3 font-semibold">
                Plano atual
              </div>
            ) : (
              <form action={selectPlan}>
                <input type="hidden" name="plan" value="essencial" />
                <button 
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
                >
                  Escolher Essencial
                </button>
              </form>
            )}
          </div>

          {/* Plano Pro */}
          <div className="card border-2 border-blue-500 relative hover:border-blue-600 transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Recomendado
            </div>
            
            <div className="mb-4">
              <h2 className="text-xl font-bold text-ink mb-1">Pro</h2>
              <p className="text-sm text-ink-3">Tudo do Essencial + WhatsApp</p>
            </div>
            
            <div className="mb-6">
              <p className="text-4xl font-bold text-ink">
                R$ 37,90
                <span className="text-base font-normal text-ink-3">/mês</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                +R$ 10,00/mês vs Essencial
              </p>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2 font-semibold">Tudo do Essencial, mais:</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Assistente WhatsApp inteligente</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Resumo semanal automático</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Registrar receitas/despesas por texto</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-positive text-lg">✓</span>
                <span className="text-ink-2">Consultar rentabilidade via WhatsApp</span>
              </li>
            </ul>
            
            {profile?.plan === 'pro' ? (
              <div className="text-center py-3 px-4 bg-blue-100 rounded text-sm text-blue-700 font-semibold">
                Plano atual
              </div>
            ) : (
              <form action={selectPlan}>
                <input type="hidden" name="plan" value="pro" />
                <button 
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
                >
                  Escolher Pro
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Voltar pro dashboard (se não estiver com trial expirado) */}
        {!isTrialExpired && (
          <div className="text-center mt-6">
            <Link href="/dashboard" className="text-sm text-ink-3 hover:text-ink underline">
              ← Voltar para o dashboard
            </Link>
          </div>
        )}
        
      </div>
    </main>
  );
}
