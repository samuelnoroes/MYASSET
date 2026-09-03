// Ações do assistente MyAsset — compartilhadas entre a API interna
// (/api/assistant) e o bot WhatsApp (/api/whatsapp/webhook).
// Executadas com service role; o contexto (ctx) delimita o que o corretor enxerga.

import { SupabaseClient } from "@supabase/supabase-js";
import { buildPropertyShareMessage } from "@/app/lib/propertyShareMessage";

export type AssistantCtx = {
  db: SupabaseClient;
  userId: string;
  agencyId: string | null;
  agencyRole: string | null;
  memberIds: string[]; // o próprio + colegas da imobiliária
};

export function onlyDigits(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

// Campos de imóvel que podem ser alterados pelo assistente
export const EDITABLE_PROPERTY_FIELDS = new Set([
  "name", "address", "city", "state",
  "current_value", "monthly_rent", "iptu_amount", "condo_fee",
  "listing_purpose", "listing_status",
  "owner_name", "owner_phone",
]);

async function resolveProperty(ctx: AssistantCtx, params: any) {
  const nickname = String(params?.nickname || "").trim().toLowerCase();
  const id = String(params?.property_id || "").trim();
  if (!nickname && !id) return { error: "Informe nickname ou property_id." };

  let query = ctx.db.from("properties").select("*").in("user_id", ctx.memberIds).eq("is_active", true);
  query = nickname ? query.eq("nickname", nickname) : query.eq("id", id);
  const { data, error } = await query.maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Imóvel não encontrado na sua carteira/imobiliária." };
  return { property: data };
}

export const ASSISTANT_ACTIONS: Record<string, (ctx: AssistantCtx, params: any) => Promise<any>> = {
  // ── Consultas ─────────────────────────────────────────
  async get_portfolio(ctx, params) {
    const scope = params?.scope === "agency" ? ctx.memberIds : [ctx.userId];
    let q = ctx.db
      .from("properties")
      .select("id, nickname, name, city, state, listing_purpose, listing_status, current_value, monthly_rent, iptu_amount, condo_fee, owner_name, user_id")
      .in("user_id", scope)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (params?.status) q = q.eq("listing_status", String(params.status));
    if (params?.purpose) q = q.eq("listing_purpose", String(params.purpose));
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { properties: data };
  },

  async get_property(ctx, params) {
    const r = await resolveProperty(ctx, params);
    if ("error" in r) throw new Error(r.error);
    return { property: r.property };
  },

  async get_share_message(ctx, params) {
    const r = await resolveProperty(ctx, params);
    if ("error" in r) throw new Error(r.error);
    return { message: buildPropertyShareMessage(r.property) };
  },

  async get_visits(ctx, params) {
    const today = new Date().toISOString().slice(0, 10);
    let q = ctx.db
      .from("property_visits")
      .select("id, visitor_name, visitor_phone, scheduled_at, status, notes, properties(name, nickname)")
      .eq("user_id", ctx.userId)
      .order("scheduled_at", { ascending: true });
    if (params?.when === "today") {
      q = q.eq("status", "scheduled").gte("scheduled_at", today).lt("scheduled_at", `${today}T23:59:59`);
    } else if (params?.when === "all") {
      // sem filtro extra
    } else {
      q = q.eq("status", "scheduled").gte("scheduled_at", today);
    }
    const { data, error } = await q.limit(30);
    if (error) throw new Error(error.message);
    return { visits: data };
  },

  async get_goals(ctx) {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const [{ data: goal }, { data: deals }, agencyGoalRes] = await Promise.all([
      ctx.db.from("broker_goals").select("personal_target, agency_target").eq("user_id", ctx.userId).eq("period_month", period).maybeSingle(),
      ctx.db.from("deals").select("user_id, deal_type, deal_value").in("user_id", ctx.memberIds).gte("closed_at", period),
      ctx.agencyId
        ? ctx.db.from("agency_goals").select("target_amount").eq("agency_id", ctx.agencyId).eq("period_month", period).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const allSales = (deals ?? []).filter(d => d.deal_type === "sale");
    const myVgv = allSales.filter(d => d.user_id === ctx.userId).reduce((a, d) => a + Number(d.deal_value), 0);
    const teamVgv = allSales.reduce((a, d) => a + Number(d.deal_value), 0);
    return {
      period_month: period,
      personal_target: goal?.personal_target ? Number(goal.personal_target) : null,
      personal_realized_vgv: myVgv,
      agency_target: ctx.agencyId
        ? ((agencyGoalRes as any)?.data?.target_amount ? Number((agencyGoalRes as any).data.target_amount) : null)
        : (goal?.agency_target ? Number(goal.agency_target) : null),
      agency_realized_vgv: ctx.agencyId ? teamVgv : myVgv,
    };
  },

  // ── Alterações ────────────────────────────────────────
  async schedule_visit(ctx, params) {
    const r = await resolveProperty(ctx, params);
    if ("error" in r) throw new Error(r.error);
    const visitorName = String(params?.visitor_name || "").trim();
    const scheduledAt = String(params?.scheduled_at || "").trim();
    if (!visitorName || !scheduledAt) throw new Error("Informe visitor_name e scheduled_at.");
    const { data, error } = await ctx.db
      .from("property_visits")
      .insert({
        user_id: ctx.userId,
        property_id: r.property.id,
        visitor_name: visitorName,
        visitor_phone: String(params?.visitor_phone || "").trim() || null,
        scheduled_at: scheduledAt,
        notes: String(params?.notes || "").trim() || null,
        status: "scheduled",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { visit_id: data.id, property: r.property.name };
  },

  async complete_visit(ctx, params) {
    const visitId = String(params?.visit_id || "").trim();
    if (!visitId) throw new Error("Informe visit_id.");
    const { error } = await ctx.db
      .from("property_visits")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", visitId)
      .eq("user_id", ctx.userId);
    if (error) throw new Error(error.message);
    return { done: true };
  },

  async cancel_visit(ctx, params) {
    const visitId = String(params?.visit_id || "").trim();
    if (!visitId) throw new Error("Informe visit_id.");
    const { error } = await ctx.db
      .from("property_visits")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", visitId)
      .eq("user_id", ctx.userId);
    if (error) throw new Error(error.message);
    return { canceled: true };
  },

  async register_deal(ctx, params) {
    const dealType = String(params?.deal_type || "");
    const dealValue = Number(params?.deal_value);
    if (!["sale", "rent"].includes(dealType) || !dealValue || dealValue <= 0) {
      throw new Error("Informe deal_type ('sale'|'rent') e deal_value > 0.");
    }
    let propertyId: string | null = null;
    let propertyName: string | null = null;
    if (params?.nickname || params?.property_id) {
      const r = await resolveProperty(ctx, params);
      if ("error" in r) throw new Error(r.error);
      propertyId = r.property.id;
      propertyName = r.property.name;
    }
    const { data, error } = await ctx.db
      .from("deals")
      .insert({
        user_id: ctx.userId,
        property_id: propertyId,
        deal_type: dealType,
        deal_value: dealValue,
        closed_at: String(params?.closed_at || "").trim() || new Date().toISOString().slice(0, 10),
        notes: String(params?.notes || "").trim() || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (propertyId && params?.mark_closed !== false) {
      await ctx.db
        .from("properties")
        .update({ listing_status: "closed", updated_at: new Date().toISOString() })
        .eq("id", propertyId);
    }
    return { deal_id: data.id, property: propertyName };
  },

  async update_property(ctx, params) {
    const r = await resolveProperty(ctx, params);
    if ("error" in r) throw new Error(r.error);
    // Só o captador ou o gestor da imobiliária alteram os dados do imóvel
    const isOwner = r.property.user_id === ctx.userId;
    const isGestor = ctx.agencyRole === "gestor";
    if (!isOwner && !isGestor) {
      throw new Error("Só o corretor que captou o imóvel (ou o gestor) pode alterá-lo.");
    }
    const fields = params?.fields && typeof params.fields === "object" ? params.fields : {};
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (EDITABLE_PROPERTY_FIELDS.has(key)) updates[key] = value;
    }
    if (Object.keys(updates).length === 0) {
      throw new Error(`Nenhum campo editável informado. Campos aceitos: ${[...EDITABLE_PROPERTY_FIELDS].join(", ")}.`);
    }
    updates.updated_at = new Date().toISOString();
    const { error } = await ctx.db.from("properties").update(updates).eq("id", r.property.id);
    if (error) throw new Error(error.message);
    return { updated: Object.keys(updates).filter(k => k !== "updated_at") };
  },

  async set_personal_goal(ctx, params) {
    const amount = Number(params?.amount);
    if (!amount || amount < 0) throw new Error("Informe amount (VGV de venda).");
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { error } = await ctx.db.from("broker_goals").upsert(
      { user_id: ctx.userId, period_month: period, personal_target: amount, updated_at: new Date().toISOString() },
      { onConflict: "user_id,period_month" }
    );
    if (error) throw new Error(error.message);
    return { period_month: period, personal_target: amount };
  },
};

// Perfil resolvido pelo telefone + colegas da mesma imobiliária
export async function buildCtxForPhone(db: SupabaseClient, rawPhone: string): Promise<
  | { ctx: AssistantCtx; profile: { id: string; full_name: string | null; creci: string | null; agency_name: string | null; agency_role: string | null; plan: string | null } }
  | { error: string }
> {
  const phone = onlyDigits(rawPhone);
  if (!phone) return { error: "Telefone vazio." };

  const { data: profiles } = await db
    .from("user_profiles")
    .select("id, phone, whatsapp_number, agency_id, agency_role, full_name, creci, agency_name, plan");
  const match = (profiles ?? []).find(p => {
    const candidates = [onlyDigits(p.phone || ""), onlyDigits(p.whatsapp_number || "")].filter(Boolean);
    return candidates.some(c => c === phone || `55${c}` === phone || c === `55${phone}`);
  });
  if (!match) return { error: "Corretor não encontrado para este número." };

  let memberIds = [match.id];
  if (match.agency_id) {
    const { data: colleagues } = await db
      .from("user_profiles")
      .select("id")
      .eq("agency_id", match.agency_id);
    memberIds = (colleagues ?? []).map(c => c.id);
    if (!memberIds.includes(match.id)) memberIds.push(match.id);
  }

  return {
    ctx: {
      db,
      userId: match.id,
      agencyId: match.agency_id ?? null,
      agencyRole: match.agency_role ?? null,
      memberIds,
    },
    profile: {
      id: match.id,
      full_name: match.full_name ?? null,
      creci: match.creci ?? null,
      agency_name: match.agency_name ?? null,
      agency_role: match.agency_role ?? null,
      plan: match.plan ?? null,
    },
  };
}

// Definições de ferramenta para o Claude (bot WhatsApp)
export const ASSISTANT_TOOLS = [
  {
    name: "get_portfolio",
    description: "Lista os imóveis da carteira do corretor (scope 'mine') ou de toda a imobiliária (scope 'agency'). Filtros opcionais por status e finalidade.",
    input_schema: {
      type: "object" as const,
      properties: {
        scope: { type: "string", enum: ["mine", "agency"], description: "mine = só do corretor; agency = portfólio da imobiliária inteira" },
        status: { type: "string", enum: ["available", "reserved", "closed"] },
        purpose: { type: "string", enum: ["sale", "rent"] },
      },
    },
  },
  {
    name: "get_property",
    description: "Retorna a ficha completa de um imóvel pelo apelido (nickname).",
    input_schema: {
      type: "object" as const,
      properties: { nickname: { type: "string", description: "Apelido do imóvel, ex.: sintra203" } },
      required: ["nickname"],
    },
  },
  {
    name: "get_share_message",
    description: "Gera a mensagem pronta (ficha padrão) de um imóvel para o corretor encaminhar ao cliente.",
    input_schema: {
      type: "object" as const,
      properties: { nickname: { type: "string" } },
      required: ["nickname"],
    },
  },
  {
    name: "get_visits",
    description: "Lista as visitas do corretor. when: 'today' (hoje), 'upcoming' (próximas agendadas, padrão) ou 'all' (histórico completo).",
    input_schema: {
      type: "object" as const,
      properties: { when: { type: "string", enum: ["today", "upcoming", "all"] } },
    },
  },
  {
    name: "get_goals",
    description: "Retorna as metas do mês: meta pessoal e realizado do corretor (VGV de venda) e a meta geral da imobiliária com o realizado consolidado do time.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "schedule_visit",
    description: "Agenda uma visita de um interessado a um imóvel.",
    input_schema: {
      type: "object" as const,
      properties: {
        nickname: { type: "string", description: "Apelido do imóvel" },
        visitor_name: { type: "string" },
        visitor_phone: { type: "string" },
        scheduled_at: { type: "string", description: "Data e hora local no formato YYYY-MM-DDTHH:mm" },
        notes: { type: "string" },
      },
      required: ["nickname", "visitor_name", "scheduled_at"],
    },
  },
  {
    name: "complete_visit",
    description: "Marca uma visita como realizada (use get_visits para obter o visit_id).",
    input_schema: {
      type: "object" as const,
      properties: { visit_id: { type: "string" } },
      required: ["visit_id"],
    },
  },
  {
    name: "cancel_visit",
    description: "Cancela uma visita agendada (use get_visits para obter o visit_id).",
    input_schema: {
      type: "object" as const,
      properties: { visit_id: { type: "string" } },
      required: ["visit_id"],
    },
  },
  {
    name: "register_deal",
    description: "Registra um fechamento (venda ou locação). Vendas contam para a meta de VGV. Por padrão marca o imóvel como fechado.",
    input_schema: {
      type: "object" as const,
      properties: {
        nickname: { type: "string", description: "Apelido do imóvel (omita para negócio fora da carteira)" },
        deal_type: { type: "string", enum: ["sale", "rent"] },
        deal_value: { type: "number", description: "Valor do negócio em reais" },
        closed_at: { type: "string", description: "Data YYYY-MM-DD (padrão: hoje)" },
        notes: { type: "string" },
        mark_closed: { type: "boolean", description: "false para não marcar o imóvel como fechado" },
      },
      required: ["deal_type", "deal_value"],
    },
  },
  {
    name: "update_property",
    description: "Atualiza dados de um imóvel (valores, IPTU, condomínio, status, finalidade, endereço, proprietário). Só o captador ou o gestor podem alterar.",
    input_schema: {
      type: "object" as const,
      properties: {
        nickname: { type: "string" },
        fields: {
          type: "object",
          description: "Campos a alterar. Aceitos: name, address, city, state, current_value, monthly_rent, iptu_amount, condo_fee, listing_purpose (sale|rent), listing_status (available|reserved|closed), owner_name, owner_phone",
        },
      },
      required: ["nickname", "fields"],
    },
  },
  {
    name: "set_personal_goal",
    description: "Define a meta pessoal de VGV de venda do corretor para o mês atual.",
    input_schema: {
      type: "object" as const,
      properties: { amount: { type: "number", description: "Meta em reais" } },
      required: ["amount"],
    },
  },
];
