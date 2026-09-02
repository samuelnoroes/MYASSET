"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function parseBRL(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(cleaned);
  if (!cleaned || Number.isNaN(value) || value < 0) return null;
  return value;
}

async function requireGestor() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("agency_id, agency_role")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id || profile.agency_role !== "gestor") {
    redirect("/error?message=" + encodeURIComponent("Apenas o gestor da imobiliária pode fazer isso."));
  }
  return { supabase, user, agencyId: profile.agency_id as string };
}

export async function saveAgencyGoal(formData: FormData) {
  const { supabase, agencyId } = await requireGestor();

  const periodMonth = String(formData.get("period_month") || "");
  const target = parseBRL(String(formData.get("target_amount") || ""));

  if (!/^\d{4}-\d{2}-01$/.test(periodMonth)) {
    redirect("/error?message=" + encodeURIComponent("Período inválido."));
  }

  const { error } = await supabase.from("agency_goals").upsert(
    {
      agency_id: agencyId,
      period_month: periodMonth,
      target_amount: target,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agency_id,period_month" }
  );

  if (error) redirect("/error?message=" + encodeURIComponent(error.message));

  revalidatePath("/admin");
  revalidatePath("/dashboard/goals");
  redirect("/admin");
}

export async function updateBrokerProfile(formData: FormData) {
  const { supabase } = await requireGestor();

  const brokerId = String(formData.get("broker_id") || "");
  if (!brokerId) redirect("/error?message=" + encodeURIComponent("Corretor inválido."));

  const fullName = String(formData.get("full_name") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const creci = String(formData.get("creci") || "").trim() || null;
  const personalTargetRaw = String(formData.get("personal_target") || "").trim();

  // RLS garante que só o gestor da mesma imobiliária consegue atualizar;
  // o trigger de proteção bloqueia colunas sensíveis (plano, banco, papéis).
  const { error } = await supabase
    .from("user_profiles")
    .update({ full_name: fullName, phone, creci })
    .eq("id", brokerId);

  if (error) redirect("/error?message=" + encodeURIComponent(error.message));

  if (personalTargetRaw !== "") {
    const target = parseBRL(personalTargetRaw);
    const now = new Date();
    const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { error: goalError } = await supabase.from("broker_goals").upsert(
      {
        user_id: brokerId,
        period_month: periodMonth,
        personal_target: target,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,period_month" }
    );
    if (goalError) redirect("/error?message=" + encodeURIComponent(goalError.message));
  }

  revalidatePath("/admin");
  redirect("/admin");
}
