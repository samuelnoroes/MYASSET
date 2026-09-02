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

export async function saveGoals(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const periodMonth = String(formData.get("period_month") || "");
  const agencyTarget = parseBRL(String(formData.get("agency_target") || ""));
  const personalTarget = parseBRL(String(formData.get("personal_target") || ""));

  if (!/^\d{4}-\d{2}-01$/.test(periodMonth)) {
    redirect("/error?message=" + encodeURIComponent("Período inválido."));
  }

  const { error } = await supabase.from("broker_goals").upsert(
    {
      user_id: user.id,
      period_month: periodMonth,
      agency_target: agencyTarget,
      personal_target: personalTarget,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/goals");
  redirect("/dashboard/goals");
}
