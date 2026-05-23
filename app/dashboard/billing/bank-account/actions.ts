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

export async function saveBankAccount(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cpf = String(formData.get("cpf") || "").replace(/\D/g, "");
  const bankCode = String(formData.get("bank_code") || "").trim();
  const bankAgency = String(formData.get("bank_agency") || "").trim();
  const bankAccount = String(formData.get("bank_account") || "").trim();
  const bankAccountDigit = String(formData.get("bank_account_digit") || "").trim();

  if (!cpf || cpf.length !== 11) {
    redirect("/error?message=" + encodeURIComponent("CPF inválido. Digite apenas os números."));
  }
  if (!bankCode || !bankAgency || !bankAccount || !bankAccountDigit) {
    redirect("/error?message=" + encodeURIComponent("Preencha todos os dados bancários."));
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, email, phone, asaas_account_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/error?message=" + encodeURIComponent("Perfil não encontrado."));

  let asaasAccountId = profile.asaas_account_id;
  let errorMessage: string | null = null;

  try {
    if (!asaasAccountId) {
      // Criar subconta Asaas
      const account = await asaasFetch("/accounts", "POST", {
        name: profile.full_name || user.email,
        email: user.email,
        cpfCnpj: cpf,
        mobilePhone: profile.phone?.replace(/\D/g, "") || "",
        bankAccount: {
          bank: { code: bankCode },
          accountName: profile.full_name || user.email,
          ownerName: profile.full_name || user.email,
          cpfCnpj: cpf,
          agency: bankAgency,
          account: bankAccount,
          accountDigit: bankAccountDigit,
          bankAccountType: "CONTA_CORRENTE",
        },
      });

      asaasAccountId = account.walletId || account.id;
      console.log("Asaas account created:", JSON.stringify(account));
    }

    // Salvar dados bancários + account ID no banco
    const { error } = await supabase
      .from("user_profiles")
      .update({
        cpf,
        bank_code: bankCode,
        bank_agency: bankAgency,
        bank_account: bankAccount,
        bank_account_digit: bankAccountDigit,
        asaas_account_id: asaasAccountId,
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

  } catch (err) {
    console.error("saveBankAccount error:", err);
    errorMessage = err instanceof Error ? err.message : "Erro ao salvar dados bancários.";
  }

  if (errorMessage) {
    redirect("/error?message=" + encodeURIComponent(errorMessage));
  }

  redirect("/dashboard/billing/bank-account?saved=true");
}
