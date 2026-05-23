"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL!;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;

async function asaasFetch(path: string, method: string, body?: object) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method,
    headers: {
      "access_token": ASAAS_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Asaas error ${res.status}: ${text}`);

  try { return JSON.parse(text); }
  catch { throw new Error(`Asaas parse error: ${text}`); }
}

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

  let errorMessage: string | null = null;
  let asaasCustomerId: string | null = null;

  try {
    // Criar ou atualizar customer no Asaas
    const customer = await asaasFetch("/customers", "POST", {
      name,
      cpfCnpj: cpf,
      email,
      mobilePhone: phone || undefined,
      externalReference: `tenant:${propertyId}:${user.id}`,
      notificationDisabled: false,
    });

    asaasCustomerId = customer.id;
    console.log("Asaas customer:", JSON.stringify(customer));

  } catch (err) {
    console.error("saveTenant Asaas error:", err);
    // Não bloquear se o Asaas falhar — salva no banco mesmo assim
    // O customer será criado na próxima vez que a cobrança for gerada
    errorMessage = null;
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
        asaas_customer_id: asaasCustomerId,
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
        asaas_customer_id: asaasCustomerId,
      });

    if (error) {
      redirect("/error?message=" + encodeURIComponent(error.message));
    }
  }

  redirect(`/dashboard/properties/${propertyId}`);
}
