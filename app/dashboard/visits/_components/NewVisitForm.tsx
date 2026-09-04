"use client";

import { useState } from "react";
import Link from "next/link";
import { createVisit } from "../../visitActions";

type PropertyOption = { id: string; name: string; city: string | null };
type LeadOption = { id: string; name: string; phone: string | null };

const inputClass =
  "w-full px-4 py-3 bg-surface border border-border rounded focus:border-forest focus:outline-none transition-colors text-ink text-sm";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2";

export default function NewVisitForm({
  properties,
  leads,
  defaultPropertyId,
  defaultLeadId,
}: {
  properties: PropertyOption[];
  leads: LeadOption[];
  defaultPropertyId: string;
  defaultLeadId: string;
}) {
  const [propertyId, setPropertyId] = useState(defaultPropertyId);
  const newContactHref = `/dashboard/contacts/new?return_to=visit${
    propertyId ? `&property_id=${encodeURIComponent(propertyId)}` : ""
  }`;

  return (
    <form action={createVisit} className="space-y-5">
      <div>
        <label htmlFor="property_id" className={labelClass}>
          Imóvel <span className="text-forest">*</span>
        </label>
        <select
          id="property_id"
          name="property_id"
          required
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>Selecione o imóvel</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.city ? ` — ${p.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="lead_id" className={labelClass} style={{ marginBottom: 0 }}>
            Contato <span className="text-forest">*</span>
          </label>
          <Link href={newContactHref} className="text-xs text-forest font-semibold uppercase tracking-wider hover:text-forest-light transition-colors">
            + Cadastrar novo lead
          </Link>
        </div>

        {leads.length === 0 ? (
          <div className="border border-dashed border-border rounded px-4 py-6 text-center">
            <p className="text-sm text-ink-2 mb-3">
              Você ainda não tem nenhum contato cadastrado. Toda visita precisa estar ligada a um contato — cadastre um primeiro.
            </p>
            <Link
              href={newContactHref}
              className="inline-block px-6 py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors"
            >
              + Cadastrar novo lead
            </Link>
          </div>
        ) : (
          <select id="lead_id" name="lead_id" required defaultValue={defaultLeadId} className={inputClass}>
            <option value="" disabled>Selecione o contato</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}{l.phone ? ` — ${l.phone}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="scheduled_at" className={labelClass}>
          Data e hora da visita <span className="text-forest">*</span>
        </label>
        <input id="scheduled_at" name="scheduled_at" type="datetime-local" required className={inputClass} />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Observações</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Ex.: cliente prefere fim de tarde, levar chave com o porteiro…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={leads.length === 0}
        className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Agendar visita
      </button>
    </form>
  );
}
