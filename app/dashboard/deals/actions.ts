"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function parseBRL(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(cleaned);
  if (!cleaned || Number.isNaN(value) || value <= 0) return null;
  return value;
}

export async function createDeal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id") || "");
  const dealType = String(formData.get("deal_type") || "");
  const dealValue = parseBRL(String(formData.get("deal_value") || ""));
  const closedAt = String(formData.get("closed_at") || "");
  const notes = String(formData.get("notes") || "").trim();
  const markClosed = formData.get("mark_closed") === "on";

  if (!["sale", "rent"].includes(dealType) || !dealValue || !closedAt) {
    redirect("/error?message=" + encodeURIComponent("Preencha tipo, valor e data do fechamento."));
  }

  if (propertyId) {
    const { data: property } = await supabase
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .single();
    if (!property) {
      redirect("/error?message=" + encodeURIComponent("Imóvel não encontrado."));
    }
  }

  const { error } = await supabase.from("deals").insert({
    user_id: user.id,
    property_id: propertyId || null,
    deal_type: dealType,
    deal_value: dealValue,
    closed_at: closedAt,
    notes: notes || null,
  });

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  if (propertyId && markClosed) {
    await supabase
      .from("properties")
      .update({ listing_status: "closed", updated_at: new Date().toISOString() })
      .eq("id", propertyId)
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/goals");
  redirect("/dashboard/goals");
}
