import Link from "next/link";

type ErrorPageProps = {
  searchParams: {
    message?: string;
  };
};

export default function ErrorPage({ searchParams }: ErrorPageProps) {
  const message = searchParams.message
    ? decodeURIComponent(searchParams.message)
    : "Erro não identificado.";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="text-center max-w-xl">
        <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-6">
          Algo deu errado
        </p>
        <h1 className="font-display text-5xl text-ink mb-6">
          Não foi possível continuar
        </h1>
        <p className="text-sm text-ink/70 mb-3 leading-relaxed">
          Detalhe do erro:
        </p>
        <p className="text-sm text-forest mb-10 font-mono bg-white border border-ink/10 p-4 break-words text-left">
          {message}
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
