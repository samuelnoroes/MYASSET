import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Callback dedicado pra conexão opcional da Google Agenda (Perfil > Google
// Agenda). Separado de /auth/callback (login) porque só este fluxo pede o
// escopo de agenda e o prompt=consent necessário pra receber um refresh
// token.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const refreshToken = data.session?.provider_refresh_token;
      const { data: { user } } = await supabase.auth.getUser();

      if (user && refreshToken) {
        const { error: upsertError } = await supabase
          .from("google_calendar_tokens")
          .upsert({ user_id: user.id, refresh_token: refreshToken });

        if (!upsertError) {
          return NextResponse.redirect(`${origin}/dashboard/profile?google_calendar=connected`);
        }
      }

      // Sem refresh_token (usuário já tinha autorizado antes e o Google não
      // reenviou) — pede pra tentar de novo, o botão já força prompt=consent.
      return NextResponse.redirect(
        `${origin}/dashboard/profile?google_calendar=error&message=${encodeURIComponent(
          "Não recebemos permissão da Google Agenda. Tente conectar de novo."
        )}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/dashboard/profile?google_calendar=error&message=${encodeURIComponent(
      "Não foi possível conectar a Google Agenda. Tente novamente."
    )}`
  );
}
