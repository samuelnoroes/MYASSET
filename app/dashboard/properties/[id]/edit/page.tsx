import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateProperty } from "../../actions";

type EditPropertyPageProps = {
  params: {
    id: string;
  };
};

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-ink/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-ink">
            My<span className="italic text-forest">Asset</span>
          </Link>
          <Link
            href="/dashboard/properties"
            className="text-xs uppercase tracking-wider text-ink/60 hover:text-forest transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-forest/60 mb-3">
            Editar imóvel
          </p>
          <h1 className="font-display text-4xl text-ink">{property.name}</h1>
        </div>

        <form action={updateProperty} className="space-y-10">
          <input type="hidden" name="id" value={property.id} />

          {/* Identificação */}
          <section className="space-y-5">
            <h2 className="text-xs tracking-[0.3em] uppercase text-ink/40 pb-2 border-b border-ink/10">
              Identificação
            </h2>

            <div>
              <label
                htmlFor="name"
                className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
              >
                Nome completo <span className="text-forest">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={property.name}
                className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="nickname"
                className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
              >
                Apelido curto <span className="text-forest">*</span>
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                required
                pattern="[a-z0-9]+"
                defaultValue={property.nickname}
                className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
              />
              <p className="text-[10px] text-ink/40 mt-2">
                Letras minúsculas e números, sem espaços. Vai ser usado pra
                identificar o imóvel no WhatsApp.
              </p>
            </div>

            <div>
              <label
                htmlFor="property_type"
                className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
              >
                Tipo <span className="text-forest">*</span>
              </label>
              <select
                id="property_type"
                name="property_type"
                required
                defaultValue={property.property_type}
                className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
              >
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
                <option value="land">Terreno</option>
                <option value="mixed">Misto</option>
              </select>
            </div>
          </section>

          {/* Localização */}
          <section className="space-y-5">
            <h2 className="text-xs tracking-[0.3em] uppercase text-ink/40 pb-2 border-b border-ink/10">
              Localização
            </h2>

            <div>
              <label
                htmlFor="address"
                className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
              >
                Endereço
              </label>
              <input
                id="address"
                name="address"
                type="text"
                defaultValue={property.address || ""}
                className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label
                  htmlFor="city"
                  className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
                >
                  Cidade
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  defaultValue={property.city || ""}
                  className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
                >
                  UF
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  maxLength={2}
                  defaultValue={property.state || ""}
                  className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink uppercase"
                />
              </div>
            </div>
          </section>

          {/* Financeiro */}
          <section className="space-y-5">
            <h2 className="text-xs tracking-[0.3em] uppercase text-ink/40 pb-2 border-b border-ink/10">
              Financeiro
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="acquisition_value"
                  className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
                >
                  Valor de compra (R$)
                </label>
                <input
                  id="acquisition_value"
                  name="acquisition_value"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={property.acquisition_value || ""}
                  className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="acquisition_date"
                  className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
                >
                  Data de compra
                </label>
                <input
                  id="acquisition_date"
                  name="acquisition_date"
                  type="date"
                  defaultValue={property.acquisition_date || ""}
                  className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="current_value"
                  className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
                >
                  Valor atual (R$)
                </label>
                <input
                  id="current_value"
                  name="current_value"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={property.current_value || ""}
                  className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
                />
                <p className="text-[10px] text-ink/40 mt-2">
                  Valor de mercado estimado hoje
                </p>
              </div>
              <div>
                <label
                  htmlFor="monthly_rent"
                  className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
                >
                  Aluguel esperado (R$)
                </label>
                <input
                  id="monthly_rent"
                  name="monthly_rent"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={property.monthly_rent || ""}
                  className="w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink"
                />
                <p className="text-[10px] text-ink/40 mt-2">
                  Aluguel contratual mensal. Receitas reais serão lançadas em
                  transações.
                </p>
              </div>
            </div>
          </section>

          {/* Botões */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
            >
              Salvar alterações
            </button>
            <Link
              href="/dashboard/properties"
              className="w-full py-4 bg-transparent border border-ink/20 text-ink font-medium tracking-wider uppercase text-xs hover:border-forest hover:text-forest transition-colors text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
