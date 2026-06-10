import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { propertyId } = await request.json()
    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 })
    }

    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        tool_choice: { type: 'auto' },
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Você é o enriquecedor de dados imobiliários do MyAsset. Recebe dados de um imóvel e busca informações de mercado da região via web_search.

SEMPRE faça web_search antes de responder. Busque:
1. Valor médio do m² no bairro/cidade do imóvel
2. Aluguel médio para imóveis similares
3. Ticket médio de imóveis no bairro
4. Tendência de valorização nos últimos 12 meses

Retorne APENAS JSON puro, sem markdown:
{
 "m2_regional": <number ou null>,
 "aluguel_medio_regional": <number ou null>,
 "ticket_medio_bairro": <number ou null>,
 "tendencia_valorizacao_12m_pct": <number ou null>,
 "current_value_estimado": <number ou null>,
 "fontes": ["url1", "url2"],
 "resumo_mercado": "texto 2-3 linhas"
}

Valores em reais sem R$ e sem pontos de milhar. Nunca invente.`,
        messages: [
          {
            role: 'user',
            content: `Imóvel para enriquecer: ${JSON.stringify({
              nome: property.name,
              endereco: property.address,
              cidade: property.city,
              estado: property.state,
              tipo: property.property_type,
              modalidade: property.modality,
              valor_aquisicao: property.acquisition_value,
              aluguel_mensal: property.monthly_rent,
              valor_atual: property.current_value,
            })}`,
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text()
      return NextResponse.json({ error: 'Claude API error', detail: err }, { status: 500 })
    }

    const claudeData = await anthropicResponse.json()

    const allText = (claudeData.content as Array<{type: string; text?: string}>)
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    let marketData: Record<string, unknown> = {}
    let parseStrategy = 'none'

    const codeBlockMatch = allText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (codeBlockMatch) {
      try { marketData = JSON.parse(codeBlockMatch[1]); parseStrategy = 'code_block' } catch { /* continue */ }
    }

    if (parseStrategy === 'none') {
      const allMatches = [...allText.matchAll(/\{[\s\S]*?\}/g)]
      const sorted = allMatches.map(m => m[0]).sort((a, b) => b.length - a.length)
      for (const candidate of sorted) {
        try {
          const parsed = JSON.parse(candidate)
          if (parsed.m2_regional !== undefined || parsed.resumo_mercado !== undefined) {
            marketData = parsed; parseStrategy = 'largest_valid'; break
          }
        } catch { /* continue */ }
      }
    }

    if (parseStrategy === 'none') {
      const greedy = allText.match(/\{[\s\S]*\}/)
      if (greedy) {
        try { marketData = JSON.parse(greedy[0]); parseStrategy = 'greedy' }
        catch { parseStrategy = 'failed' }
      }
    }

    const finalMarketData = {
      m2_regional: marketData.m2_regional ?? null,
      aluguel_medio_regional: marketData.aluguel_medio_regional ?? null,
      ticket_medio_bairro: marketData.ticket_medio_bairro ?? null,
      tendencia_valorizacao_12m_pct: marketData.tendencia_valorizacao_12m_pct ?? null,
      fontes: (marketData.fontes as string[]) || [],
      resumo_mercado: (marketData.resumo_mercado as string) || '',
      enriched_at: new Date().toISOString(),
      parse_strategy: parseStrategy,
      ...(marketData.current_value_estimado ? { current_value_estimado_origem: 'web_search' } : {}),
    }

    const updatePayload: Record<string, unknown> = { market_data: finalMarketData }
    if (!property.current_value && marketData.current_value_estimado) {
      updatePayload.current_value = marketData.current_value_estimado
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${propertyId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(updatePayload),
      }
    )

    if (!updateRes.ok) {
      const err = await updateRes.text()
      return NextResponse.json({ error: 'Supabase update error', detail: err }, { status: 500 })
    }

    return NextResponse.json({ success: true, market_data: finalMarketData })
  } catch (err) {
    console.error('[enrich-property]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
