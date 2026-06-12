import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1. Atualizar sessão (comportamento original)
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // 2. Gate apenas em rotas do dashboard
  const isDashboardRoute = pathname.startsWith("/dashboard");
  if (!isDashboardRoute) return response;

  const isPlansPage = pathname === "/dashboard/plans";
  const isBillingPage = pathname.startsWith("/dashboard/billing");

  // 3. Buscar estado da conta (pay-first)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Sem usuário → updateSession já cuida do redirect pra /login
  if (!user) return response;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("account_status")
    .eq("id", user.id)
    .single();

  // Sem perfil → deixa passar (evita loop em casos edge)
  if (!profile) return response;

  const status = profile.account_status ?? "pending_payment";

  // 4. WhatsApp/bot: TOTALMENTE proibido até a conta estar 'active'
  if (pathname.startsWith("/dashboard/whatsapp") && status !== "active") {
    return NextResponse.redirect(new URL("/dashboard/plans", request.url));
  }

  // 5. Planos e billing sempre liberados (para escolher plano e pagar)
  if (isPlansPage || isBillingPage) return response;

  // 6. Pay-first: sem pagamento (ou suspenso) → só Planos/Billing
  if (status === "pending_payment" || status === "suspended") {
    return NextResponse.redirect(new URL("/dashboard/plans", request.url));
  }

  // pending_onboarding e active seguem normalmente
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
