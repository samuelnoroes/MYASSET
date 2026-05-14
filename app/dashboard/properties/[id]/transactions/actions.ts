"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function err(message: string): never {
  redirect("/error?message=" + encodeURIComponent(message));
}

export async function createTransaction(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const propertyId = String(formData.get("property_id") || "");
  const transactionType = String(formData.get("transaction_type") || "");
  const category = String(formData.get("category") || "");
  const amountRaw = formData.get("amount");
  const transactionDate = String(formData.get("transaction_date") || "");
  const description =
    String(formData.get("description") || "").trim() || null;

  if (!propertyId) err("Imóvel não identificado.");
  if (!["income", "expense"].includes(transactionType))
    err("Tipo de transação inválido.");
  if (!category) err("Categoria é obrigatória.");
  if (!amountRaw || Number(amountRaw) <= 0)
    err("Valor deve ser maior que zero.");
  if (!transactionDate) err("Data é obrigatória.");

  // Verifica que o imóvel pertence ao usuário
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!property) err("Imóvel não encontrado.");

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    property_id: propertyId,
    transaction_type: transactionType,
    category,
    amount: Number(amountRaw),
    transaction_date: transactionDate,
    description,
    source: "manual",
  });

  if (error) err(error.message);

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/properties/${propertyId}`);
}

export async function deleteTransaction(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") || "");
  const propertyId = String(formData.get("property_id") || "");

  if (!id) err("ID da transação não fornecido.");

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) err(error.message);

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath("/dashboard");
}
 
