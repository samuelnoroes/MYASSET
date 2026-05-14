import Link from "next/link";
import { createProperty } from "../actions";

export default function NewPropertyPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/dashboard/properties"
            className="text-xs uppercase tracking-[0.25em] text-[#7d7d7d] hover:text-[#2f5a46]"
          >
            Voltar
          </Link>

          <span className="text-xs uppercase tracking-[0.25em] text-[#8a9a90]">
            Novo imóvel
          </span>
        </div>

        <section className="border border-[#d8d3ca] bg-[#f8f5ef] p-8">
          <div className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#8a9a90]">
              Cadastro
            </p>

            <h1 className="font-serif text-5xl text-[#1f1f1f]">
              Cadastrar imóvel
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#7d7d7d]">
              Registre as informações básicas do imóvel para começar a
              acompanhar seu portfólio.
            </p>
          </div>

          <form action={createProperty} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
              >
                Nome do imóvel *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ex: Apartamento Jardins"
                className="h-12 w-full border border-[#d8d3ca] bg-white px-4 text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
              />
            </div>

            <div>
              <label
                htmlFor="property_type"
                className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
              >
                Tipo
              </label>

              <select
                id="property_type"
                name="property_type"
                className="h-12 w-full border border-[#d8d3ca] bg-white px-4 text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
                defaultValue=""
              >
                <option value="">Selecione</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Sala comercial">Sala comercial</option>
                <option value="Loja">Loja</option>
                <option value="Terreno">Terreno</option>
                <option value="Galpão">Galpão</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
              >
                Endereço
              </label>

              <input
                id="address"
                name="address"
                type="text"
                placeholder="Rua, número, complemento"
                className="h-12 w-full border border-[#d8d3ca] bg-white px-4 text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
                >
                  Cidade
                </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  className="h-12 w-full border border-[#d8d3ca] bg-white px-4 text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
                >
                  Estado
                </label>

                <input
                  id="state"
                  name="state"
                  type="text"
                  maxLength={2}
                  placeholder="SP"
                  className="h-12 w-full border border-[#d8d3ca] bg-white px-4 uppercase text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="acquisition_value"
                  className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
                >
                  Valor de compra
                </label>

                <input
                  id="acquisition_value"
                  name="acquisition_value"
                  type="text"
                  inputMode="decimal"
                  placeholder="500000"
                  className="h-12 w-full border border-[#d8d3ca] bg-white px-4 text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
                />
              </div>

              <div>
                <label
                  htmlFor="current_value"
                  className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
                >
                  Valor atual
                </label>

                <input
                  id="current_value"
                  name="current_value"
                  type="text"
                  inputMode="decimal"
                  placeholder="650000"
                  className="h-12 w-full border border-[#d8d3ca] bg-white px-4 text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
                />
              </div>

              <div>
                <label
                  htmlFor="monthly_rent"
                  className="mb-2 block text-xs uppercase tracking-wider text-[#7d7d7d]"
                >
                  Aluguel mensal
                </label>

                <input
                  id="monthly_rent"
                  name="monthly_rent"
                  type="text"
                  inputMode="decimal"
                  placeholder="3500"
                  className="h-12 w-full border border-[#d8d3ca] bg-white px-4 text-[#1f1f1f] outline-none focus:border-[#2f5a46]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <button
                type="submit"
                className="h-14 bg-[#2f5a46] px-8 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-[#1f1f1f]"
              >
                Salvar imóvel
              </button>

              <Link
                href="/dashboard/properties"
                className="flex h-14 items-center justify-center border border-[#d8d3ca] px-8 text-xs font-medium uppercase tracking-widest text-[#1f1f1f] transition-colors hover:border-[#2f5a46] hover:text-[#2f5a46]"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
