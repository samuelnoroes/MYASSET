"use client";

import { useState, useEffect } from "react";

type ParentProperty = {
  id: string;
  name: string;
  nickname: string;
  address: string | null;
  city: string | null;
  state: string | null;
  property_type: string;
};

type DefaultValues = {
  name?: string;
  nickname?: string;
  property_type?: string;
  address?: string;
  city?: string;
  state?: string;
  listing_purpose?: string | null;
  listing_status?: string | null;
  current_value?: number | null;
  monthly_rent?: number | null;
  iptu_amount?: number | null;
  condo_fee?: number | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  listed_at?: string | null;
  acquisition_value?: number | null;
  acquisition_date?: string | null;
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
  const [purpose, setPurpose] = useState<string>(defaults.listing_purpose || "sale");
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

      {/* ── NEGÓCIO ───────────────────────────────────── */}
      <div className="card space-y-5">
        <p className={sectionTitleClass}>Negócio</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="listing_purpose" className={labelClass}>
              Finalidade <span className="text-forest">*</span>
            </label>
            <select
              id="listing_purpose" name="listing_purpose" required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={selectClass}
            >
              <option value="sale">Venda</option>
              <option value="rent">Locação</option>
            </select>
          </div>
          <div>
            <label htmlFor="listing_status" className={labelClass}>
              Status <span className="text-forest">*</span>
            </label>
            <select
              id="listing_status" name="listing_status" required
              defaultValue={defaults.listing_status || "available"}
              className={selectClass}
            >
              <option value="available">Disponível</option>
              <option value="reserved">Reservado</option>
              <option value="closed">Fechado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="current_value" className={labelClass}>
              Valor de venda (R$){purpose === "sale" && <span className="text-forest"> *</span>}
            </label>
            <input
              id="current_value" name="current_value"
              type="number" step="0.01" min="0" placeholder="0,00"
              required={purpose === "sale"}
              defaultValue={defaults.current_value ?? ""}
              className={inputClass}
            />
            <p className={hintClass}>
              {purpose === "sale" ? "Valor anunciado do imóvel" : "Valor de referência do imóvel (opcional)"}
            </p>
          </div>
          <div>
            <label htmlFor="monthly_rent" className={labelClass}>
              Aluguel pretendido (R$/mês){purpose === "rent" && <span className="text-forest"> *</span>}
            </label>
            <input
              id="monthly_rent" name="monthly_rent"
              type="number" step="0.01" min="0" placeholder="0,00"
              required={purpose === "rent"}
              defaultValue={defaults.monthly_rent ?? ""}
              className={inputClass}
            />
            <p className={hintClass}>
              {purpose === "rent" ? "Valor anunciado da locação" : "Preencha se o imóvel também gera renda"}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="listed_at" className={labelClass}>Na carteira desde</label>
          <input
            id="listed_at" name="listed_at" type="date"
            defaultValue={defaults.listed_at || new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
          <p className={hintClass}>Data de captação — usada no indicador de dias na carteira</p>
        </div>
      </div>

      {/* ── CUSTOS ────────────────────────────────────── */}
      <div className="card space-y-5">
        <p className={sectionTitleClass}>Custos do imóvel</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="iptu_amount" className={labelClass}>IPTU (R$/mês)</label>
            <input
              id="iptu_amount" name="iptu_amount"
              type="number" step="0.01" min="0" placeholder="0,00"
              defaultValue={defaults.iptu_amount ?? ""}
              className={inputClass}
            />
            <p className={hintClass}>Se souber só o valor anual, divida por 12</p>
          </div>
          <div>
            <label htmlFor="condo_fee" className={labelClass}>Condomínio (R$/mês)</label>
            <input
              id="condo_fee" name="condo_fee"
              type="number" step="0.01" min="0" placeholder="0,00"
              defaultValue={defaults.condo_fee ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── PROPRIETÁRIO ──────────────────────────────── */}
      <div className="card space-y-5">
        <p className={sectionTitleClass}>Proprietário</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="owner_name" className={labelClass}>Nome</label>
            <input
              id="owner_name" name="owner_name" type="text"
              placeholder="Dono do imóvel"
              defaultValue={defaults.owner_name || ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="owner_phone" className={labelClass}>WhatsApp</label>
            <input
              id="owner_phone" name="owner_phone" type="tel"
              placeholder="(85) 99999-9999"
              defaultValue={defaults.owner_phone || ""}
              className={inputClass}
            />
            <p className={hintClass}>Para falar com o proprietário direto pela página do imóvel</p>
          </div>
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

      {/* ── DADOS DE INVESTIDOR (opcional) ────────────── */}
      <div className="card space-y-5">
        <p className={sectionTitleClass}>Dados de investidor (opcional)</p>
        <p className="text-sm text-ink-2 -mt-2">
          Imóvel de cliente investidor? Preencha para acompanhar o rendimento (yield) dele no app.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="acquisition_value" className={labelClass}>Valor de compra (R$)</label>
            <input
              id="acquisition_value" name="acquisition_value"
              type="number" step="0.01" min="0" placeholder="0,00"
              defaultValue={defaults.acquisition_value ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="acquisition_date" className={labelClass}>Data de compra</label>
            <input id="acquisition_date" name="acquisition_date" type="date"
              defaultValue={defaults.acquisition_date || ""} className={inputClass} />
          </div>
        </div>
        <p className={hintClass}>
          O yield é calculado com o aluguel pretendido ÷ valor de venda. Sem esses dados, o indicador fica em branco.
        </p>
      </div>
    </>
  );
}
