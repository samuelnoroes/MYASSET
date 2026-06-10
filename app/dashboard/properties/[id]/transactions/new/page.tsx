import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createTransaction } from "../actions";

const INCOME_CATEGORIES = [
  { value: "rent", label: "Aluguel / Diária" },
  { value: "other", label: "Outros" },
];

const EXPENSE_CATEGORIES = [
  { value: "iptu", label: "IPTU" },
  { value: "condominium", label: "Condomínio" },
  { value: "admin_fee", label: "Taxa de administração (imobiliária)" },
  { value: "maintenance", label: "Manutenção" },
  { value: "insurance", label: "Seguro" },
  { value: "other", label: "Outros" },
];

const INVESTMENT_CATEGORIES = [
  { value: "investment", label: "Parcela / Aporte" },
  { value: "other", label: "Outros custos" },
];

type Props = {
  params: { id: string };
  searchParams: { type?: string };
};

export default async function NewTransactionPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, name, nickname, modality")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !property) notFound();

  const transactionType = searchParams.type === "expense" ? "expense" : "income";
  const isIncome = transactionType === "income";
  const isPlanta = property.modality === "under_construction";

  // Para imóveis na planta: despesas são aportes/parcelas
  const categories = isIncome
    ? INCOME_CATEGORIES
    : isPlanta
    ? INVESTMENT_CATEGORIES
    : EXPENSE_CATEGORIES;

  const today = new Date().toISOString().split("T")[0];

  const accentColor = isIncome ? "#2D4A3E" : isPlanta ? "#3B82F6" : "#1F2937";
  const typeLabel = isIncome
    ? "Nova receita"
    : isPlanta
    ? "Novo aporte"
    : "Nova despesa";
  const actionLabel = isIncome
    ? "Lançar receita"
    : isPlanta
    ? "Registrar aporte"
    : "Lançar despesa";

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-header text-white shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <Link
            href={`/dashboard/properties/${params.id}`}
            className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Cabeçalho da página */}
        <div className="mb-8">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: accentColor }}
          >
            {typeLabel}
          </p>
          <h1 className="text-3xl font-bold text-ink">{property.name}</h1>
          <p className="text-sm text-ink-2 font-mono mt-1">@{property.nickname}</p>
        </div>

        {/* Card do formulário */}
        <div className="card">
          {/* Indicador do tipo */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded mb-6 text-sm font-semibold"
            style={{
              backgroundColor: isIncome ? "#F0FDF4" : isPlanta ? "#EFF6FF" : "#F9FAFB",
              color: accentColor,
              border: `1px solid ${isIncome ? "#BBF7D0" : isPlanta ? "#BFDBFE" : "#E5E7EB"}`,
            }}
          >
            <span style={{ fontSize: 18 }}>
              {isIncome ? "💰" : isPlanta ? "🏗️" : "📋"}
            </span>
            <span>
              {isIncome
                ? "Registrando uma entrada de valor"
                : isPlanta
                ? "Registrando aporte em imóvel na planta"
                : "Registrando uma saída de valor"}
            </span>
          </div>

          <form action={createTransaction} className="space-y-5">
            <input type="hidden" name="property_id" value={property.id} />
            <input type="hidden" name="transaction_type" value={transactionType} />

            {/* Categoria */}
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Categoria <span className="text-forest">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <div>
              <label
                htmlFor="amount"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Valor (R$) <span className="text-forest">*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
              />
            </div>

            {/* Data */}
            <div>
              <label
                htmlFor="transaction_date"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Data <span className="text-forest">*</span>
              </label>
              <input
                id="transaction_date"
                name="transaction_date"
                type="date"
                required
                defaultValue={today}
                className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
              />
            </div>

            {/* Descrição */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Descrição{" "}
                <span className="text-ink-3 font-normal normal-case tracking-normal">
                  (opcional)
                </span>
              </label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder={
                  isIncome
                    ? "Ex: aluguel de junho"
                    : isPlanta
                    ? "Ex: parcela #31 — Residencial Cocó"
                    : "Ex: conserto do ar condicionado"
                }
                className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-4 text-white font-bold tracking-wider uppercase text-sm transition-colors rounded"
                style={{ backgroundColor: accentColor }}
              >
                {actionLabel}
              </button>
              <Link
                href={`/dashboard/properties/${params.id}`}
                className="flex-1 py-4 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
