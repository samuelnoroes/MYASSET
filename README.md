# MyAsset

Plataforma de gestão de portfólio imobiliário para investidores.

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
- [ ] Sprint 1b — Auth (login/cadastro)
- [ ] Sprint 1c — Cadastro de imóveis
- [ ] Sprint 2 — Dashboard com KPIs
- [ ] Sprint 3 — Lançamento de transações
- [ ] Sprint 4 — Integração WhatsApp
- [ ] Sprint 5 — Polimento
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
