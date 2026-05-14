"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function auth(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const mode = String(formData.get("mode") || "");

  if (!email || !password) {
    redirect("/error?message=Informe e-mail e senha.");
  }

  if (password.length < 6) {
    redirect("/error?message=A senha precisa ter no mínimo 6 caracteres.");
  }

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      redirect(`/error?message=${encodeURIComponent(error.message)}`);
    }

    if (!data.user) {
      redirect("/error?message=Não foi possível criar o usuário.");
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  if (mode === "login") {
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

  redirect("/error?message=Ação inválida.");
}
