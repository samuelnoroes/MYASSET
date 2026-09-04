// Integração com a Google Calendar API — cria/atualiza/cancela o evento de
// visita na agenda pessoal do corretor, quando ele tem a conta conectada
// (google_calendar_tokens). Toda função aqui é "best effort": se algo der
// errado (token revogado, sem credencial configurada, API fora do ar), a
// falha é logada e engolida — o agendamento no MyAsset nunca deve quebrar
// por causa da integração com o Google.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[googleCalendar] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados.");
    return null;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    console.error("[googleCalendar] falha ao renovar access token:", await res.text());
    return null;
  }

  const data = (await res.json()) as { access_token?: string };
  return data.access_token || null;
}

export type VisitCalendarEvent = {
  propertyName: string;
  address: string | null;
  visitorName: string;
  visitorPhone: string | null;
  notes: string | null;
  scheduledAt: string; // ISO
};

function buildEventBody(event: VisitCalendarEvent) {
  const start = new Date(event.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1h

  const descriptionLines = [`Interessado: ${event.visitorName}`];
  if (event.visitorPhone) descriptionLines.push(`Telefone: ${event.visitorPhone}`);
  if (event.notes) descriptionLines.push(`Obs: ${event.notes}`);
  descriptionLines.push("", "Agendado via MyAsset");

  return {
    summary: `Visita — ${event.propertyName} · ${event.visitorName}`,
    location: event.address || undefined,
    description: descriptionLines.join("\n"),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
}

/** Cria o evento na agenda do corretor. Retorna o id do evento, ou null se falhou. */
export async function createCalendarEvent(
  refreshToken: string,
  event: VisitCalendarEvent
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken(refreshToken);
    if (!accessToken) return null;

    const res = await fetch(EVENTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEventBody(event)),
    });

    if (!res.ok) {
      console.error("[googleCalendar] falha ao criar evento:", await res.text());
      return null;
    }

    const data = (await res.json()) as { id?: string };
    return data.id || null;
  } catch (e) {
    console.error("[googleCalendar] erro inesperado ao criar evento:", e);
    return null;
  }
}

/** Apaga o evento da agenda do corretor. Não lança em caso de erro. */
export async function deleteCalendarEvent(refreshToken: string, eventId: string): Promise<void> {
  try {
    const accessToken = await getAccessToken(refreshToken);
    if (!accessToken) return;

    const res = await fetch(`${EVENTS_URL}/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 410 Gone = já tinha sido apagado (ex.: direto na Agenda) — não é erro.
    if (!res.ok && res.status !== 410 && res.status !== 404) {
      console.error("[googleCalendar] falha ao apagar evento:", await res.text());
    }
  } catch (e) {
    console.error("[googleCalendar] erro inesperado ao apagar evento:", e);
  }
}
