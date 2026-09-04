import Link from "next/link";
import BrandMark from "../../_components/BrandMark";
import { createContact } from "../actions";
import ContactFormFields from "../_components/ContactFormFields";

export default function NewContactPage() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-header text-white ">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandMark />
          <Link href="/dashboard/contacts" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            Cancelar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-forest mb-2">Novo contato</p>
          <h1 className="text-3xl font-bold text-ink">Guarde o que o cliente procura</h1>
          <p className="text-sm text-ink-2 mt-2">
            Preencha o que souber — quanto mais completo, melhor o casamento com os imóveis da carteira.
          </p>
        </div>

        <form action={createContact} className="space-y-5">
          <ContactFormFields />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="px-8 py-4 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
            >
              Cadastrar contato
            </button>
            <Link
              href="/dashboard/contacts"
              className="px-8 py-4 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
