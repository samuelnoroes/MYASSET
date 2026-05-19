import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="card text-center py-12">
          <p className="text-8xl font-bold text-border mb-6 select-none">404</p>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-3 mb-3">
            Página não encontrada
          </p>
          <h1 className="text-2xl font-bold text-ink mb-4">
            Esse endereço não existe
          </h1>
          <p className="text-sm text-ink-2 mb-8">
            Pode ser que o link esteja errado ou a página tenha sido removida.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
