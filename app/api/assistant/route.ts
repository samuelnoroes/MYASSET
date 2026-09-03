// app/api/assistant/route.ts
//
// API interna do assistente MyAsset.
// Permite que integrações externas (n8n, automações) consultem e alterem
// os dados do corretor, identificado pelo número de WhatsApp.
// O bot conversacional do WhatsApp vive em /api/whatsapp/webhook e usa
// exatamente as mesmas ações (app/lib/assistantActions.ts).
//
// Autenticação: header "x-assistant-secret" deve bater com ASSISTANT_API_SECRET.
// Corpo: { "phone": "5585999999999", "action": "<ação>", "params": { ... } }

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ASSISTANT_ACTIONS, buildCtxForPhone } from "@/app/lib/assistantActions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_SECRET = process.env.ASSISTANT_API_SECRET;

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    if (!API_SECRET) {
      return bad("ASSISTANT_API_SECRET não configurado no servidor.", 503);
    }
    if (request.headers.get("x-assistant-secret") !== API_SECRET) {
      return bad("Não autorizado.", 401);
    }

    const body = await request.json().catch(() => null);
    const phone = String(body?.phone || "");
    const action = String(body?.action || "");
    if (!phone) return bad("Informe o telefone do corretor (phone).");
    if (!ASSISTANT_ACTIONS[action]) {
      return bad(`Ação inválida. Disponíveis: ${Object.keys(ASSISTANT_ACTIONS).join(", ")}.`);
    }

    const db = createServiceClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const resolved = await buildCtxForPhone(db, phone);
    if ("error" in resolved) return bad(resolved.error, 404);

    const result = await ASSISTANT_ACTIONS[action](resolved.ctx, body?.params ?? {});
    return NextResponse.json({ ok: true, action, ...result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro interno.";
    return bad(message, 400);
  }
}
