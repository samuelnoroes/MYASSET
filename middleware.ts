import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1. Atualizar sessão (comportamento original)
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // 2. Só verificar plano em rotas do dashboard
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isPlansPage = pathname === "/dashboard/plans";
  const isBillingPage = pathname.startsWith("/dashboard/billing");

  // Deixar passar: fora do dashboard, página de planos, billing
  if (!isDashboardRoute || isPlansPage || isBillingPage) {
    return response;
  }

  // 3. Buscar dados do usuário e plano
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Sem usuário logado → deixa o updateSession lidar (vai redirecionar pra /login)
  if (!user) return response;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan, trial_started_at")
    .eq("id", user.id)
    .single();

  // Sem perfil → deixa passar (evitar loop em casos edge)
  if (!profile) return response;

  const plan = profile.plan ?? "trial";

  // 4. Verificar se trial expirou
  if (plan === "trial") {
    const trialStarted = profile.trial_started_at
      ? new Date(profile.trial_started_at)
      : null;

    if (trialStarted) {
      const daysSinceStart = Math.floor(
        (Date.now() - trialStarted.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceStart >= 30) {
        // Trial expirou → redirecionar pra tela de planos
        return NextResponse.redirect(new URL("/dashboard/plans", request.url));
      }
    }
  }

  // 5. Verificar acesso ao WhatsApp (só plano Pro)
  if (pathname.startsWith("/dashboard/whatsapp") && plan !== "pro") {
    return NextResponse.redirect(new URL("/dashboard/plans", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - imagens públicas
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
