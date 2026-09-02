"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createAgencyAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("agency_name") || "").trim();
  if (!name) {
    redirect("/error?message=" + encodeURIComponent("Informe o nome da imobiliária."));
  }

  const { error } = await supabase.rpc("create_agency", { agency_name: name });
  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  redirect("/admin");
}

export async function joinAgencyAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = String(formData.get("invite_code") || "").trim();
  if (!code) {
    redirect("/error?message=" + encodeURIComponent("Informe o código de convite."));
  }

  const { error } = await supabase.rpc("join_agency", { code });
  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  redirect("/dashboard/profile");
}
