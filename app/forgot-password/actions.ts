"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function forgotPassword(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    redirect("/error?message=" + encodeURIComponent("E-mail é obrigatório."));
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  // Sempre redireciona para a confirmação — mesmo se e-mail não existir
  // (evita enumerar usuários cadastrados)
  redirect("/forgot-password/confirmation");
}
