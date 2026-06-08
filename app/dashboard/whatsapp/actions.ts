"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function saveWhatsAppNumber(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const phone = (formData.get("phone") as string || "").replace(/\D/g, "");

  await supabase
    .from("user_profiles")
    .update({ whatsapp_number: phone })
    .eq("id", user.id);

  revalidatePath("/dashboard/whatsapp");
}
