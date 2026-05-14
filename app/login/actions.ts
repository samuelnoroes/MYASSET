"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/error?message=Informe e-mail e senha.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/error?message=Informe e-mail e senha.");
  }

  if (password.length < 6) {
    redirect("/error?message=A senha precisa ter no mínimo 6 caracteres.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect("/error?message=Usuário não foi criado no Supabase.");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
