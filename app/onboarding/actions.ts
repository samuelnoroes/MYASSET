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
  const buyingIntent = String(formData.get("buying_intent") || "").trim() || null;

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

  const { error } = await supabase
    .from("user_profiles")
    .update({
      full_name: fullName,
      phone,
      // Salva intenção de compra como metadata no campo que já existe ou em campo novo
      // Por ora salva em pairing_code temporariamente até termos campo dedicado
      // TODO: criar coluna buying_intent quando houver próxima migração
    })
    .eq("id", user.id);

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
