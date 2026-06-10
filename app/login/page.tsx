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
              My<span style={{ color: "#C4A96B" }}>Asset</span>
            </h1>
          </Link>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-forest mt-3">
            Acesso
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-card border border-border rounded-card p-8">
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
                className="block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-3 mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-card-2 border border-border rounded-lg focus:border-moss focus:outline-none transition-colors text-ink text-[15px] font-light"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-3"
                >
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-forest hover:text-forest-light transition-colors"
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
                className="w-full px-4 py-3.5 bg-card-2 border border-border rounded-lg focus:border-moss focus:outline-none transition-colors text-ink text-[15px] font-light"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                formAction={login}
                className="w-full py-3.5 bg-forest text-[#0C0D0F] font-semibold tracking-[0.06em] uppercase text-[13px] hover:bg-forest-light transition-colors rounded-lg"
              >
                Entrar
              </button>
              <button
                formAction={signup}
                className="w-full py-3.5 bg-transparent border border-border text-ink-2 font-medium tracking-[0.04em] text-[13px] hover:border-moss hover:text-ink transition-colors rounded-lg"
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
