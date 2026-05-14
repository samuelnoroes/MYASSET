import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Detalhe visual sutil — linha fina horizontal */}
      <div className="absolute top-12 left-0 right-0 flex justify-center">
        <div className="w-12 h-px bg-ink/20" />
      </div>

      <div className="text-center max-w-2xl relative z-10">
        <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-10 font-sans">
          Gestão de portfólio imobiliário
        </p>

        <h1 className="font-display text-7xl md:text-9xl text-ink leading-none mb-8">
          My<span className="italic text-forest">Asset</span>
        </h1>

        <p className="font-sans text-base md:text-lg text-ink/70 max-w-md mx-auto leading-relaxed mb-12">
          A clareza que o investidor imobiliário sempre quis sobre o próprio
          patrimônio.
        </p>

        <Link
          href="/login"
          className="inline-block px-8 py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
        >
          Entrar
        </Link>
      </div>

      {/* Rodapé minimalista */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-ink/40">
          Versão beta
        </p>
      </div>
    </main>
  );
}
