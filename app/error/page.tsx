import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="text-center max-w-md">
        <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-6">
          Algo deu errado
        </p>
        <h1 className="font-display text-5xl text-ink mb-6">
          Não foi possível continuar
        </h1>
        <p className="text-sm text-ink/70 mb-10 leading-relaxed">
          Verifique suas credenciais ou tente novamente em alguns instantes. Se
          o problema persistir, talvez o e-mail já esteja cadastrado.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
