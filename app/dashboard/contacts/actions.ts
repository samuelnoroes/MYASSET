"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function err(message: string): never {
  redirect("/error?message=" + encodeURIComponent(message));
}

const INTENTS = ["compra", "aluguel"];
const STAGES = ["novo", "contato", "visita", "proposta", "fechado", "perdido"];
const PROPERTY_TYPES = ["residential", "commercial", "land", "mixed"];

type ContactInput = {
  name: string;
  intent: string;
  stage: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  bedrooms_min: number | null;
  bathrooms_min: number | null;
  area_min: number | null;
  parking_min: number | null;
  neighborhoods: string[] | null;
  features: string[] | null;
  source: string | null;
  notes: string | null;
  lost_reason: string | null;
};

function csv(v: FormDataEntryValue | null): string[] | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const arr = s.split(",").map((x) => x.trim()).filter(Boolean);
  return arr.length ? arr : null;
}

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v || "").trim().replace(/\./g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function txt(v: FormDataEntryValue | null): string | null {
  const s = String(v || "").trim();
  return s !== "" ? s : null;
}

function parseContactForm(formData: FormData): ContactInput {
  const name = String(formData.get("name") || "").trim();
  const intent = String(formData.get("intent") || "");
  const stage = String(formData.get("stage") || "novo");
  const propertyType = String(formData.get("property_type") || "").trim();

  if (!name) err("Nome do contato é obrigatório.");
  if (!INTENTS.includes(intent)) err("Intenção inválida.");
  if (!STAGES.includes(stage)) err("Etapa inválida.");
  if (propertyType && !PROPERTY_TYPES.includes(propertyType)) err("Tipo de imóvel inválido.");

  return {
    name,
    intent,
    stage,
    property_type: propertyType || null,
    phone: txt(formData.get("phone")),
    email: txt(formData.get("email")),
    city: txt(formData.get("city")),
    budget_min: num(formData.get("budget_min")),
    budget_max: num(formData.get("budget_max")),
    bedrooms_min: num(formData.get("bedrooms_min")),
    bathrooms_min: num(formData.get("bathrooms_min")),
    area_min: num(formData.get("area_min")),
    parking_min: num(formData.get("parking_min")),
    neighborhoods: csv(formData.get("neighborhoods")),
    features: csv(formData.get("features")),
    source: txt(formData.get("source")),
    notes: txt(formData.get("notes")),
    lost_reason: txt(formData.get("lost_reason")),
  };
}

export async function createContact(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const contact = { user_id: user.id, ...parseContactForm(formData) };
  const { data, error } = await supabase.from("leads").insert(contact).select("id").single();
  if (error) err(error.message);

  revalidatePath("/dashboard/contacts");

  // Veio do fluxo "agendar visita → cadastrar novo lead": volta pra lá com
  // o imóvel e o contato recém-criado já selecionados.
  if (String(formData.get("return_to") || "") === "visit") {
    const propertyId = String(formData.get("property_id") || "");
    const params = new URLSearchParams({ lead: data.id });
    if (propertyId) params.set("property", propertyId);
    redirect(`/dashboard/visits/new?${params.toString()}`);
  }

  redirect(`/dashboard/contacts/${data.id}`);
}

export async function updateContact(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  if (!id) err("ID do contato não fornecido.");

  const updates = { ...parseContactForm(formData), last_activity_at: new Date().toISOString() };
  const { error } = await supabase.from("leads").update(updates).eq("id", id).eq("user_id", user.id);
  if (error) err(error.message);

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${id}`);
  redirect(`/dashboard/contacts/${id}`);
}

export async function deleteContact(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  if (!id) err("ID do contato não fornecido.");

  const { error } = await supabase.from("leads").delete().eq("id", id).eq("user_id", user.id);
  if (error) err(error.message);

  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function setContactStage(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  const stage = String(formData.get("stage") || "");
  if (!id) err("ID do contato não fornecido.");
  if (!STAGES.includes(stage)) err("Etapa inválida.");

  const { error } = await supabase
    .from("leads")
    .update({ stage, last_activity_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) err(error.message);

  const redirectTo = String(formData.get("redirect") || "/dashboard/contacts");
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${id}`);
  redirect(redirectTo);
}
