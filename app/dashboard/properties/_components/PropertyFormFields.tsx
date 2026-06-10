"use client";

import { useState, useEffect } from "react";

type Modality = "annual_lease" | "short_stay" | "under_construction";

type ParentProperty = {
  id: string;
  name: string;
  nickname: string;
  address: string | null;
  city: string | null;
  state: string | null;
  property_type: string;
  modality: string;
};

type DefaultValues = {
  name?: string;
  nickname?: string;
  modality?: string;
  property_type?: string;
  address?: string;
  city?: string;
  state?: string;
  acquisition_value?: number | null;
  acquisition_date?: string | null;
  current_value?: number | null;
  monthly_rent?: number | null;
  lease_due_day?: number | null;
  lease_renewal_date?: string | null;
  adjustment_index?: string | null;
  daily_rate?: number | null;
  target_occupancy?: number | null;
  delivery_date?: string | null;
  total_investment?: number | null;
  next_installment_date?: string | null;
  installment_amount?: number | null;
  balloon_date?: string | null;
  balloon_amount?: number | null;
  payment_notes?: string | null;
  parent_property_id?: string | null;
  unit_identifier?: string | null;
};

const inputClass =
 "w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors";
const selectClass =
 "w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors";
const labelClass =
 "block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2";
const hintClass = "text-xs text-ink-3 mt-1";
const sectionTitleClass =
 "text-xs font-bold uppercase tracking-widest text-ink-2 pb-2 border-b-2 border-forest inline-block mb-5";

export default function PropertyFormFields({
  defaults = {},
  parentProperties = [],
}: {
  defaults?: DefaultValues;
  parentProperties?: ParentProperty[];
}) {
  const [modality, setModality] = useState<Modality>(
    (defaults.modality as Modality) || "annual_lease"
  );
  const [isUnit, setIsUnit] = useState<boolean>(!!defaults.parent_property_id);
  const [parentId, setParentId] = useState<string>(defaults.parent_property_id || "");
  const [unitIdentifier, setUnitIdentifier] = useState<string>(defaults.unit_identifier || "");
  const [address, setAddress] = useState(defaults.address || "");
  const [city, setCity] = useState(defaults.city || "");
  const [stateUF, setStateUF] = useState(defaults.state || "");
  const [propertyType, setPropertyType] = useState(defaults.property_type || "residential");
  const [nickname, setNickname] = useState(defaults.nickname || "");

  useEffect(() => {
    if (!parentId) return;
    const parent = parentProperties.find((p) => p.id === parentId);
    if (!parent) return;
    if (!address) setAddress(parent.address || "");
    if (!city) setCity(parent.city || "");
    if (!stateUF) setStateUF(parent.state || "");
    setPropertyType(parent.property_type || "residential");
    setModality((parent.modality as Modality) || "annual_lease");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  useEffect(() => {
    if (!isUnit || !parentId || nickname) return;
    const parent = parentProperties.find((p) => p.id === parentId);
    if (!parent || !unitIdentifier) return;
    const slug = unitIdentifier.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) setNickname(parent.nickname + slug);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitIdentifier, parentId]);

  return (
    <>
      {/* ── EMPREENDIMENTO (opcional) ──────────────────── */}
      {parentProperties.length > 0 && (
        <div className="card space-y-4">
          <p className={sectionTitleClass}>Empreendimento</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isUnit}
              onChange={(e) => {
                setIsUnit(e.target.checked);
                if (!e.target.checked) { setParentId(""); setUnitIdentifier(""); }
              }}
              className="w-4 h-4 accent-forest"
            />
            <span className="text-sm text-ink font-medium">
              Este imóvel é uma unidade de um empreendimento existente
            </span>
          </label>

          {isUnit && (
            <div className="space-y-4 pt-1">
              <input type="hidden" name="parent_property_id" value={parentId} />
              <div>
                <label className={labelClass}>
                  Empreendimento base <span className="text-forest">*</span>
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className={selectClass}
                  required={isUnit}
                >
                  <option value="">Selecione o empreendimento</option>
                  {parentProperties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Identificador da unidade <span className="text-forest">*</span>
                </label>
                <input
                  name="unit_identifier"
                  type="text"
                  placeholder="Ex: 203, Kitnet 5, Loft A"
                  value={unitIdentifier}
                  onChange={(e) => setUnitIdentifier(e.target.value)}
                  className={inputClass}
                  required={isUnit}
                />
                <p className={hintClass}>Número ou nome que diferencia esta unidade das demais</p>
              </div>
            </div>
          )}

          {!isUnit && <input type="hidden" name="parent_property_id" value="" />}
        </div>
      )}

      {(parentProperties.length === 0 || !isUnit) && (
        <input type="hidden" name="unit_identifier" value="" />
      )}

      {/* ── IDENTIFICAÇÃO ─────────────────────────────── */}
      <div className="card space-y-5">
        <p className={sectionTitleClass}>Identificação</p>

        <div>
          <label htmlFor="name" className={labelClass}>
            Nome completo <span className="text-forest">*</span>
          </label>
          <input
            id="name" name="name" type="text" required
            placeholder={isUnit ? "Ex: Ed Sintra — Unidade 203" : "Ex: Apartamento no Aldeota Tower"}
            defaultValue={defaults.name || ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="nickname" className={labelClass}>
            Apelido curto <span className="text-forest">*</span>
          </label>
          <input
            id="nickname" name="nickname" type="text" required
            pattern="[a-z0-9]+"
            placeholder="Ex: sintra203"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={inputClass}
          />
          <p className={hintClass}>Letras minúsculas e números, sem espaços. Usado no WhatsApp.</p>
        </div>

        <div>
          <label htmlFor="modality" className={labelClass}>
            Modalidade <span className="text-forest">*</span>
          </label>
          <select
            id="modality" name="modality" required
            value={modality}
            onChange={(e) => setModality(e.target.value as Modality)}
            className={selectClass}
          >
            <option value="annual_lease">Locação anual (contrato)</option>
            <option value="short_stay">Temporada / Airbnb</option>
            <option value="under_construction">Na planta / em construção</option>
          </select>
          <p className={hintClass}>
            {modality === "annual_lease" && "Contrato de locação fixo. Aluguel mensal previsível."}
            {modality === "short_stay" && "Aluguel por período curto (diárias). Receita variável."}
            {modality === "under_construction" && "Imóvel ainda não entregue. Sem receita por enquanto."}
          </p>
        </div>

        <div>
          <label htmlFor="property_type" className={labelClass}>
            Tipo <span className="text-forest">*</span>
          </label>
          <select
            id="property_type" name="property_type" required
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className={selectClass}
          >
            <option value="residential">Residencial</option>
            <option value="commercial">Comercial</option>
            <option value="land">Terreno</option>
            <option value="mixed">Misto</option>
          </select>
        </div>
      </div>

      {/* ── LOCALIZAÇÃO ───────────────────────────────── */}
      <div className="card space-y-5">
        <p className={sectionTitleClass}>Localização</p>
        <div>
          <label htmlFor="address" className={labelClass}>Endereço</label>
          <input
            id="address" name="address" type="text"
            placeholder="Rua, número, complemento"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="city" className={labelClass}>Cidade</label>
            <input id="city" name="city" type="text"
              value={city} onChange={(e) => setCity(e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>UF</label>
            <input id="state" name="state" type="text" maxLength={2} placeholder="CE"
              value={stateUF} onChange={(e) => setStateUF(e.target.value.toUpperCase())}
              className={`${inputClass} uppercase`} />
          </div>
        </div>
      </div>

      {/* ── FINANCEIRO BASE ───────────────────────────── */}
      <div className="card space-y-5">
        <p className={sectionTitleClass}>Financeiro</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="acquisition_value" className={labelClass}>
              {modality === "under_construction" ? "Valor já pago (R$)" : "Valor de compra (R$)"}
            </label>
            <input
              id="acquisition_value" name="acquisition_value"
              type="number" step="0.01" min="0" placeholder="0,00"
              defaultValue={defaults.acquisition_value ?? ""}
              className={inputClass}
            />
            {modality === "under_construction" && (
              <p className={hintClass}>Valor já desembolsado até hoje</p>
            )}
          </div>
          <div>
            <label htmlFor="acquisition_date" className={labelClass}>
              {modality === "under_construction" ? "Data de assinatura" : "Data de compra"}
            </label>
            <input id="acquisition_date" name="acquisition_date" type="date"
              defaultValue={defaults.acquisition_date || ""} className={inputClass} />
          </div>
        </div>

        {modality !== "under_construction" && (
          <div>
            <label htmlFor="current_value" className={labelClass}>
              Valor atual de mercado (R$)
            </label>
            <input id="current_value" name="current_value"
              type="number" step="0.01" min="0" placeholder="0,00"
              defaultValue={defaults.current_value ?? ""}
              className={inputClass}
            />
            <p className={hintClass}>Estimativa do valor de mercado hoje</p>
          </div>
        )}
      </div>

      {/* ── LOCAÇÃO ANUAL ─────────────────────────────── */}
      {modality === "annual_lease" && (
        <div className="card space-y-5">
          <p className={sectionTitleClass}>Contrato de locação</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="monthly_rent" className={labelClass}>
                Aluguel contratual (R$/mês) <span className="text-forest">*</span>
              </label>
              <input id="monthly_rent" name="monthly_rent"
                type="number" step="0.01" min="0" placeholder="0,00"
                defaultValue={defaults.monthly_rent ?? ""} className={inputClass} />
              <p className={hintClass}>Valor fixo do contrato</p>
            </div>
            <div>
              <label htmlFor="lease_due_day" className={labelClass}>Dia de vencimento</label>
              <input id="lease_due_day" name="lease_due_day"
                type="number" min="1" max="31" placeholder="Ex: 5"
                defaultValue={defaults.lease_due_day ?? ""} className={inputClass} />
              <p className={hintClass}>Dia do mês em que o aluguel vence</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="lease_renewal_date" className={labelClass}>Data de renovação</label>
              <input id="lease_renewal_date" name="lease_renewal_date" type="date"
                defaultValue={defaults.lease_renewal_date || ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="adjustment_index" className={labelClass}>Índice de reajuste</label>
              <select id="adjustment_index" name="adjustment_index"
                defaultValue={defaults.adjustment_index || ""} className={selectClass}>
                <option value="">Não definido</option>
                <option value="igpm">IGP-M</option>
                <option value="ipca">IPCA</option>
                <option value="ivar">IVAR</option>
                <option value="inpc">INPC</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPORADA ─────────────────────────────────── */}
      {modality === "short_stay" && (
        <div className="card space-y-5">
          <p className={sectionTitleClass}>Temporada</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="daily_rate" className={labelClass}>Diária média (R$)</label>
              <input id="daily_rate" name="daily_rate"
                type="number" step="0.01" min="0" placeholder="0,00"
                defaultValue={defaults.daily_rate ?? ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="target_occupancy" className={labelClass}>Ocupação esperada (%)</label>
              <input id="target_occupancy" name="target_occupancy"
                type="number" min="0" max="100" step="1" placeholder="Ex: 70"
                defaultValue={defaults.target_occupancy ?? ""} className={inputClass} />
              <p className={hintClass}>% médio de dias ocupados no mês</p>
            </div>
          </div>
          <div>
            <label htmlFor="monthly_rent" className={labelClass}>Receita mensal estimada (R$)</label>
            <input id="monthly_rent" name="monthly_rent"
              type="number" step="0.01" min="0" placeholder="0,00"
              defaultValue={defaults.monthly_rent ?? ""} className={inputClass} />
            <p className={hintClass}>Estimativa de receita mensal média para cálculo de yield</p>
          </div>
        </div>
      )}

      {/* ── NA PLANTA ─────────────────────────────────── */}
      {modality === "under_construction" && (
        <>
          <div className="card space-y-5">
            <p className={sectionTitleClass}>Contrato</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="total_investment" className={labelClass}>Valor total do contrato (R$)</label>
                <input id="total_investment" name="total_investment"
                  type="number" step="0.01" min="0" placeholder="0,00"
                  defaultValue={defaults.total_investment ?? ""} className={inputClass} />
                <p className={hintClass}>VGV ou valor total a pagar</p>
              </div>
              <div>
                <label htmlFor="delivery_date" className={labelClass}>Previsão de entrega</label>
                <input id="delivery_date" name="delivery_date" type="date"
                  defaultValue={defaults.delivery_date || ""} className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="payment_notes" className={labelClass}>Modelo de pagamento</label>
              <input id="payment_notes" name="payment_notes" type="text"
                placeholder="Ex: 30% entrada + 60x mensais + 10% nas chaves"
                defaultValue={defaults.payment_notes || ""} className={inputClass} />
              <p className={hintClass}>Descreva a estrutura do contrato em texto livre</p>
            </div>
          </div>

          <div className="card space-y-5">
            <p className={sectionTitleClass}>Parcelas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="installment_amount" className={labelClass}>Valor da parcela mensal (R$)</label>
                <input id="installment_amount" name="installment_amount"
                  type="number" step="0.01" min="0" placeholder="0,00"
                  defaultValue={defaults.installment_amount ?? ""} className={inputClass} />
              </div>
              <div>
                <label htmlFor="next_installment_date" className={labelClass}>Data da próxima parcela</label>
                <input id="next_installment_date" name="next_installment_date" type="date"
                  defaultValue={defaults.next_installment_date || ""} className={inputClass} />
                <p className={hintClass}>Gera lembrete de pagamento quando estiver próxima</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="balloon_amount" className={labelClass}>Valor do balão / parcela especial (R$)</label>
                <input id="balloon_amount" name="balloon_amount"
                  type="number" step="0.01" min="0" placeholder="0,00"
                  defaultValue={defaults.balloon_amount ?? ""} className={inputClass} />
                <p className={hintClass}>Opcional — ex: parcela das chaves</p>
              </div>
              <div>
                <label htmlFor="balloon_date" className={labelClass}>Data do balão</label>
                <input id="balloon_date" name="balloon_date" type="date"
                  defaultValue={defaults.balloon_date || ""} className={inputClass} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
