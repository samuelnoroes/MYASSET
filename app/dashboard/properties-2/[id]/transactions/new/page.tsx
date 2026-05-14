import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createTransaction } from "../actions";

const INCOME_CATEGORIES = [
  { value: "rent", label: "Aluguel" },
  { value: "other", label: "Outros" },
];

const EXPENSE_CATEGORIES = [
  { value: "iptu", label: "IPTU" },
  { value: "condominium", label: "Condomínio" },
  { value: "maintenance", label: "Manutenção" },
  { value: "insurance", label: "Seguro" },
  { value: "other", label: "Outros" },
];

type NewTransactionPageProps = {
  params: { id: string };
  searchParams: { type?: string };
};

export default async function NewTransactionPage({
  params,
  searchParams,
}: NewTransactionPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, name, nickname")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !property) {
    notFound();
  }

  const transactionType =
    searchParams.type === "expense" ? "expense" : "income";
  const isIncome = transactionType === "income";

  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Data de hoje no formato YYYY-MM-DD (server-side)
  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </Link>
          <Link
            href={`/dashboard/properties/${params.id}`}
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
            {isIncome ? "Nova receita" : "Nova despesa"} · @{property.nickname}
          </p>
          <h1 className="font-display text-4xl text-ink">
            {isIncome ? "Lançar receita" : "Lançar despesa"}
          </h1>
          <p className="text-sm text-ink/60 mt-2">{property.name}</p>
        </div>

        <form action={createTransaction} className="space-y-6">
          <input type="hidden" name="property_id" value={property.id} />
          <input type="hidden" name="transaction_type" value={transactionType} />

          <div>
            <label
              htmlFor="category"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              Categoria <span className="text-forest">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
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
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="transaction_date"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              Data <span className="text-forest">*</span>
            </label>
            <input
              id="transaction_date"
              name="transaction_date"
              type="date"
              required
              defaultValue={today}
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              Descrição <span className="text-ink/30">(opcional)</span>
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder={
                isIncome ? "Ex: aluguel de maio" : "Ex: conserto do ar condicionado"
              }
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className={`w-full py-4 text-cream font-medium tracking-wider uppercase text-xs transition-colors ${
                isIncome
                  ? "bg-forest hover:bg-ink"
                  : "bg-ink hover:bg-forest"
              }`}
            >
              {isIncome ? "Lançar receita" : "Lançar despesa"}
            </button>
            <Link
              href={`/dashboard/properties/${params.id}`}
              className="w-full py-4 bg-transparent border border-ink/20 text-ink font-medium tracking-wider uppercase text-xs hover:border-forest hover:text-forest transition-colors text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
