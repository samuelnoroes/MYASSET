# MyAsset

Plataforma de gestão de carteira imobiliária para corretores — visitas, metas de VGV e ficha de imóvel compartilhável. (A versão anterior, focada em investidores, está preservada na branch `versao-investidor`.)

## Stack

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS
- **Backend:** Supabase (banco + auth + RLS)
- **Hospedagem:** Vercel
- **Automação WhatsApp:** n8n + Evolution API (futuro)

## Status atual

- [x] Sprint 0 — Schema do banco no Supabase
- [x] Sprint 1a — Landing inicial deployada
- [x] Sprint 1b — Auth com email/senha funcionando
- [x] Sprint 1c — Cadastro de imóveis + dashboard com KPIs
- [ ] Sprint 2 — Lançamentos (receitas/despesas) manuais
- [ ] Sprint 3 — Página detalhada do imóvel + edição
- [ ] Sprint 4 — Integração WhatsApp (n8n + Evolution API)
- [ ] Sprint 5 — Polimento + onboarding
- [ ] Sprint 6 — Lançamento

## Setup local (opcional, requer Node.js)

```bash
npm install
cp .env.local.example .env.local
# preencha as variáveis em .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Deploy

Deploy automático via Vercel a cada push na branch `main`.

## Variáveis de ambiente necessárias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (rotas de API server-side)
- `ANTHROPIC_API_KEY` (cérebro do bot WhatsApp)
- `WHATSAPP_WEBHOOK_SECRET` (protege `/api/whatsapp/webhook`; opcional mas recomendado)
- `ASSISTANT_API_SECRET` (segredo do endpoint `/api/assistant` para integrações)
- `WAHA_URL`, `WAHA_API_KEY`, `WAHA_SESSION` (servidor WhatsApp; têm padrão no código)

## Modo imobiliária (multi-tenant)

- O gestor cria a imobiliária no **Perfil** e recebe um **código de convite**; corretores entram informando o código (no onboarding ou no Perfil).
- Todo corretor **vê** o portfólio da imobiliária inteira, mas só **edita** os imóveis que captou; o gestor edita tudo (RLS no Supabase).
- `/admin` é o **console do gestor**: meta geral do mês (consolidada com as vendas de todos), desempenho e edição do perfil de cada corretor.
- A meta geral absorve automaticamente cada venda registrada (`deals`) pelos corretores da imobiliária.

## Bot WhatsApp (`POST /api/whatsapp/webhook`)

O assistente conversacional roda **dentro do app** — não depende de n8n.

- O corretor vincula o número em **app > WhatsApp** (`/api/whatsapp/optin`, grava
  `whatsapp_number` e `paired_at`).
- O WAHA entrega as mensagens recebidas neste webhook; configure a URL
  `https://www.myasset.tech/api/whatsapp/webhook` no evento `message`
  (com header `x-webhook-secret` ou `?secret=` se `WHATSAPP_WEBHOOK_SECRET` estiver setado).
- O corretor é identificado pelo número pareado; o Claude responde usando as ações do
  assistente (`app/lib/assistantActions.ts`) e a resposta volta via WAHA `sendText`.
- Mensagens duplicadas são descartadas (`wa_processed_msgs`), o histórico fica em
  `whatsapp_messages` e o consumo respeita o limite mensal do plano (`whatsapp_usage`).

## API do assistente (`POST /api/assistant`)

Mesmas ações do bot, expostas para integrações externas (automações, n8n).

- Header: `x-assistant-secret: $ASSISTANT_API_SECRET`
- Corpo: `{ "phone": "5585999999999", "action": "...", "params": { ... } }`
- Ações: `get_portfolio` (scope mine/agency, filtros status/purpose), `get_property`,
  `get_share_message` (ficha pronta do imóvel), `get_visits`, `get_goals`,
  `schedule_visit`, `complete_visit`, `cancel_visit`, `register_deal`,
  `update_property` (campos whitelisted), `set_personal_goal`.

## Estrutura

```
app/
├── page.tsx                   # Landing pública
├── login/                     # Auth (email/senha)
├── error/                     # Página de erro com mensagem
└── dashboard/                 # Área logada
    ├── page.tsx               # KPIs gerais
    └── properties/            # Gestão de imóveis
        ├── page.tsx           # Lista
        ├── new/page.tsx       # Cadastro
        └── actions.ts         # createProperty / deleteProperty
utils/supabase/                # Clients do Supabase (browser/server/middleware)
middleware.ts                  # Refresh de sessão + proteção de rotas
```
