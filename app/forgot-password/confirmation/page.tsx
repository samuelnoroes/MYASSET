import Link from "next/link";

export default function ForgotPasswordConfirmationPage() {
  return (
    <main className="min-h-screen bg-header flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/login">
            <h1 className="font-display text-4xl italic text-white">
              My<span style={{ color: "#C4A96B" }}>Asset</span>
            </h1>
          </Link>
        </div>

        <div className="bg-card rounded-card  p-8 text-center">
          <p className="text-4xl mb-5">📧</p>
          <h2 className="text-lg font-bold text-ink mb-3">
            Verifique seu e-mail
          </h2>
          <p className="text-sm text-ink-2 leading-relaxed mb-6">
            Se este e-mail estiver cadastrado, você receberá um link para
            redefinir sua senha em instantes. Verifique também a caixa de spam.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
