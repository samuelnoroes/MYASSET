"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function err(message: string): never {
  redirect("/error?message=" + encodeURIComponent(message));
}

type PropertyInput = {
  name: string;
  nickname: string;
  modality: string;
  property_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  acquisition_value: number | null;
  acquisition_date: string | null;
  current_value: number | null;
  monthly_rent: number | null;
  // annual_lease
  lease_due_day: number | null;
  lease_renewal_date: string | null;
  adjustment_index: string | null;
  // short_stay
  daily_rate: number | null;
  target_occupancy: number | null;
  // under_construction
  delivery_date: string | null;
  total_investment: number | null;
};

function parsePropertyForm(formData: FormData): PropertyInput {
  const name = String(formData.get("name") || "").trim();
  const nickname = String(formData.get("nickname") || "")
    .trim()
    .toLowerCase();
  const modality = String(
    formData.get("modality") || "annual_lease"
  );
  const propertyType = String(formData.get("property_type") || "");
  const address = String(formData.get("address") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const stateField =
    String(formData.get("state") || "")
      .trim()
      .toUpperCase() || null;

  if (!name) err("Nome do imóvel é obrigatório.");
  if (!nickname) err("Apelido do imóvel é obrigatório.");

  if (!/^[a-z0-9]+$/.test(nickname)) {
    err(
      "Apelido deve conter apenas letras minúsculas e números, sem espaços ou símbolos."
    );
  }

  if (
    !["annual_lease", "short_stay", "under_construction"].includes(modality)
  ) {
    err("Modalidade inválida.");
  }

  if (!["residential", "commercial", "land", "mixed"].includes(propertyType)) {
    err("Tipo de imóvel inválido.");
  }

  // Helper pra campos numéricos opcionais
  const n = (key: string): number | null => {
    const v = formData.get(key);
    const str = v ? String(v).trim() : "";
    return str !== "" && !isNaN(Number(str)) ? Number(str) : null;
  };

  // Helper pra campos de data opcionais
  const d = (key: string): string | null => {
    const v = formData.get(key);
    const str = v ? String(v).trim() : "";
    return str !== "" ? str : null;
  };

  // Helper pra campos de texto opcionais
  const t = (key: string): string | null => {
    const v = formData.get(key);
    const str = v ? String(v).trim() : "";
    return str !== "" ? str : null;
  };

  return {
    name,
    nickname,
    modality,
    property_type: propertyType,
    address,
    city,
    state: stateField,
    acquisition_value: n("acquisition_value"),
    acquisition_date: d("acquisition_date"),
    current_value: n("current_value"),
    monthly_rent: n("monthly_rent"),
    // annual_lease
    lease_due_day: n("lease_due_day"),
    lease_renewal_date: d("lease_renewal_date"),
    adjustment_index: t("adjustment_index"),
    // short_stay
    daily_rate: n("daily_rate"),
    target_occupancy: n("target_occupancy"),
    // under_construction
    delivery_date: d("delivery_date"),
    total_investment: n("total_investment"),
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
  redirect(`/dashboard/properties/${id}`);
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
