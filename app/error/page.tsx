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
    <main className="min-h-screen bg-[#f4f1ea] flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-[#8a9a90]">
          Algo deu errado
        </p>

        <h1 className="font-serif text-5xl text-[#1f1f1f]">
          Não foi possível continuar
        </h1>

        <p className="mt-6 text-sm leading-6 text-[#7d7d7d]">
          {message}
        </p>

        <Link
          href="/login"
          className="mt-10 inline-flex h-14 items-center justify-center bg-[#2f5a46] px-8 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#1f1f1f]"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
