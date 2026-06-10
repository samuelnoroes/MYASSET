"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function saveTenant(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id") || "");
  const tenantId = String(formData.get("tenant_id") || "");
  const name = String(formData.get("name") || "").trim();
  const cpf = String(formData.get("cpf") || "").replace(/\D/g, "");
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").replace(/\D/g, "");

  if (!name || !cpf || !email) {
    redirect("/error?message=" + encodeURIComponent("Nome, CPF e e-mail são obrigatórios."));
  }

  if (cpf.length !== 11) {
    redirect("/error?message=" + encodeURIComponent("CPF inválido. Digite apenas os 11 números."));
  }

  // Salvar ou atualizar inquilino no banco
  if (tenantId) {
    // Atualizar existente
    const { error } = await supabase
      .from("tenants")
      .update({
        name,
        cpf,
        email,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId)
      .eq("user_id", user.id);

    if (error) {
      redirect("/error?message=" + encodeURIComponent(error.message));
    }
  } else {
    // Criar novo
    const { error } = await supabase
      .from("tenants")
      .insert({
        user_id: user.id,
        property_id: propertyId,
        name,
        cpf,
        email,
        phone: phone || null,
      });

    if (error) {
      redirect("/error?message=" + encodeURIComponent(error.message));
    }
  }

  redirect(`/dashboard/properties/${propertyId}`);
}
