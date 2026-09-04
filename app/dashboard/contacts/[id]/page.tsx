import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BrandMark from "../../_components/BrandMark";
import { updateContact, deleteContact, setContactStage } from "../actions";
import ContactFormFields from "../_components/ContactFormFields";
import MatchedProperties from "../_components/MatchedProperties";
import { STAGES, STAGE_LABEL, STAGE_COLOR, type Contact } from "../_components/constants";

export default async function ContactPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contact } = await supabase.from("leads").select("*").eq("id", params.id).maybeSingle();
  if (!contact) notFound();

  const c = contact as Contact;
  const isOwner = c.user_id === user.id;

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-ink ">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandMark />
          <Link href="/dashboard/contacts" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            ← Contatos
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-forest mb-2">
            {isOwner ? "Contato" : "Contato do colega (leitura)"}
          </p>
          <h1 className="text-3xl font-bold text-ink">{c.name}</h1>
        </div>

        {isOwner && (
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => {
              const isCurrent = c.stage === s;
              const color = STAGE_COLOR[s];
              return (
                <form action={setContactStage} key={s}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="stage" value={s} />
                  <input type="hidden" name="redirect" value={`/dashboard/contacts/${c.id}`} />
                  <button
                    type="submit"
                    disabled={isCurrent}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors disabled:cursor-default"
                    style={isCurrent
                      ? { color: "#fff", backgroundColor: color, borderColor: color }
                      : { color, borderColor: `${color}55`, backgroundColor: "transparent" }}
                  >
                    {STAGE_LABEL[s]}
                  </button>
                </form>
              );
            })}
          </div>
        )}

        <div className="card">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-2 pb-2 border-b-2 border-forest inline-block mb-5">
            Imóveis compatíveis na carteira
          </p>
          <Suspense fallback={<p className="text-sm text-ink-3">Buscando…</p>}>
            <MatchedProperties leadId={c.id} />
          </Suspense>
        </div>

        <div className="card">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-2 pb-2 border-b-2 border-forest inline-block mb-5">
            {isOwner ? "Editar contato" : "Dados do contato"}
          </p>

          {isOwner ? (
            <form action={updateContact} className="space-y-5">
              <input type="hidden" name="id" value={c.id} />
              <ContactFormFields defaults={c} />
              <button
                type="submit"
                className="px-8 py-4 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
              >
                Salvar
              </button>
            </form>
          ) : (
            <fieldset disabled className="opacity-70">
              <ContactFormFields defaults={c} />
            </fieldset>
          )}
        </div>

        {isOwner && (
          <form action={deleteContact}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className="text-xs text-negative hover:underline uppercase tracking-wider font-semibold">
              Excluir contato
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
