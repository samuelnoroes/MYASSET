import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BrandMark from "../_components/BrandMark";
import { STAGES, STAGE_LABEL, STAGE_COLOR, INTENT_LABEL, budgetRange, type Contact } from "./_components/constants";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Todos" },
  ...STAGES.map((s) => ({ key: s, label: STAGE_LABEL[s] })),
];

function ContactRow({ contact, canEdit = true }: { contact: Contact; canEdit?: boolean }) {
  return (
    <div className="flex items-center gap-5 px-6 py-5 hover:bg-surface transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ color: STAGE_COLOR[contact.stage], borderColor: STAGE_COLOR[contact.stage] + "4D" }}
          >
            {STAGE_LABEL[contact.stage]}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
            {INTENT_LABEL[contact.intent] ?? contact.intent}
          </span>
        </div>
        <Link
          href={`/dashboard/contacts/${contact.id}`}
          className="text-base font-semibold text-ink hover:text-forest transition-colors truncate block"
        >
          {contact.name}
        </Link>
        <p className="text-sm text-ink-3">
          {[contact.city, budgetRange(contact.budget_min, contact.budget_max)].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="hidden md:block text-right shrink-0">
        <p className="text-xs text-ink-3 uppercase tracking-wider">Contato</p>
        <p className="text-sm font-semibold text-ink-2">{contact.phone || contact.email || "—"}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <Link
          href={`/dashboard/contacts/${contact.id}`}
          className="text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider"
        >
          {canEdit ? "Abrir" : "Ver"}
        </Link>
      </div>
    </div>
  );
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { filtro?: string; escopo?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("user_profiles")
    .select("agency_id, agency_role, agency_name")
    .eq("id", user.id)
    .single();

  const hasAgency = !!myProfile?.agency_id;
  const isGestor = myProfile?.agency_role === "gestor";
  const agencyScope = hasAgency && isGestor && searchParams.escopo === "imob";

  const baseSelect = supabase
    .from("leads")
    .select("id, user_id, name, phone, email, intent, stage, budget_min, budget_max, city, neighborhoods, property_type, bedrooms_min, bathrooms_min, area_min, parking_min, features, source, notes, lost_reason, created_at, last_activity_at")
    .order("last_activity_at", { ascending: false });

  // No escopo "imobiliária" a RLS libera os contatos dos colegas em leitura (só gestor)
  const { data: contacts, error } = agencyScope ? await baseSelect : await baseSelect.eq("user_id", user.id);
  if (error) redirect("/error?message=" + encodeURIComponent(error.message));

  const allContacts = (contacts ?? []) as Contact[];

  let captadorById = new Map<string, string>();
  if (agencyScope) {
    const { data: colleagues } = await supabase
      .from("user_profiles")
      .select("id, full_name")
      .eq("agency_id", myProfile!.agency_id);
    captadorById = new Map((colleagues ?? []).map((c) => [c.id, (c.full_name || "").split(" ")[0] || "Colega"]));
  }

  const activeFilter = FILTERS.find((f) => f.key === searchParams.filtro) ?? FILTERS[0];
  const filtered = activeFilter.key === "all" ? allContacts : allContacts.filter((c) => c.stage === activeFilter.key);
  const totalCount = allContacts.length;

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-ink ">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandMark agencyName={myProfile?.agency_name} />
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="section-title">{agencyScope ? "Contatos da imobiliária" : "Contatos"}</p>
            <p className="text-sm text-ink-2">
              {totalCount} {totalCount === 1 ? "contato" : "contatos"}
              {agencyScope ? " no time (leitura)" : " seus"}
              {activeFilter.key !== "all" && ` · ${filtered.length} em "${activeFilter.label}"`}
            </p>
          </div>
          <Link
            href="/dashboard/contacts/new"
            className="self-start px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            + Novo contato
          </Link>
        </div>

        {hasAgency && isGestor && (
          <div className="flex gap-2 mb-4">
            <Link
              href="/dashboard/contacts"
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${
                !agencyScope ? "bg-header text-ink border-header" : "bg-card text-ink-2 border-border hover:border-forest hover:text-forest"
              }`}
            >
              Meus contatos
            </Link>
            <Link
              href="/dashboard/contacts?escopo=imob"
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${
                agencyScope ? "bg-header text-ink border-header" : "bg-card text-ink-2 border-border hover:border-forest hover:text-forest"
              }`}
            >
              🏢 Imobiliária (leitura)
            </Link>
          </div>
        )}

        {totalCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => {
              const params = new URLSearchParams();
              if (f.key !== "all") params.set("filtro", f.key);
              if (agencyScope) params.set("escopo", "imob");
              const qs = params.toString();
              return (
                <Link
                  key={f.key}
                  href={`/dashboard/contacts${qs ? `?${qs}` : ""}`}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                    activeFilter.key === f.key
                      ? "bg-forest text-white border-forest"
                      : "bg-card text-ink-2 border-border hover:border-forest hover:text-forest"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        )}

        {totalCount === 0 && (
          <div className="card text-center py-16">
            <p className="text-4xl mb-4">📇</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3">Nenhum contato</p>
            <p className="text-base font-semibold text-ink mb-2">Cadastre seu primeiro contato</p>
            <p className="text-sm text-ink-2 max-w-md mx-auto mb-6">
              Guarde o que o cliente procura — a gente já mostra quais imóveis da carteira batem com ele.
            </p>
            <Link
              href="/dashboard/contacts/new"
              className="inline-block px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Novo contato
            </Link>
          </div>
        )}

        {totalCount > 0 && (
          filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-sm text-ink-2">Nenhum contato em "{activeFilter.label}".</p>
            </div>
          ) : (
            <div className="card divide-y divide-border p-0 overflow-hidden">
              {filtered.map((contact) => (
                <div key={contact.id}>
                  {agencyScope && contact.user_id !== user.id && (
                    <div className="px-6 pt-3 -mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3 border border-border px-2 py-0.5 rounded-full">
                        👤 {captadorById.get(contact.user_id) ?? "Colega"}
                      </span>
                    </div>
                  )}
                  <ContactRow contact={contact} canEdit={contact.user_id === user.id} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
