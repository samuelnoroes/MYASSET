"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = String(formData.get("full_name") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const creci = String(formData.get("creci") || "").trim() || null;
  const agencyName = String(formData.get("agency_name") || "").trim() || null;

  const { error } = await supabase
    .from("user_profiles")
    .update({ full_name: fullName, phone, creci, agency_name: agencyName })
    .eq("id", user.id);

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  // Sem redirect — o cliente controla o estado após salvar
  revalidatePath("/dashboard/profile");
}
