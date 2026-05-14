import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Property = {
  id: string;
  name: string;
  current_value: number | null;
  acquisition_value: number | null;
  monthly_rent: number | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, current_value, acquisition_value, monthly_rent")
    .order("created_at", { ascending: false });

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  const propertyList = (properties || []) as Property[];

  const totalCurrentValue = propertyList.reduce(
    (sum, property) => sum + Number(property.current_value || 0),
    0
  );

  const totalAcquisitionValue = propertyList.reduce(
    (sum, property) => sum + Number(property.acquisition_value || 0),
    0
  );

  const totalMonthlyRent = propertyList.reduce(
    (sum, property) => sum + Number(property.monthly_rent || 0),
    0
  );

  const appreciation =
    totalAcquisitionValue > 0
      ? ((totalCurrentValue - totalAcquisitionValue) /
          totalAcquisitionValue) *
        100
      : 0;

  return (
    <main className="min-h-screen bg-[#f4f1ea]">
      <header className="border-b border-[#d8d3ca] px-6 py-7">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="font-serif text-2xl text-[#1f1f1f]">
            My<span className="italic text-[#2f5a46]">Asset</span>
          </Link>

          <Link
            href="/login"
            className="text-xs uppercase tracking-[0.25em] text-[#7d7d7d] hover:text-[#2f5a46]"
          >
            Sair
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#8a9a90]">
              Bem-vindo
            </p>

            <h1 className="font-serif text-6xl text-[#1f1f1f]">
              Seu portfólio
            </h1>

            <p className="mt-5 text-lg text-[#7d7d7d]">{user.email}</p>
          </div>

          <Link
            href="/dashboard/properties/new"
            className="flex h-12 items-center justify-center bg-[#2f5a46] px-6 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#1f1f1f]"
          >
            Cadastrar imóvel
          </Link>
        </div>

        <div className="mb-12 grid gap-5 md:grid-cols-4">
          <div className="border border-[#d8d3ca] bg-[#f8f5ef] p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#8a9a90]">
              Imóveis
            </p>
            <p className="font-serif text-4xl text-[#1f1f1f]">
              {propertyList.length}
            </p>
          </div>

          <div className="border border-[#d8d3ca] bg-[#f8f5ef] p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#8a9a90]">
              Patrimônio
            </p>
            <p className="font-serif text-3xl text-[#1f1f1f]">
              {formatCurrency(totalCurrentValue)}
            </p>
          </div>

          <div className="border border-[#d8d3ca] bg-[#f8f5ef] p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#8a9a90]">
              Aluguel mensal
            </p>
            <p className="font-serif text-3xl text-[#1f1f1f]">
              {formatCurrency(totalMonthlyRent)}
            </p>
          </div>

          <div className="border border-[#d8d3ca] bg-[#f8f5ef] p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#8a9a90]">
              Valorização
            </p>
            <p className="font-serif text-3xl text-[#1f1f1f]">
              {appreciation.toFixed(1)}%
            </p>
          </div>
        </div>

        {propertyList.length === 0 ? (
          <div className="border border-dashed border-[#d8d3ca] px-8 py-20 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#8a9a90]">
              Em breve
            </p>

            <h2 className="font-serif text-3xl text-[#1f1f1f]">
              Cadastre seu primeiro imóvel
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#7d7d7d]">
              Adicione imóveis para começar a acompanhar patrimônio, aluguel
              mensal, valorização e fluxo de caixa.
            </p>

            <Link
              href="/dashboard/properties/new"
              className="mt-8 inline-flex h-12 items-center justify-center bg-[#2f5a46] px-6 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#1f1f1f]"
            >
              Cadastrar imóvel
            </Link>
          </div>
        ) : (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-3xl text-[#1f1f1f]">
                Imóveis recentes
              </h2>

              <Link
                href="/dashboard/properties"
                className="text-xs uppercase tracking-[0.25em] text-[#7d7d7d] hover:text-[#2f5a46]"
              >
                Ver todos
              </Link>
            </div>

            <div className="grid gap-4">
              {propertyList.slice(0, 3).map((property) => (
                <div
                  key={property.id}
                  className="flex flex-col justify-between gap-4 border border-[#d8d3ca] bg-[#f8f5ef] p-6 md:flex-row md:items-center"
                >
                  <div>
                    <h3 className="font-serif text-2xl text-[#1f1f1f]">
                      {property.name}
                    </h3>

                    <p className="mt-2 text-sm text-[#7d7d7d]">
                      Valor atual:{" "}
                      {formatCurrency(Number(property.current_value || 0))}
                    </p>
                  </div>

                  <p className="text-sm text-[#7d7d7d]">
                    Aluguel: {formatCurrency(Number(property.monthly_rent || 0))}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
