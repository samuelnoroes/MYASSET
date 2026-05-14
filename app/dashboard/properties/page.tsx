import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { deleteProperty } from "./actions";

type Property = {
  id: string;
  name: string;
  property_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  acquisition_value: number | null;
  current_value: number | null;
  monthly_rent: number | null;
  created_at: string;
};

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function PropertiesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }

  const propertyList = (properties || []) as Property[];

  return (
    <main className="min-h-screen bg-[#f4f1ea] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-[#d8d3ca] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-6 inline-block text-xs uppercase tracking-[0.25em] text-[#7d7d7d] hover:text-[#2f5a46]"
            >
              Dashboard
            </Link>

            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#8a9a90]">
              Portfólio
            </p>

            <h1 className="font-serif text-5xl text-[#1f1f1f]">
              Seus imóveis
            </h1>

            <p className="mt-4 text-sm text-[#7d7d7d]">
              {propertyList.length} imóvel
              {propertyList.length === 1 ? "" : "s"} cadastrado
              {propertyList.length === 1 ? "" : "s"}.
            </p>
          </div>

          <Link
            href="/dashboard/properties/new"
            className="flex h-12 items-center justify-center bg-[#2f5a46] px-6 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#1f1f1f]"
          >
            Cadastrar imóvel
          </Link>
        </header>

        {propertyList.length === 0 ? (
          <section className="border border-dashed border-[#d8d3ca] px-8 py-20 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#8a9a90]">
              Nenhum imóvel
            </p>

            <h2 className="font-serif text-3xl text-[#1f1f1f]">
              Comece cadastrando seu primeiro imóvel
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#7d7d7d]">
              Depois do cadastro, você poderá acompanhar valor patrimonial,
              aluguel mensal e indicadores do portfólio.
            </p>

            <Link
              href="/dashboard/properties/new"
              className="mt-8 inline-flex h-12 items-center justify-center bg-[#2f5a46] px-6 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#1f1f1f]"
            >
              Cadastrar imóvel
            </Link>
          </section>
        ) : (
          <section className="grid gap-5">
            {propertyList.map((property) => (
              <article
                key={property.id}
                className="border border-[#d8d3ca] bg-[#f8f5ef] p-6"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#8a9a90]">
                      {property.property_type || "Imóvel"}
                    </p>

                    <h2 className="font-serif text-3xl text-[#1f1f1f]">
                      {property.name}
                    </h2>

                    <p className="mt-3 text-sm text-[#7d7d7d]">
                      {[property.address, property.city, property.state]
                        .filter(Boolean)
                        .join(" — ") || "Endereço não informado"}
                    </p>
                  </div>

                  <form action={deleteProperty}>
                    <input type="hidden" name="id" value={property.id} />

                    <button
                      type="submit"
                      className="text-xs uppercase tracking-[0.25em] text-[#a05a4f] hover:text-[#1f1f1f]"
                    >
                      Excluir
                    </button>
                  </form>
                </div>

                <div className="mt-8 grid gap-4 border-t border-[#d8d3ca] pt-6 md:grid-cols-3">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-[#8a9a90]">
                      Compra
                    </p>
                    <p className="text-lg text-[#1f1f1f]">
                      {formatCurrency(property.acquisition_value)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-[#8a9a90]">
                      Valor atual
                    </p>
                    <p className="text-lg text-[#1f1f1f]">
                      {formatCurrency(property.current_value)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-[#8a9a90]">
                      Aluguel mensal
                    </p>
                    <p className="text-lg text-[#1f1f1f]">
                      {formatCurrency(property.monthly_rent)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
