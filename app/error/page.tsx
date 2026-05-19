import Link from "next/link";

type ErrorPageProps = {
  searchParams: { message?: string };
};

export default function ErrorPage({ searchParams }: ErrorPageProps) {
  const message = searchParams.message
    ? decodeURIComponent(searchParams.message)
    : "Erro não identificado.";

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="card text-center py-12">
          <p className="text-5xl mb-6">⚠️</p>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3">
            Algo deu errado
          </p>
          <h1 className="text-2xl font-bold text-ink mb-6">
            Não foi possível continuar
          </h1>
          <div className="bg-surface rounded px-4 py-3 mb-8 text-left">
            <p className="text-sm font-mono text-ink-2 break-words">{message}</p>
          </div>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
