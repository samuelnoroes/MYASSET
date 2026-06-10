"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// Passos obrigatórios (seleção por botão)
const STEPS = [
  {
    id: "tax_person_type",
    question: "Como você declara seus rendimentos imobiliários?",
    hint: "Isso define qual regime tributário se aplica ao seu portfólio.",
    options: [
      { value: "pf", label: "Pessoa Física", desc: "Declaro no IRPF — modelo mais comum entre investidores individuais" },
      { value: "pj", label: "Pessoa Jurídica", desc: "Tenho CNPJ e os imóveis estão na empresa" },
    ],
  },
  {
    id: "tax_declaration",
    question: "Qual modelo de declaração você usa?",
    hint: "O modelo completo pode ser mais vantajoso dependendo das suas despesas dedutíveis.",
    options: [
      { value: "completo", label: "Declaração Completa", desc: "Deduzo despesas, dependentes, saúde, educação" },
      { value: "simplificado", label: "Declaração Simplificada", desc: "Uso o desconto padrão de 20% (limite R$ 16.754,34)" },
      { value: "nao_sei", label: "Não tenho certeza", desc: "Nunca me aprofundei nessa escolha" },
    ],
  },
  {
    id: "tax_tenant_type",
    question: "Seus inquilinos são pessoas físicas ou jurídicas?",
    hint: "A origem do pagamento define a ficha correta na declaração e as obrigações acessórias.",
    options: [
      { value: "pf", label: "Pessoa Física (PF)", desc: "Inquilinos individuais — gera obrigação de Carnê-Leão" },
      { value: "pj", label: "Pessoa Jurídica (PJ)", desc: "Empresas locatárias — retêm IR na fonte" },
      { value: "mixed", label: "Misto — PF e PJ", desc: "Tenho dos dois tipos no portfólio" },
    ],
  },
  {
    id: "tax_uses_carne",
    question: "Você recolhe o Carnê-Leão mensalmente?",
    hint: "Obrigatório para quem recebe aluguel de pessoa física acima do limite de isenção.",
    options: [
      { value: "true", label: "Sim, recolho todo mês", desc: "Estou em dia com a Receita Federal" },
      { value: "false", label: "Não recolho", desc: "Nunca fiz ou parei de fazer" },
      { value: "partial", label: "Às vezes / Não sei se estou correto", desc: "Tenho dúvidas sobre o processo" },
    ],
  },
  {
    id: "tax_has_planning",
    question: "Você já fez planejamento tributário para o seu portfólio imobiliário?",
    hint: "Planejamento adequado pode reduzir significativamente a carga de IR.",
    options: [
      { value: "true", label: "Sim, tenho acompanhamento", desc: "Trabalho com contador especializado em imóveis" },
      { value: "false", label: "Não, nunca fiz", desc: "Só declaro o que recebo, sem análise de eficiência" },
      { value: "partial", label: "Faço por conta própria", desc: "Estudo o assunto mas sem orientação profissional" },
    ],
  },
];

// Etapa de precisão — campos opcionais em formulário único
const PRECISION_STEP = "precision";

export default function TaxProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Campos opcionais de precisão
  const [dependentes, setDependentes] = useState("");
  const [inss, setInss] = useState("");
  const [pensao, setPensao] = useState("");

  const isPrecisionStep = step === STEPS.length;
  const current = !isPrecisionStep ? STEPS[step] : null;
  const progress = (step / (STEPS.length + 1)) * 100;

  async function handleSelect(value: string) {
    const newAnswers = { ...answers, [current!.id]: value };
    setAnswers(newAnswers);
    setStep(step + 1); // avança para próximo step ou para precision
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_profiles").update({
      tax_person_type:  answers.tax_person_type,
      tax_declaration:  answers.tax_declaration,
      tax_tenant_type:  answers.tax_tenant_type,
      tax_uses_carne:   answers.tax_uses_carne === "true",
      tax_has_planning: answers.tax_has_planning === "true",
      // Campos opcionais de precisão
      tax_dependentes:  dependentes !== "" ? parseInt(dependentes) : null,
      tax_inss_mensal:  inss !== "" ? parseFloat(inss.replace(",", ".")) : null,
      tax_pensao:       pensao !== "" ? parseFloat(pensao.replace(",", ".")) : null,
    }).eq("id", user.id);

    router.push("/dashboard/tax");
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white ">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#C4A96B" }}>Asset</span>
          </Link>
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Perfil fiscal — {Math.min(step + 1, STEPS.length + 1)} de {STEPS.length + 1}
          </span>
        </div>
      </header>

      {/* Barra de progresso */}
      <div className="w-full h-1 bg-border">
        <div
          className="h-1 bg-forest transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* ── PASSOS OBRIGATÓRIOS ───────────────────────── */}
        {!isPrecisionStep && current && (
          <>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/70 mb-4">
                IR & Tributação
              </p>
              <h1 className="text-3xl font-bold text-ink mb-3">
                {current.question}
              </h1>
              <p className="text-sm text-ink-2 leading-relaxed">{current.hint}</p>
            </div>

            <div className="space-y-3">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  disabled={saving}
                  className="w-full text-left card hover:border-forest hover: transition-all border-2 border-transparent"
                >
                  <p className="font-bold text-base text-ink mb-1">{opt.label}</p>
                  <p className="text-sm text-ink-2">{opt.desc}</p>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-6 text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider"
              >
                ← Voltar
              </button>
            )}
          </>
        )}

        {/* ── ETAPA DE PRECISÃO (OPCIONAL) ─────────────── */}
        {isPrecisionStep && (
          <>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/70 mb-4">
                IR & Tributação — Última etapa
              </p>
              <h1 className="text-3xl font-bold text-ink mb-3">
                Quer um cálculo mais preciso?
              </h1>

              {/* Banner explicativo */}
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-card px-5 py-4 mb-6">
                <p className="text-sm font-bold text-amber-300 mb-1">
                  ℹ️ Estas informações são totalmente opcionais
                </p>
                <p className="text-sm text-amber-300 leading-relaxed">
                  Sem elas, o relatório mostra uma <strong>estimativa precisa</strong> do Carnê-Leão sobre seus rendimentos imobiliários.
                  Com elas, o cálculo fica <strong>ainda mais exato</strong>, descontando as deduções pessoais que a lei permite.
                  Se não tiver interesse nesse nível de detalhe, clique em <strong>"Gerar relatório"</strong> direto.
                </p>
              </div>
            </div>

            <div className="card space-y-6">
              {/* Dependentes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1">
                  Número de dependentes
                </label>
                <p className="text-xs text-ink-3 mb-3">
                  Filhos, cônjuge dependente, pais etc. — R$ 189,59/mês por dependente deduzido do Carnê-Leão.
                </p>
                <input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0 (deixe em branco para ignorar)"
                  value={dependentes}
                  onChange={(e) => setDependentes(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
                />
              </div>

              {/* INSS */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1">
                  Contribuição mensal ao INSS (R$)
                </label>
                <p className="text-xs text-ink-3 mb-3">
                  Se você é autônomo, MEI ou contribuinte facultativo — a contribuição é dedutível do Carnê-Leão.
                </p>
                <input
                  type="text"
                  placeholder="Ex: 320,00 (deixe em branco para ignorar)"
                  value={inss}
                  onChange={(e) => setInss(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
                />
              </div>

              {/* Pensão alimentícia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1">
                  Pensão alimentícia judicial mensal (R$)
                </label>
                <p className="text-xs text-ink-3 mb-3">
                  Apenas pensão determinada judicialmente — deduções informais não são permitidas pela Receita.
                </p>
                <input
                  type="text"
                  placeholder="Ex: 1.500,00 (deixe em branco para ignorar)"
                  value={pensao}
                  onChange={(e) => setPensao(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Gerar relatório"}
              </button>
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-4 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded"
              >
                ← Voltar
              </button>
            </div>

            <p className="text-xs text-ink-3 text-center mt-4">
              Você pode editar essas informações a qualquer momento em Perfil Fiscal.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
