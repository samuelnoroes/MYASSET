"use client";

import { STAGES, STAGE_LABEL, INTENTS, INTENT_LABEL, PROPERTY_TYPES, PROPERTY_TYPE_LABEL } from "./constants";
import type { Contact } from "./constants";

const inputClass =
 "w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors";
const selectClass = inputClass;
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2";
const sectionTitleClass = "text-xs font-bold uppercase tracking-widest text-ink-2 pb-2 border-b-2 border-forest inline-block mb-5";

export default function ContactFormFields({ defaults = {} }: { defaults?: Partial<Contact> }) {
  return (
    <div className="space-y-8">
      <div>
        <p className={sectionTitleClass}>Contato</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="name">Nome *</label>
            <input id="name" name="name" required className={inputClass} defaultValue={defaults.name ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="phone">WhatsApp</label>
              <input id="phone" name="phone" className={inputClass} defaultValue={defaults.phone ?? ""} />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" className={inputClass} defaultValue={defaults.email ?? ""} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className={sectionTitleClass}>O que procura</p>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass} htmlFor="intent">Intenção *</label>
            <select id="intent" name="intent" className={selectClass} defaultValue={defaults.intent ?? "compra"}>
              {INTENTS.map((i) => <option key={i} value={i}>{INTENT_LABEL[i]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="stage">Etapa</label>
            <select id="stage" name="stage" className={selectClass} defaultValue={defaults.stage ?? "novo"}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="property_type">Tipo de imóvel</label>
            <select id="property_type" name="property_type" className={selectClass} defaultValue={defaults.property_type ?? ""}>
              <option value="">indiferente</option>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{PROPERTY_TYPE_LABEL[t]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass} htmlFor="city">Cidade</label>
            <input id="city" name="city" className={inputClass} defaultValue={defaults.city ?? ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="neighborhoods">Bairros desejados (vírgula)</label>
            <input id="neighborhoods" name="neighborhoods" className={inputClass}
              defaultValue={(defaults.neighborhoods ?? []).join(", ")} placeholder="Meireles, Aldeota" />
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className={labelClass} htmlFor="budget_min">Orçamento mín.</label>
            <input id="budget_min" name="budget_min" className={inputClass} inputMode="numeric" defaultValue={defaults.budget_min ?? ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="budget_max">Orçamento máx.</label>
            <input id="budget_max" name="budget_max" className={inputClass} inputMode="numeric" defaultValue={defaults.budget_max ?? ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="area_min">Área mín. (m²)</label>
            <input id="area_min" name="area_min" className={inputClass} inputMode="numeric" defaultValue={defaults.area_min ?? ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="source">Origem</label>
            <input id="source" name="source" className={inputClass} placeholder="whatsapp, indicação…" defaultValue={defaults.source ?? ""} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={labelClass} htmlFor="bedrooms_min">Quartos mín.</label>
            <input id="bedrooms_min" name="bedrooms_min" className={inputClass} inputMode="numeric" defaultValue={defaults.bedrooms_min ?? ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="bathrooms_min">Banheiros mín.</label>
            <input id="bathrooms_min" name="bathrooms_min" className={inputClass} inputMode="numeric" defaultValue={defaults.bathrooms_min ?? ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="parking_min">Vagas mín.</label>
            <input id="parking_min" name="parking_min" className={inputClass} inputMode="numeric" defaultValue={defaults.parking_min ?? ""} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="features">Características (vírgula)</label>
          <input id="features" name="features" className={inputClass}
            defaultValue={(defaults.features ?? []).join(", ")} placeholder="piscina, mobiliado, pet" />
        </div>
      </div>

      <div>
        <p className={sectionTitleClass}>Notas</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="notes">Observações</label>
            <textarea id="notes" name="notes" rows={3} className={inputClass} defaultValue={defaults.notes ?? ""} />
          </div>
          <div>
            <label className={labelClass} htmlFor="lost_reason">Motivo da perda</label>
            <textarea id="lost_reason" name="lost_reason" rows={3} className={inputClass} defaultValue={defaults.lost_reason ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
