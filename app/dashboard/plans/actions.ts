"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function selectPlan(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  const plan = formData.get("plan") as string;
  
  if (!['essencial', 'pro'].includes(plan)) {
    redirect("/error?message=" + encodeURIComponent("Plano inválido"));
  }
  
  // Por enquanto, apenas atualiza o banco
  // Depois vamos integrar com Asaas para pagamento
  const { error } = await supabase
    .from("user_profiles")
    .update({
      plan: plan,
      plan_started_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  
  if (error) {
    redirect("/error?message=" + encodeURIComponent(error.message));
  }
  
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  
  // Redirecionar pro dashboard com mensagem de sucesso
  redirect("/dashboard?upgraded=true");
}
