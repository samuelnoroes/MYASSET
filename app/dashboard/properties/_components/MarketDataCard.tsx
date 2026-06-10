'use client'

import { useState } from 'react'

interface MarketData {
  m2_regional: number | null
  aluguel_medio_regional: number | null
  ticket_medio_bairro: number | null
  tendencia_valorizacao_12m_pct: number | null
  fontes: string[]
  resumo_mercado: string
  enriched_at: string
  parse_strategy?: string
  current_value_estimado_origem?: string
}

interface MarketDataCardProps {
  propertyId: string
  propertyName: string
  acquisitionValue: number | null
  currentValue: number | null
  monthlyRent: number | null
  marketData: MarketData | null
}

function fmt(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtPct(value: number | null): string {
  if (value == null) return '—'
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default function MarketDataCard({
  propertyId,
  acquisitionValue,
  currentValue,
  monthlyRent,
  marketData,
}: MarketDataCardProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MarketData | null>(marketData)
  const [error, setError] = useState<string | null>(null)

  async function handleEnrich() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/enrich-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enriquecer')
      setData(json.market_data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const enrichedDate = data?.enriched_at
    ? new Date(data.enriched_at).toLocaleDateString('pt-BR')
    : null

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title">Inteligência de Mercado</h2>
          {enrichedDate && (
            <p className="text-xs text-ink-3 mt-0.5">Atualizado em {enrichedDate}</p>
          )}
        </div>
        <button
          onClick={handleEnrich}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-forest text-white text-sm font-medium rounded-lg hover:bg-forest-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Buscando...
            </>
          ) : data ? (
            'Atualizar dados'
          ) : (
            'Buscar dados de mercado'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-negative">
          {error}
        </div>
      )}

      {!data ? (
        <div className="text-center py-8 text-ink-3">
          <svg className="mx-auto h-10 w-10 mb-3 text-moss" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium text-ink-2 mb-1">Sem dados de mercado ainda</p>
          <p className="text-xs">Clique em &quot;Buscar dados de mercado&quot; para enriquecer este imóvel com informações da região.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-ink-3 font-medium">Indicador</th>
                  <th className="text-right py-2 text-ink-3 font-medium">Seu imóvel</th>
                  <th className="text-right py-2 text-ink-3 font-medium">Mercado regional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2.5 text-ink-2">Aluguel mensal</td>
                  <td className="py-2.5 text-right font-medium text-ink">{fmt(monthlyRent)}</td>
                  <td className="py-2.5 text-right font-medium text-ink">{fmt(data.aluguel_medio_regional)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-ink-2">Valor do m²</td>
                  <td className="py-2.5 text-right font-medium text-ink">—</td>
                  <td className="py-2.5 text-right font-medium text-ink">{fmt(data.m2_regional)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-ink-2">Ticket médio (bairro)</td>
                  <td className="py-2.5 text-right font-medium text-ink">{fmt(currentValue ?? acquisitionValue)}</td>
                  <td className="py-2.5 text-right font-medium text-ink">{fmt(data.ticket_medio_bairro)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-ink-2">Valorização 12M</td>
                  <td className="py-2.5 text-right font-medium text-ink">—</td>
                  <td className={`py-2.5 text-right font-medium ${
                    data.tendencia_valorizacao_12m_pct != null
                      ? data.tendencia_valorizacao_12m_pct >= 0 ? 'text-positive' : 'text-negative'
                      : 'text-ink'
                  }`}>
                    {fmtPct(data.tendencia_valorizacao_12m_pct)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {data.resumo_mercado && (
            <p className="text-sm text-ink-2 leading-relaxed mb-4">{data.resumo_mercado}</p>
          )}

          {data.fontes && data.fontes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.fontes.map((url, i) => {
                try {
                  const hostname = new URL(url).hostname.replace('www.', '')
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-forest hover:underline bg-surface px-2 py-1 rounded">
                      {hostname}
                    </a>
                  )
                } catch { return null }
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
