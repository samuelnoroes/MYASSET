import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const BILLING_PATH = "/dashboard/plans";
const WHATSAPP_PREFIX = "/dashboard/whatsapp";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ÚNICO getUser do middleware — o refresh de token (e a rotação) acontece aqui.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Redirect que PRESERVA os cookies de sessão atualizados (senão derruba a sessão).
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/error") ||
    path.startsWith("/auth") ||
    path.startsWith("/termos") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path === "/";

  // Não logado em rota protegida -> /login
  if (!user && !isPublic) {
    return redirectTo("/login");
  }

  // Gate pay-first (apenas /dashboard, com usuário logado).
  if (user && path.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("account_status")
      .eq("id", user.id)
      .single();

    // Sem perfil: não trava (evita lockout em casos edge).
    if (profile) {
      const status = profile.account_status ?? "pending_payment";

      // WhatsApp/bot: só com conta active.
      if (path.startsWith(WHATSAPP_PREFIX) && status !== "active") {
        return redirectTo(BILLING_PATH);
      }

      // Sem pagamento (ou suspenso): só Planos/Billing.
      const onAllowed = path === BILLING_PATH || path.startsWith("/dashboard/billing");
      if (!onAllowed && (status === "pending_payment" || status === "suspended")) {
        return redirectTo(BILLING_PATH);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto estáticos e imagens.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
