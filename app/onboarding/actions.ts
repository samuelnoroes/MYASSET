"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function saveProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const creci = String(formData.get("creci") || "").trim() || null;
  const agencyName = String(formData.get("agency_name") || "").trim() || null;
  const termsAccepted = formData.get("terms_accepted") === "on";

  if (!fullName) {
    redirect(
 "/error?message=" + encodeURIComponent("Nome completo é obrigatório.")
    );
  }

  if (!phone) {
    redirect(
 "/error?message=" + encodeURIComponent("WhatsApp é obrigatório.")
    );
  }

  if (!termsAccepted) {
    redirect(
 "/error?message=" + encodeURIComponent("Você precisa aceitar os Termos de Uso para continuar.")
    );
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      full_name: fullName,
      phone: phone,
      creci: creci,
      agency_name: agencyName,
      trial_started_at: new Date().toISOString(),
      terms_accepted_at: new Date().toISOString(),
      terms_version: "1.0",
    })
    .eq("id", user.id);

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
