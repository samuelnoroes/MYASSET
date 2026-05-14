"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return null;

  const normalized = String(value)
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  if (!normalized) return null;

  const number = Number(normalized);

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

export async function createProperty(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = String(formData.get("name") || "").trim();

  if (!name) {
    redirect("/error?message=Informe o nome do imóvel.");
  }

  const property = {
    user_id: user.id,
    name,
    property_type: String(formData.get("property_type") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
    acquisition_value: parseNumber(formData.get("acquisition_value")),
    current_value: parseNumber(formData.get("current_value")),
    monthly_rent: parseNumber(formData.get("monthly_rent")),
  };

  const { error } = await supabase.from("properties").insert(property);

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");

  redirect("/dashboard/properties");
}

export async function deleteProperty(formData: FormData) {
  const supabase = createClient();

  const id = String(formData.get("id") || "");

  if (!id) {
    redirect("/error?message=Imóvel não encontrado.");
  }

  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");

  redirect("/dashboard/properties");
}
