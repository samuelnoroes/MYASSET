"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createVisit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id") || "");
  const visitorName = String(formData.get("visitor_name") || "").trim();
  const visitorPhone = String(formData.get("visitor_phone") || "").trim();
  const scheduledAt = String(formData.get("scheduled_at") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!propertyId || !visitorName || !scheduledAt) {
    redirect("/error?message=" + encodeURIComponent("Preencha imóvel, nome do interessado e data da visita."));
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!property) {
    redirect("/error?message=" + encodeURIComponent("Imóvel não encontrado."));
  }

  const { error } = await supabase.from("property_visits").insert({
    user_id: user.id,
    property_id: propertyId,
    visitor_name: visitorName,
    visitor_phone: visitorPhone || null,
    scheduled_at: scheduledAt,
    notes: notes || null,
    status: "scheduled",
  });

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function markVisitDone(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const visitId = String(formData.get("visit_id") || "");
  if (!visitId) redirect("/error?message=" + encodeURIComponent("Visita inválida."));

  const { error } = await supabase
    .from("property_visits")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", visitId)
    .eq("user_id", user.id);

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
}

export async function cancelVisit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const visitId = String(formData.get("visit_id") || "");
  if (!visitId) redirect("/error?message=" + encodeURIComponent("Visita inválida."));

  const { error } = await supabase
    .from("property_visits")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", visitId)
    .eq("user_id", user.id);

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
}
