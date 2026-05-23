import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { saveBankAccount } from "./actions";
import Link from "next/link";

const BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "077", name: "Inter" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "260", name: "Nu Pagamentos (Nubank)" },
  { code: "341", name: "Itaú" },
  { code: "756", name: "Sicoob" },
];

export default async function BankAccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, bank_code, bank_agency, bank_account, bank_account_digit, cpf, asaas_account_id")
    .eq("id", user.id)
    .single();

  const isConfigured = !!profile?.asaas_account_id;

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-ink-3 hover:text-ink">← Voltar ao dashboard</Link>
          <h1 className="text-2xl font-bold text-ink mt-3">Conta bancária para recebimento</h1>
          <p className="text-sm text-ink-2 mt-1">
            Informe sua conta bancária para receber os aluguéis automaticamente. O MyAsset retém 5% como taxa de gestão.
          </p>
        </div>

        {/* Status */}
        {isConfigured && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded mb-6">
            <span className="text-green-600 text-lg">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Conta bancária configurada</p>
              <p className="text-xs text-green-600">Você já pode ativar a cobrança automática nos seus imóveis.</p>
            </div>
          </div>
        )}

        {/* Aviso de taxa */}
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">Como funciona</p>
          <p className="text-sm text-blue-700">
            Quando o inquilino pagar, o Asaas deposita <strong>95%</strong> diretamente na sua conta em D+1.
            Os 5% restantes são a taxa do MyAsset (inclui todas as taxas do gateway de pagamento).
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Exemplo: aluguel de R$2.500 → você recebe R$2.375
          </p>
        </div>

        {/* Formulário */}
        <form action={saveBankAccount} className="card space-y-5">

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
              CPF do titular <span className="text-red-500">*</span>
            </label>
            <input
              name="cpf"
              type="text"
              required
              placeholder="000.000.000-00"
              defaultValue={profile?.cpf || ""}
              className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
              Banco <span className="text-red-500">*</span>
            </label>
            <select
              name="bank_code"
              required
              defaultValue={profile?.bank_code || ""}
              className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
            >
              <option value="" disabled>Selecione seu banco</option>
              {BANKS.map(b => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
              <option value="other">Outro banco</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Agência <span className="text-red-500">*</span>
              </label>
              <input
                name="bank_agency"
                type="text"
                required
                placeholder="0001"
                defaultValue={profile?.bank_agency || ""}
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              />
              <p className="text-xs text-ink-3 mt-1">Sem dígito</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Conta <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  name="bank_account"
                  type="text"
                  required
                  placeholder="12345"
                  defaultValue={profile?.bank_account || ""}
                  className="flex-1 px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
                />
                <input
                  name="bank_account_digit"
                  type="text"
                  required
                  placeholder="6"
                  maxLength={1}
                  defaultValue={profile?.bank_account_digit || ""}
                  className="w-14 px-3 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm text-center"
                />
              </div>
              <p className="text-xs text-ink-3 mt-1">Número · Dígito</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-ink-3 mb-4">
              Seus dados bancários são transmitidos de forma segura ao Asaas,
              instituição de pagamento regulada pelo Banco Central (nº 25.850.020/0001-98).
              O MyAsset não armazena dados bancários completos.
            </p>
            <button
              type="submit"
              className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              {isConfigured ? "Atualizar conta bancária" : "Salvar e ativar recebimentos"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}
