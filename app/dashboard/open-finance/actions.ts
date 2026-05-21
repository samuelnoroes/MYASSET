"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function registerInterest(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const interested = formData.get("interested") === "true";

  await supabase
    .from("open_finance_interest")
    .upsert(
      { user_id: user.id, interested, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  redirect("/dashboard/open-finance");
}
