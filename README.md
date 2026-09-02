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
- `ASSISTANT_API_SECRET` (segredo do endpoint `/api/assistant` usado pelo bot WhatsApp)

## Modo imobiliária (multi-tenant)

- O gestor cria a imobiliária no **Perfil** e recebe um **código de convite**; corretores entram informando o código (no onboarding ou no Perfil).
- Todo corretor **vê** o portfólio da imobiliária inteira, mas só **edita** os imóveis que captou; o gestor edita tudo (RLS no Supabase).
- `/admin` é o **console do gestor**: meta geral do mês (consolidada com as vendas de todos), desempenho e edição do perfil de cada corretor.
- A meta geral absorve automaticamente cada venda registrada (`deals`) pelos corretores da imobiliária.

## API do assistente WhatsApp (`POST /api/assistant`)

Endpoint interno para o bot (n8n + Evolution/WAHA) operar o app em nome do corretor,
identificado pelo número de WhatsApp.

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
