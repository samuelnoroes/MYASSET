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
