"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function err(message: string): never {
  redirect("/error?message=" + encodeURIComponent(message));
}

// ============================================================
// Helpers de leitura/validação compartilhados entre create/update
// ============================================================

type PropertyInput = {
  name: string;
  nickname: string;
  property_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  acquisition_value: number | null;
  acquisition_date: string | null;
  current_value: number | null;
  monthly_rent: number | null;
};

function parsePropertyForm(formData: FormData): PropertyInput {
  const name = String(formData.get("name") || "").trim();
  const nickname = String(formData.get("nickname") || "")
    .trim()
    .toLowerCase();
  const propertyType = String(formData.get("property_type") || "");
  const address = String(formData.get("address") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const stateField =
    String(formData.get("state") || "")
      .trim()
      .toUpperCase() || null;

  const acquisitionValueRaw = formData.get("acquisition_value");
  const acquisitionDateRaw = formData.get("acquisition_date");
  const currentValueRaw = formData.get("current_value");
  const monthlyRentRaw = formData.get("monthly_rent");

  if (!name) err("Nome do imóvel é obrigatório.");
  if (!nickname) err("Apelido do imóvel é obrigatório.");

  if (!/^[a-z0-9]+$/.test(nickname)) {
    err(
      "Apelido deve conter apenas letras minúsculas e números, sem espaços ou símbolos."
    );
  }

  if (!["residential", "commercial", "land", "mixed"].includes(propertyType)) {
    err("Tipo de imóvel inválido.");
  }

  return {
    name,
    nickname,
    property_type: propertyType,
    address,
    city,
    state: stateField,
    acquisition_value: acquisitionValueRaw
      ? Number(acquisitionValueRaw)
      : null,
    acquisition_date: acquisitionDateRaw ? String(acquisitionDateRaw) : null,
    current_value: currentValueRaw ? Number(currentValueRaw) : null,
    monthly_rent: monthlyRentRaw ? Number(monthlyRentRaw) : null,
  };
}

// ============================================================
// CREATE
// ============================================================

export async function createProperty(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const property = {
    user_id: user.id,
    ...parsePropertyForm(formData),
  };

  const { error } = await supabase.from("properties").insert(property);

  if (error) {
    if (error.code === "23505") {
      err("Já existe um imóvel com esse apelido. Escolha outro.");
    }
    err(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

// ============================================================
// UPDATE
// ============================================================

export async function updateProperty(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") || "");
  if (!id) err("ID do imóvel não fornecido.");

  const updates = parsePropertyForm(formData);

  const { error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      err("Já existe outro imóvel com esse apelido. Escolha outro.");
    }
    err(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}/edit`);
  redirect("/dashboard/properties");
}

// ============================================================
// DELETE
// ============================================================

export async function deleteProperty(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") || "");
  if (!id) err("ID do imóvel não fornecido.");

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) err(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
}
