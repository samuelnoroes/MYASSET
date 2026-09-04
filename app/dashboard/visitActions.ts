"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createCalendarEvent, deleteCalendarEvent } from "@/app/lib/googleCalendar";

export async function createVisit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id") || "");
  const leadId = String(formData.get("lead_id") || "");
  const scheduledAt = String(formData.get("scheduled_at") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!propertyId || !leadId || !scheduledAt) {
    redirect("/error?message=" + encodeURIComponent("Selecione o imóvel, o contato e a data da visita."));
  }

  // Visível = próprio ou da mesma imobiliária (RLS decide)
  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address, city, state")
    .eq("id", propertyId)
    .single();

  if (!property) {
    redirect("/error?message=" + encodeURIComponent("Imóvel não encontrado."));
  }

  // Toda visita precisa de um contato já cadastrado — nada de nome/telefone
  // digitado solto. O lead só pode ser um contato do próprio corretor (RLS).
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, phone")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lead) {
    redirect("/error?message=" + encodeURIComponent("Contato não encontrado. Cadastre o contato antes de marcar a visita."));
  }
  const visitorName = lead!.name;
  const visitorPhone = lead!.phone;

  // Sincroniza com a Google Agenda do corretor, se ele tiver conectado a
  // conta. Nunca bloqueia o agendamento — se falhar, segue sem o evento.
  let googleEventId: string | null = null;
  const { data: googleToken } = await supabase
    .from("google_calendar_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (googleToken) {
    googleEventId = await createCalendarEvent(googleToken.refresh_token, {
      propertyName: property!.name,
      address: [property!.address, property!.city, property!.state].filter(Boolean).join(", ") || null,
      visitorName,
      visitorPhone: visitorPhone || null,
      notes: notes || null,
      scheduledAt,
    });
  }

  const { error } = await supabase.from("property_visits").insert({
    user_id: user.id,
    property_id: propertyId,
    lead_id: leadId,
    visitor_name: visitorName,
    visitor_phone: visitorPhone || null,
    scheduled_at: scheduledAt,
    notes: notes || null,
    status: "scheduled",
    google_event_id: googleEventId,
  });

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/visits");
  redirect("/dashboard/visits");
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
  revalidatePath("/dashboard/visits");
}

export async function cancelVisit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const visitId = String(formData.get("visit_id") || "");
  if (!visitId) redirect("/error?message=" + encodeURIComponent("Visita inválida."));

  const { data: visit } = await supabase
    .from("property_visits")
    .select("google_event_id")
    .eq("id", visitId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (visit?.google_event_id) {
    const { data: googleToken } = await supabase
      .from("google_calendar_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (googleToken) {
      await deleteCalendarEvent(googleToken.refresh_token, visit.google_event_id);
    }
  }

  const { error } = await supabase
    .from("property_visits")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", visitId)
    .eq("user_id", user.id);

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/visits");
}
