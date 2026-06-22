// app/dashboard/whatsapp/page.tsx
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import WhatsAppOptInClient from "./_components/WhatsAppOptInClient"

export default async function WhatsAppPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("account_status, whatsapp_number, paired_at, full_name")
    .eq("id", user.id)
    .single()

  const status = profile?.account_status ?? "pending_payment"

  // Bloqueia quem não deveria estar aqui (dupla garantia além do middleware)
  if (status === "pending_payment" || status === "suspended") {
    redirect("/dashboard/plans")
  }

  return (
    <div className="max-w-xl space-y-2">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">WhatsApp</h1>
        <p className="text-ink-2 text-sm mt-1">
          {status === "active" && profile?.whatsapp_number
            ? "Seu assistente está ativo e pronto para responder."
            : "Vincule seu WhatsApp para acessar o assistente de qualquer lugar."}
        </p>
      </div>

      {/* Banner pending_onboarding: conta paga mas não ativada */}
      {status === "pending_onboarding" && (
        <div className="card p-4 border-l-4 border-warning bg-warning/5 mb-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-warning shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-ink">
                Pagamento confirmado — último passo
              </p>
              <p className="text-xs text-ink-2 mt-0.5">
                Vincule seu WhatsApp para ativar a conta e liberar o assistente.
              </p>
            </div>
          </div>
        </div>
      )}

      <WhatsAppOptInClient
        accountStatus={status}
        whatsappNumber={profile?.whatsapp_number ?? null}
        pairedAt={profile?.paired_at ?? null}
      />
    </div>
  )
}
