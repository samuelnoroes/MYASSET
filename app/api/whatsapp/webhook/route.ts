// app/api/whatsapp/webhook/route.ts
//
// Bot WhatsApp do MyAsset. O WAHA entrega aqui as mensagens recebidas
// (evento "message"); o corretor é identificado pelo número pareado em
// app > WhatsApp, e o Claude responde usando as ferramentas do assistente.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import {
  ASSISTANT_ACTIONS,
  ASSISTANT_TOOLS,
  buildCtxForPhone,
  onlyDigits,
} from "@/app/lib/assistantActions";
import { getPlanLimits } from "@/app/lib/plans";

export const maxDuration = 120;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WAHA_URL = process.env.WAHA_URL ?? "http://2.25.128.157:3000";
const WAHA_API_KEY = process.env.WAHA_API_KEY ?? "myasset2026";
const WAHA_SESSION = process.env.WAHA_SESSION ?? "default";
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const MODEL = "claude-opus-5";
const MAX_TOOL_ROUNDS = 6;
const HISTORY_TURNS = 12;

async function sendText(chatId: string, text: string) {
  const res = await fetch(`${WAHA_URL}/api/sendText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": WAHA_API_KEY },
    body: JSON.stringify({ chatId, text, session: WAHA_SESSION }),
  });
  if (!res.ok) {
    console.error("[wa/webhook] falha ao enviar:", await res.text());
  }
}

function systemPrompt(profile: {
  full_name: string | null;
  creci: string | null;
  agency_name: string | null;
  agency_role: string | null;
}) {
  const hoje = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    dateStyle: "full",
    timeStyle: "short",
  });
  const papel = profile.agency_role === "gestor" ? "gestor" : "corretor";
  const imob = profile.agency_name ? ` da imobiliária ${profile.agency_name}` : "";

  return `Você é o assistente do MyAsset, o app de gestão de carteira imobiliária, e conversa pelo WhatsApp com ${profile.full_name || "o corretor"}, ${papel}${imob}.

Agora é ${hoje} (horário de Fortaleza).

Seu papel: operar o app por ele. Use as ferramentas para consultar e alterar de verdade os dados — carteira de imóveis, agenda de visitas, fechamentos e metas. Nunca invente números: se precisa de um dado, chame a ferramenta.

Como se comunicar no WhatsApp:
- Português brasileiro, direto e cordial, como um colega de trabalho competente.
- Respostas curtas. Nada de markdown pesado: use *negrito* do WhatsApp com moderação, quebras de linha e no máximo listas com "•".
- Valores em reais no formato R$ 920.000. Datas no formato dia/mês.
- Não repita dados que ele já sabe; responda o que foi perguntado.

Regras de operação:
- Os imóveis são identificados por um apelido curto (nickname), ex.: "sintra203". Se ele descrever o imóvel por outro nome, use get_portfolio para achar o apelido certo antes de agir.
- Antes de qualquer alteração relevante (registrar fechamento, marcar imóvel como fechado, atualizar valores, definir meta), confirme com ele em uma frase e só execute depois do "pode" / "isso" / "confirma".
- Para agendar visita, precisa do apelido do imóvel, do nome do interessado e da data/hora. Converta expressões como "amanhã às 15h" para o formato YYYY-MM-DDTHH:mm usando a data de hoje acima.
- Quando ele pedir a ficha ou os dados de um imóvel para mandar a um cliente, use get_share_message e devolva a mensagem pronta, sem alterar o texto, para ele encaminhar.
- Se uma ferramenta retornar erro, explique em linguagem simples o que faltou.
- Você só enxerga a carteira dele e o portfólio da imobiliária dele.`;
}

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_KEY) {
      console.error("[wa/webhook] ANTHROPIC_API_KEY ausente");
      return NextResponse.json({ ok: false, error: "assistente não configurado" }, { status: 503 });
    }
    if (WEBHOOK_SECRET) {
      const provided =
        request.headers.get("x-webhook-secret") ??
        request.nextUrl.searchParams.get("secret");
      if (provided !== WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false, error: "não autorizado" }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => null);
    const event = body?.event ?? body?.type;
    const payload = body?.payload ?? body?.data ?? body;

    // Só processa mensagens recebidas de conversa individual
    if (event && event !== "message" && event !== "message.any") {
      return NextResponse.json({ ok: true, ignored: `evento ${event}` });
    }
    if (payload?.fromMe) return NextResponse.json({ ok: true, ignored: "própria mensagem" });

    const chatId: string = String(payload?.from ?? payload?.chatId ?? "");
    if (!chatId || chatId.endsWith("@g.us") || chatId.includes("status@")) {
      return NextResponse.json({ ok: true, ignored: "grupo/status" });
    }

    const text: string = String(payload?.body ?? payload?.text ?? "").trim();
    const messageId: string = String(payload?.id ?? payload?.messageId ?? "");
    const phone = onlyDigits(chatId.split("@")[0]);

    const db = createServiceClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // Dedupe — o WAHA pode reentregar o mesmo evento
    if (messageId) {
      const { error: dupErr } = await db.from("wa_processed_msgs").insert({ id: messageId });
      if (dupErr) return NextResponse.json({ ok: true, ignored: "duplicada" });
    }

    if (!text) {
      await sendText(chatId, "Recebi sua mensagem, mas por enquanto só consigo ler texto. Me manda escrito? 🙂");
      return NextResponse.json({ ok: true, ignored: "sem texto" });
    }

    // Identifica o corretor pelo número pareado no app
    const resolved = await buildCtxForPhone(db, phone);
    if ("error" in resolved) {
      await sendText(
        chatId,
        "Não encontrei esse número no MyAsset. Entre no app em *WhatsApp* e vincule este número para eu poder te ajudar. 👋"
      );
      return NextResponse.json({ ok: true, ignored: "número não pareado" });
    }
    const { ctx, profile } = resolved;

    // Limite de mensagens do plano
    const month = new Date().toISOString().slice(0, 7);
    const limits = getPlanLimits(profile.plan ?? undefined);
    const { data: usage } = await db
      .from("whatsapp_usage")
      .select("id, message_count")
      .eq("user_id", ctx.userId)
      .eq("month", month)
      .maybeSingle();
    const used = usage?.message_count ?? 0;
    if (used >= limits.monthlyMessages) {
      await sendText(
        chatId,
        `Você já usou as ${limits.monthlyMessages} mensagens do plano ${limits.label} neste mês. Para continuar falando comigo, faça upgrade em *Meu Plano* no app. 🙂`
      );
      return NextResponse.json({ ok: true, ignored: "limite do plano" });
    }

    // Histórico recente da conversa
    const { data: history } = await db
      .from("whatsapp_messages")
      .select("role, content")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_TURNS);

    const messages: Anthropic.MessageParam[] = (history ?? [])
      .reverse()
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
    messages.push({ role: "user", content: text });

    // Loop de ferramentas
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
    const system = systemPrompt(profile);
    let reply = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system,
        tools: ASSISTANT_TOOLS,
        messages,
      });

      if (response.stop_reason === "refusal") {
        reply = "Não consigo ajudar com isso por aqui. Posso te ajudar com a sua carteira, visitas, fechamentos e metas. 🙂";
        break;
      }

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUses.length === 0) {
        reply = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map(b => b.text)
          .join("\n")
          .trim();
        break;
      }

      messages.push({ role: "assistant", content: response.content });

      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const action = ASSISTANT_ACTIONS[use.name];
        try {
          if (!action) throw new Error(`Ação desconhecida: ${use.name}`);
          const out = await action(ctx, use.input ?? {});
          results.push({
            type: "tool_result",
            tool_use_id: use.id,
            content: JSON.stringify(out),
          });
        } catch (e) {
          results.push({
            type: "tool_result",
            tool_use_id: use.id,
            is_error: true,
            content: e instanceof Error ? e.message : "Erro ao executar a ação.",
          });
        }
      }
      messages.push({ role: "user", content: results });
    }

    if (!reply) {
      reply = "Consegui processar, mas não sei como resumir isso. Pode reformular a pergunta?";
    }

    await sendText(chatId, reply);

    // Persiste conversa e uso
    await db.from("whatsapp_messages").insert([
      { user_id: ctx.userId, role: "user", content: text },
      { user_id: ctx.userId, role: "assistant", content: reply },
    ]);

    if (usage?.id) {
      await db
        .from("whatsapp_usage")
        .update({ message_count: used + 1, updated_at: new Date().toISOString(), last_message_at: new Date().toISOString() })
        .eq("id", usage.id);
    } else {
      await db.from("whatsapp_usage").insert({
        user_id: ctx.userId,
        month,
        message_count: 1,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wa/webhook]", err);
    return NextResponse.json({ ok: false, error: "erro interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "myasset-whatsapp-bot" });
}
