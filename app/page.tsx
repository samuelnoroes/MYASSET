export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Detalhe visual sutil — linha fina horizontal */}
      <div className="absolute top-12 left-0 right-0 flex justify-center">
        <div className="w-12 h-px bg-ink/20" />
      </div>

      <div className="text-center max-w-2xl relative z-10">
        <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-10 font-sans">
          Em construção
        </p>

        <h1 className="font-display text-7xl md:text-9xl text-ink leading-none mb-8">
          My<span className="italic text-forest">Asset</span>
        </h1>

        <p className="font-sans text-base md:text-lg text-ink/70 max-w-md mx-auto leading-relaxed">
          A clareza que o investidor imobiliário sempre quis sobre o próprio
          patrimônio.
        </p>
      </div>

      {/* Rodapé minimalista */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink/40">
          Em breve
        </p>
      </div>
    </main>
  );
}
