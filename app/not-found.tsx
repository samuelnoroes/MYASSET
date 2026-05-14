import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="text-center max-w-md">
        <p className="font-display text-[8rem] leading-none text-ink/8 mb-4 select-none">
          404
        </p>
        <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-4">
          Página não encontrada
        </p>
        <h1 className="font-display text-4xl text-ink mb-6">
          Esse endereço não existe
        </h1>
        <p className="text-sm text-ink/60 mb-10 leading-relaxed">
          Pode ser que o link esteja errado ou a página tenha sido removida.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
