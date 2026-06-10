// Limites e preços por plano — manter em sincronia com a tabela plan_limits no Supabase
export type PlanId = "trial" | "essencial" | "plus" | "pro";

export const PLAN_LIMITS: Record<PlanId, {
  label: string;
  price: number;
  maxProperties: number;
  monthlyMessages: number;
  marketRefresh: "nenhum" | "trimestral" | "mensal";
}> = {
  trial:     { label: "Trial",     price: 0,     maxProperties: 3,  monthlyMessages: 30,  marketRefresh: "nenhum" },
  essencial: { label: "Essencial", price: 24.99, maxProperties: 5,  monthlyMessages: 60,  marketRefresh: "trimestral" },
  plus:      { label: "Plus",      price: 37.99, maxProperties: 10, monthlyMessages: 150, marketRefresh: "trimestral" },
  pro:       { label: "Pro",       price: 54.99, maxProperties: 20, monthlyMessages: 300, marketRefresh: "mensal" },
};

export function getPlanLimits(plan: string | null | undefined) {
  return PLAN_LIMITS[(plan as PlanId) || "trial"] ?? PLAN_LIMITS.trial;
}
