import Link from "next/link";
import { forgotPassword } from "./actions";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-header flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/login">
            <h1 className="font-display text-4xl italic text-white">
              My<span style={{ color: "#C4A96B" }}>Asset</span>
            </h1>
          </Link>
          <p className="text-xs tracking-[0.3em] uppercase text-ink-3 mt-3">
            Recuperar senha
          </p>
        </div>

        <div className="bg-card rounded-card  p-8">
          <p className="text-sm text-ink-2 mb-6 leading-relaxed">
            Digite o e-mail da sua conta. Vamos enviar um link para você criar
            uma nova senha.
          </p>

          <form action={forgotPassword} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Enviar link de recuperação
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-xs text-ink-3 hover:text-forest transition-colors uppercase tracking-wider"
            >
              ← Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
