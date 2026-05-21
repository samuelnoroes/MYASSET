import Link from "next/link";
import { login, signup } from "./actions";
import GoogleLoginButton from "./_components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-header flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="font-display text-4xl italic text-white">
              My<span style={{ color: "#6BA68A" }}>Asset</span>
            </h1>
          </Link>
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mt-3">
            Acesse sua conta
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-card rounded-card shadow-card-md p-8">
          {/* Google */}
          <div className="mb-6">
            <GoogleLoginButton />
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs uppercase tracking-wider text-ink-3">
              ou com e-mail
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form className="space-y-4">
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
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-ink-2"
                >
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-ink-3 hover:text-forest transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                formAction={login}
                className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
              >
                Entrar
              </button>
              <button
                formAction={signup}
                className="w-full py-3 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded"
              >
                Criar conta
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
