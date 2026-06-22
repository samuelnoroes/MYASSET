// app/api/whatsapp/optin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const WAHA_URL = 'http://2.25.128.157:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY ?? 'myasset2026'
const WAHA_SESSION = 'default'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

function formatPhone(raw: string): string {
  // Remove tudo que não é dígito
  const digits = raw.replace(/\D/g, '')
  // Se já tem código do país (55 + 10 ou 11 dígitos = 12 ou 13)
  if (digits.startsWith('55') && digits.length >= 12) return `${digits}@c.us`
  // Caso contrário, adiciona o 55 (Brasil)
  return `55${digits}@c.us`
}

const WELCOME_MESSAGE = `Olá! Seja bem-vindo(a) ao *MyAsset* 🏠

Sou seu assistente de gestão imobiliária e estou aqui para te ajudar com tudo sobre o seu portfólio.

Você pode me perguntar coisas como:
• "Qual o yield do meu portfólio?"
• "Tem alguma cobrança em atraso?"
• "Quanto vale meu imóvel hoje comparado ao mercado?"
• "Quero cadastrar um imóvel novo"

É só mandar uma mensagem quando quiser. Estou por aqui! 👋`

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Validar body
    const body = await request.json()
    const { phone } = body as { phone?: string }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Número de telefone inválido' }, { status: 400 })
    }

    // 3. Verificar account_status (só pending_onboarding e active podem vincular)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('account_status, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const status = profile.account_status
    if (status === 'pending_payment' || status === 'suspended') {
      return NextResponse.json(
        { error: 'Conta não elegível para vincular WhatsApp' },
        { status: 403 }
      )
    }

    // 4. Formatar número e enviar mensagem de boas-vindas via WAHA
    const chatId = formatPhone(phone)

    const wahaRes = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY,
      },
      body: JSON.stringify({
        chatId,
        text: WELCOME_MESSAGE,
        session: WAHA_SESSION,
      }),
    })

    if (!wahaRes.ok) {
      const wahaErr = await wahaRes.text()
      console.error('[whatsapp/optin] WAHA error:', wahaErr)
      return NextResponse.json(
        { error: 'Falha ao enviar mensagem de boas-vindas', detail: wahaErr },
        { status: 502 }
      )
    }

    // 5. Atualizar user_profiles via service_role (passa pelo trigger de proteção)
    const digits = phone.replace(/\D/g, '')
    const normalizedPhone = digits.startsWith('55') ? digits : `55${digits}`

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          whatsapp_number: normalizedPhone,
          paired_at: new Date().toISOString(),
          account_status: 'active',
        }),
      }
    )

    if (!updateRes.ok) {
      const supaErr = await updateRes.text()
      console.error('[whatsapp/optin] Supabase error:', supaErr)
      return NextResponse.json(
        { error: 'Falha ao ativar conta no banco', detail: supaErr },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      whatsapp_number: normalizedPhone,
      message: 'WhatsApp vinculado com sucesso. Mensagem de boas-vindas enviada!',
    })
  } catch (err) {
    console.error('[whatsapp/optin]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
