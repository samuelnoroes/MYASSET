import Link from "next/link";
import { login, signup } from "./actions";
import GoogleLoginButton from "./_components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-8">
            <h1 className="font-display text-5xl text-ink">
              My<span className="italic text-forest">Asset</span>
            </h1>
          </Link>
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60">
            Acesse sua conta
          </p>
        </div>

        {/* Login com Google */}
        <div className="mb-6">
          <GoogleLoginButton />
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-ink/10" />
          <span className="text-[10px] uppercase tracking-wider text-ink/40">
            ou com e-mail
          </span>
          <div className="flex-1 h-px bg-ink/10" />
        </div>

        {/* Login com email */}
        <form className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
            />
            <p className="text-[10px] text-ink/40 mt-2">Mínimo 6 caracteres</p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              formAction={login}
              className="w-full py-3 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Entrar
            </button>
            <button
              formAction={signup}
              className="w-full py-3 bg-transparent border border-ink/20 text-ink font-medium tracking-wider uppercase text-xs hover:border-forest hover:text-forest transition-colors"
            >
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
