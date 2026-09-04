export const STAGES = ["novo", "contato", "visita", "proposta", "fechado", "perdido"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  novo: "Novo",
  contato: "Em contato",
  visita: "Visita",
  proposta: "Proposta",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const STAGE_COLOR: Record<Stage, string> = {
  novo: "#6B7280",
  contato: "#3B82F6",
  visita: "#D9A05B",
  proposta: "#C4A96B",
  fechado: "#5FBF8A",
  perdido: "#E0686C",
};

export const INTENTS = ["compra", "aluguel"] as const;
export const INTENT_LABEL: Record<string, string> = { compra: "Compra", aluguel: "Aluguel" };

export const PROPERTY_TYPES = ["residential", "commercial", "land", "mixed"] as const;
export const PROPERTY_TYPE_LABEL: Record<string, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  land: "Terreno",
  mixed: "Misto",
};

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  intent: string;
  stage: Stage;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  neighborhoods: string[] | null;
  property_type: string | null;
  bedrooms_min: number | null;
  bathrooms_min: number | null;
  area_min: number | null;
  parking_min: number | null;
  features: string[] | null;
  source: string | null;
  notes: string | null;
  lost_reason: string | null;
  created_at: string;
  last_activity_at: string;
};

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export function budgetRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "sem faixa definida";
  if (min != null && max != null) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  if (min != null) return `a partir de ${formatCurrency(min)}`;
  return `até ${formatCurrency(max)}`;
}
