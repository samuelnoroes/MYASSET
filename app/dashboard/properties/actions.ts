"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getPlanLimits } from "@/app/lib/plans";

function err(message: string): never {
  redirect("/error?message=" + encodeURIComponent(message));
}

type PropertyInput = {
  name: string;
  nickname: string;
  property_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  listing_purpose: string;
  listing_status: string;
  current_value: number | null;
  monthly_rent: number | null;
  iptu_amount: number | null;
  condo_fee: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  listed_at: string | null;
  acquisition_value: number | null;
  acquisition_date: string | null;
  parent_property_id: string | null;
  unit_identifier: string | null;
};

function parsePropertyForm(formData: FormData): PropertyInput {
  const name = String(formData.get("name") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim().toLowerCase();
  const propertyType = String(formData.get("property_type") || "");
  const listingPurpose = String(formData.get("listing_purpose") || "sale");
  const listingStatus = String(formData.get("listing_status") || "available");
  const address = String(formData.get("address") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const stateField = String(formData.get("state") || "").trim().toUpperCase() || null;
  const parentPropertyId = String(formData.get("parent_property_id") || "").trim() || null;
  const unitIdentifier = String(formData.get("unit_identifier") || "").trim() || null;

  if (!name) err("Nome do imóvel é obrigatório.");
  if (!nickname) err("Apelido do imóvel é obrigatório.");
  if (!/^[a-z0-9]+$/.test(nickname)) err("Apelido deve conter apenas letras minúsculas e números.");
  if (!["sale", "rent"].includes(listingPurpose)) err("Finalidade inválida.");
  if (!["available", "reserved", "closed"].includes(listingStatus)) err("Status inválido.");
  if (!["residential", "commercial", "land", "mixed"].includes(propertyType)) err("Tipo de imóvel inválido.");

  const n = (key: string): number | null => {
    const v = formData.get(key);
    const str = v ? String(v).trim() : "";
    return str !== "" && !isNaN(Number(str)) ? Number(str) : null;
  };
  const d = (key: string): string | null => {
    const v = formData.get(key);
    const str = v ? String(v).trim() : "";
    return str !== "" ? str : null;
  };
  const t = (key: string): string | null => {
    const v = formData.get(key);
    const str = v ? String(v).trim() : "";
    return str !== "" ? str : null;
  };

  return {
    name, nickname, property_type: propertyType,
    address, city, state: stateField,
    listing_purpose: listingPurpose,
    listing_status: listingStatus,
    current_value: n("current_value"),
    monthly_rent: n("monthly_rent"),
    iptu_amount: n("iptu_amount"),
    condo_fee: n("condo_fee"),
    owner_name: t("owner_name"),
    owner_phone: t("owner_phone"),
    listed_at: d("listed_at"),
    acquisition_value: n("acquisition_value"),
    acquisition_date: d("acquisition_date"),
    parent_property_id: parentPropertyId,
    unit_identifier: unitIdentifier,
  };
}

export async function createProperty(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("user_profiles").select("plan").eq("id", user.id).single(),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
  ]);
  const limits = getPlanLimits(profile?.plan);
  if ((count ?? 0) >= limits.maxProperties) {
    err(`Seu plano ${limits.label} permite até ${limits.maxProperties} imóveis. Faça upgrade em Meu Plano para cadastrar mais.`);
  }

  const property = { user_id: user.id, ...parsePropertyForm(formData) };
  const { error } = await supabase.from("properties").insert(property);

  if (error) {
    if (error.code === "23505") err("Já existe um imóvel com esse apelido. Escolha outro.");
    err(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function updateProperty(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  if (!id) err("ID do imóvel não fornecido.");

  const updates = parsePropertyForm(formData);
  const { error } = await supabase.from("properties").update(updates).eq("id", id).eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") err("Já existe outro imóvel com esse apelido.");
    err(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}/edit`);
  redirect(`/dashboard/properties/${id}`);
}

export async function deleteProperty(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  if (!id) err("ID do imóvel não fornecido.");

  const { error } = await supabase.from("properties").delete().eq("id", id).eq("user_id", user.id);
  if (error) err(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
}

export async function setListingStatus(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id) err("ID do imóvel não fornecido.");
  if (!["available", "reserved", "closed"].includes(status)) err("Status inválido.");

  // RPC permite dono, gestor e colegas da mesma imobiliária (ex.: colega que fechou o negócio)
  const { error } = await supabase.rpc("set_listing_status_shared", {
    p_property: id,
    p_status: status,
  });

  if (error) err(error.message);

  revalidatePath(`/dashboard/properties/${id}`);
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");
}
