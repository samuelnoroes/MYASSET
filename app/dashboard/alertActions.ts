"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function markAsPaid(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const propertyId = String(formData.get("property_id") || "");
  const amount = Number(formData.get("amount") || 0);

  if (!propertyId || amount <= 0) {
    redirect(
      "/error?message=" + encodeURIComponent("Dados inválidos para quitação.")
    );
  }

  // Confirma que o imóvel pertence ao usuário
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!property) {
    redirect(
      "/error?message=" + encodeURIComponent("Imóvel não encontrado.")
    );
  }

  // Lança receita de aluguel com data de hoje
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    property_id: propertyId,
    transaction_type: "income",
    category: "rent",
    amount,
    transaction_date: today,
    description: "Aluguel quitado",
    source: "manual",
  });

  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
}
