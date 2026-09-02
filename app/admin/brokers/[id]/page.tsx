import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateBrokerProfile } from "../../actions";

const inputClass =
 "w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors";
const labelClass =
 "block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2";

export default async function EditBrokerPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("user_profiles")
    .select("agency_id, agency_role")
    .eq("id", user.id)
    .single();

  if (!me?.agency_id || me.agency_role !== "gestor") redirect("/dashboard");

  const { data: broker } = await supabase
    .from("user_profiles")
    .select("id, full_name, phone, creci, agency_id, agency_role")
    .eq("id", params.id)
    .single();

  if (!broker || broker.agency_id !== me.agency_id) notFound();

  const now = new Date();
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now);

  const { data: goal } = await supabase
    .from("broker_goals")
    .select("personal_target")
    .eq("user_id", broker.id)
    .eq("period_month", periodMonth)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl italic">
            My<span style={{ color: "#C4A96B" }}>Asset</span>
          </Link>
          <Link href="/admin" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            ← Console
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-forest mb-2">
            Editar corretor{broker.agency_role === "gestor" ? " (gestor)" : ""}
          </p>
          <h1 className="text-3xl font-bold text-ink">{broker.full_name || "Sem nome"}</h1>
        </div>

        <div className="card">
          <form action={updateBrokerProfile} className="space-y-5">
            <input type="hidden" name="broker_id" value={broker.id} />

            <div>
              <label htmlFor="full_name" className={labelClass}>Nome completo</label>
              <input id="full_name" name="full_name" type="text" defaultValue={broker.full_name || ""} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className={labelClass}>WhatsApp</label>
                <input id="phone" name="phone" type="tel" defaultValue={broker.phone || ""} placeholder="(85) 99999-9999" className={inputClass} />
              </div>
              <div>
                <label htmlFor="creci" className={labelClass}>CRECI</label>
                <input id="creci" name="creci" type="text" defaultValue={broker.creci || ""} placeholder="Ex: CRECI-CE 12345" className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="personal_target" className={labelClass}>
                Meta individual de {monthLabel} (VGV de venda)
              </label>
              <input
                id="personal_target"
                name="personal_target"
                type="text"
                inputMode="numeric"
                defaultValue={goal?.personal_target ? String(Number(goal.personal_target)) : ""}
                placeholder="Ex.: 1.500.000"
                className={inputClass}
              />
              <p className="text-xs text-ink-3 mt-1">
                O corretor vê essa meta na aba Metas dele. Deixe em branco para não alterar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" className="px-8 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded">
                Salvar alterações
              </button>
              <Link href="/admin" className="px-8 py-3 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded text-center">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
