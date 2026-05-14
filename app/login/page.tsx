import { auth } from "./actions";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-serif text-[#1f1f1f]">
            My<span className="italic text-[#2f5a46]">Asset</span>
          </h1>

          <p className="mt-8 text-xs tracking-[0.4em] text-[#8a9a90] uppercase">
            Acesse sua conta
          </p>
        </div>

        <form action={auth} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-xs uppercase tracking-wider text-[#7d7d7d]"
            >
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full h-14 px-4 bg-white border border-[#2f5a46] text-[#1f1f1f] outline-none focus:ring-1 focus:ring-[#2f5a46]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-xs uppercase tracking-wider text-[#7d7d7d]"
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
              className="w-full h-14 px-4 bg-white border border-[#d8d3ca] text-[#1f1f1f] outline-none focus:ring-1 focus:ring-[#2f5a46]"
            />

            <p className="mt-2 text-xs text-[#a0a0a0]">
              Mínimo 6 caracteres
            </p>
          </div>

          <div className="pt-5 space-y-3">
            <button
              type="submit"
              name="mode"
              value="login"
              className="w-full h-14 bg-[#2f5a46] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#1f1f1f] transition-colors"
            >
              Entrar
            </button>

            <button
              type="submit"
              name="mode"
              value="signup"
              className="w-full h-14 bg-transparent border border-[#d8d3ca] text-[#1f1f1f] text-xs uppercase tracking-widest font-medium hover:border-[#2f5a46] hover:text-[#2f5a46] transition-colors"
            >
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
