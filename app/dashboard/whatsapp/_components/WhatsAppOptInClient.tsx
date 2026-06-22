"use client"

import { useState, useEffect, useRef } from "react"

interface Props {
  accountStatus: string
  whatsappNumber: string | null
  pairedAt: string | null
}

// --- Helpers ----------------------------------------------------------------

function formatDisplayPhone(raw: string | null): string {
  if (!raw) return ""
  const d = raw.replace(/\D/g, "")
  const local = d.startsWith("55") ? d.slice(2) : d
  if (local.length === 11) return `(${local.slice(0,2)}) ${local.slice(2,7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0,2)}) ${local.slice(2,6)}-${local.slice(6)}`
  return raw
}

function applyMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// --- Typewriter hook ---------------------------------------------------------

function useTypewriter(target: string, active: boolean, speed = 55) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active || !target) return
    setDisplayed("")
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(target.slice(0, i))
      if (i >= target.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [target, active, speed])

  return { displayed, done }
}

// --- Chat bubble component ----------------------------------------------------

function Bubble({ role, text, delay }: { role: "user" | "bot"; text: string; delay: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const isUser = role === "user"
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} transition-all duration-300`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}
    >
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
          isUser
            ? "bg-forest text-white rounded-br-sm"
            : "bg-white text-ink border border-border rounded-bl-sm shadow-sm"
        }`}
      >
        {text}
      </div>
    </div>
  )
}

const EXAMPLES = [
  { role: "user" as const, text: "Quanto rende meu portfolio?" },
  { role: "bot"  as const, text: "Seu yield medio esta em 9,3% a.a. O Apt Leblon puxa mais: 11,2%." },
  { role: "user" as const, text: "Tem cobranca em atraso?" },
  { role: "bot"  as const, text: "Sim — Carlos Silva, R$ 2.800, 14 dias de atraso. Quer que eu mande uma mensagem?" },
]

// --- Main component ----------------------------------------------------------

export default function WhatsAppOptInClient({ accountStatus, whatsappNumber, pairedAt }: Props) {
  const alreadyActive = accountStatus === "active" && !!whatsappNumber

  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(alreadyActive)
  const [linkedPhone, setLinkedPhone] = useState(whatsappNumber)
  const [linkedAt, setLinkedAt] = useState(pairedAt)
  const [showBubbles, setShowBubbles] = useState(alreadyActive)

  const inputRef = useRef<HTMLInputElement>(null)

  const displayPhone = formatDisplayPhone(linkedPhone)
  const { displayed: typedPhone, done: typeDone } = useTypewriter(displayPhone, success)

  useEffect(() => {
    if (typeDone) {
      const t = setTimeout(() => setShowBubbles(true), 300)
      return () => clearTimeout(t)
    }
  }, [typeDone])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/whatsapp/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao vincular. Tente novamente.")
        return
      }
      setLinkedPhone(data.whatsapp_number)
      setLinkedAt(new Date().toISOString())
      setSuccess(true)
    } catch {
      setError("Erro de conexao. Verifique sua internet.")
    } finally {
      setLoading(false)
    }
  }

  // Estado de sucesso

  if (success) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm">

        <div className="bg-forest px-6 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-moss text-xs font-medium tracking-widest uppercase mb-2">
                WhatsApp
              </p>
              <p className="text-white text-3xl font-bold leading-none">
                Conectado.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-positive bg-positive/20 flex items-center justify-center shrink-0 mt-1">
              <svg className="w-5 h-5 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="font-mono text-2xl text-white tracking-tight min-h-[36px]">
            {typedPhone}
            {!typeDone && (
              <span className="inline-block w-0.5 h-6 bg-moss ml-0.5 animate-pulse align-middle" />
            )}
          </div>
          {linkedAt && typeDone && (
            <p className="text-moss text-xs mt-1.5">
              Vinculado em {formatDate(linkedAt)}
            </p>
          )}
        </div>

        <div className="bg-surface px-5 py-5">
          <p className="text-xs font-medium text-ink-3 uppercase tracking-widest mb-4">
            Veja como funciona
          </p>
          <div className="space-y-2">
            {showBubbles && EXAMPLES.map((ex, i) => (
              <Bubble key={i} role={ex.role} text={ex.text} delay={i * 420} />
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-ink-3">
              Fale com o assistente:{" "}
              <a
                href="https://wa.me/5511987266842"
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest font-medium underline underline-offset-2"
              >
                (11) 98726-6842
              </a>
            </p>
            <button
              onClick={() => {
                setSuccess(false)
                setPhone("")
                setError(null)
                setTimeout(() => inputRef.current?.focus(), 100)
              }}
              className="text-xs text-ink-3 hover:text-ink transition-colors underline underline-offset-2"
            >
              Trocar numero
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estado de ativacao

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm">

      <div className="bg-forest px-6 py-8">
        <p className="text-moss text-xs font-medium tracking-widest uppercase mb-3">
          Ultimo passo
        </p>
        <h2 className="text-white text-2xl font-bold leading-tight">
          Seu portfolio,<br />agora no WhatsApp.
        </h2>
        <p className="text-moss text-sm mt-3 leading-relaxed">
          Digite o numero, receba a boas-vindas e comece a consultar seu patrimonio em segundos.
        </p>
      </div>

      <div className="bg-white px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-ink-2 uppercase tracking-wide mb-2">
              Numero WhatsApp
            </label>
            <div className="flex items-center border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-forest/30 focus-within:border-forest transition-all">
              <span className="px-4 py-3.5 text-ink-2 font-mono text-sm bg-surface border-r border-border select-none shrink-0">
                +55
              </span>
              <input
                ref={inputRef}
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(applyMask(e.target.value))}
                placeholder="(11) 99999-9999"
                className="flex-1 px-4 py-3.5 text-ink font-mono text-base placeholder:text-ink-3 focus:outline-none bg-white"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-ink-3 mt-1.5">Apenas Brasil. Use o numero com WhatsApp ativo.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-negative/5 border border-negative/20 px-4 py-3 text-sm text-negative">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || phone.replace(/\D/g, "").length < 10}
            className="w-full py-3.5 rounded-xl bg-forest text-white font-semibold text-sm hover:bg-forest-light active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Conectando...
              </span>
            ) : "Conectar"}
          </button>
        </form>
      </div>

      <div className="bg-surface border-t border-border px-6 py-5">
        <p className="text-xs font-medium text-ink-3 uppercase tracking-widest mb-4">
          Veja como funciona
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((ex, i) => (
            <Bubble key={i} role={ex.role} text={ex.text} delay={i * 120} />
          ))}
        </div>
      </div>

    </div>
  )
}
