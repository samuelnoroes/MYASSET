"use client";

import { useState } from "react";

type Modality = "annual_lease" | "short_stay" | "under_construction";

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
};

const inputClass =
  "w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink";
const labelClass = "block text-xs uppercase tracking-wider text-ink/60 mb-2";
const hintClass = "text-[10px] text-ink/40 mt-2";
const sectionTitleClass =
  "text-xs tracking-[0.3em] uppercase text-ink/40 pb-2 border-b border-ink/10";

export default function PropertyFormFields({
  defaults = {},
}: {
  defaults?: DefaultValues;
}) {
  const [modality, setModality] = useState<Modality>(
    (defaults.modality as Modality) || "annual_lease"
  );

  return (
    <>
      {/* ── IDENTIFICAÇÃO ─────────────────────────────── */}
      <section className="space-y-5">
        <h2 className={sectionTitleClass}>Identificação</h2>

        <div>
          <label htmlFor="name" className={labelClass}>
            Nome completo <span className="text-forest">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex: Apartamento na Aldeota Tower"
            defaultValue={defaults.name || ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="nickname" className={labelClass}>
            Apelido curto <span className="text-forest">*</span>
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            pattern="[a-z0-9]+"
            placeholder="Ex: aldeota101"
            defaultValue={defaults.nickname || ""}
            className={inputClass}
          />
          <p className={hintClass}>
            Letras minúsculas e números, sem espaços. Usado pra identificar o
            imóvel no WhatsApp.
          </p>
        </div>

        <div>
          <label htmlFor="modality" className={labelClass}>
            Modalidade <span className="text-forest">*</span>
          </label>
          <select
            id="modality"
            name="modality"
            required
            value={modality}
            onChange={(e) => setModality(e.target.value as Modality)}
            className={inputClass}
          >
            <option value="annual_lease">Locação anual (contrato)</option>
            <option value="short_stay">Temporada / Airbnb</option>
            <option value="under_construction">Na planta / em construção</option>
          </select>
          <p className={hintClass}>
            {modality === "annual_lease" &&
              "Imóvel com contrato de locação fixo. Aluguel mensal previsível."}
            {modality === "short_stay" &&
              "Imóvel alugado por período curto (diárias). Receita variável."}
            {modality === "under_construction" &&
              "Imóvel ainda não entregue. Sem receita por enquanto."}
          </p>
        </div>

        <div>
          <label htmlFor="property_type" className={labelClass}>
            Tipo <span className="text-forest">*</span>
          </label>
          <select
            id="property_type"
            name="property_type"
            required
            defaultValue={defaults.property_type || "residential"}
            className={inputClass}
          >
            <option value="residential">Residencial</option>
            <option value="commercial">Comercial</option>
            <option value="land">Terreno</option>
            <option value="mixed">Misto</option>
          </select>
        </div>
      </section>

      {/* ── LOCALIZAÇÃO ───────────────────────────────── */}
      <section className="space-y-5">
        <h2 className={sectionTitleClass}>Localização</h2>

        <div>
          <label htmlFor="address" className={labelClass}>
            Endereço
          </label>
          <input
            id="address"
            name="address"
            type="text"
            placeholder="Rua, número, complemento"
            defaultValue={defaults.address || ""}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="city" className={labelClass}>
              Cidade
            </label>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue={defaults.city || ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              UF
            </label>
            <input
              id="state"
              name="state"
              type="text"
              maxLength={2}
              placeholder="CE"
              defaultValue={defaults.state || ""}
              className={`${inputClass} uppercase`}
            />
          </div>
        </div>
      </section>

      {/* ── FINANCEIRO BASE (todos) ───────────────────── */}
      <section className="space-y-5">
        <h2 className={sectionTitleClass}>Financeiro</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="acquisition_value" className={labelClass}>
              {modality === "under_construction"
                ? "Valor já pago (R$)"
                : "Valor de compra (R$)"}
            </label>
            <input
              id="acquisition_value"
              name="acquisition_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue={defaults.acquisition_value ?? ""}
              className={inputClass}
            />
            {modality === "under_construction" && (
              <p className={hintClass}>
                Valor já desembolsado até hoje (parcelas pagas, entrada, etc.)
              </p>
            )}
          </div>
          <div>
            <label htmlFor="acquisition_date" className={labelClass}>
              {modality === "under_construction"
                ? "Data de assinatura"
                : "Data de compra"}
            </label>
            <input
              id="acquisition_date"
              name="acquisition_date"
              type="date"
              defaultValue={defaults.acquisition_date || ""}
              className={inputClass}
            />
          </div>
        </div>

        {/* Valor atual — só pra imóveis entregues */}
        {modality !== "under_construction" && (
          <div>
            <label htmlFor="current_value" className={labelClass}>
              Valor atual de mercado (R$)
            </label>
            <input
              id="current_value"
              name="current_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue={defaults.current_value ?? ""}
              className={inputClass}
            />
            <p className={hintClass}>Estimativa do valor de mercado hoje</p>
          </div>
        )}
      </section>

      {/* ── LOCAÇÃO ANUAL ─────────────────────────────── */}
      {modality === "annual_lease" && (
        <section className="space-y-5">
          <h2 className={sectionTitleClass}>Contrato de locação</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="monthly_rent" className={labelClass}>
                Aluguel contratual (R$/mês){" "}
                <span className="text-forest">*</span>
              </label>
              <input
                id="monthly_rent"
                name="monthly_rent"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                defaultValue={defaults.monthly_rent ?? ""}
                className={inputClass}
              />
              <p className={hintClass}>
                Valor fixo do contrato. Receitas reais são lançadas em
                transações.
              </p>
            </div>
            <div>
              <label htmlFor="lease_due_day" className={labelClass}>
                Dia de vencimento
              </label>
              <input
                id="lease_due_day"
                name="lease_due_day"
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 5"
                defaultValue={defaults.lease_due_day ?? ""}
                className={inputClass}
              />
              <p className={hintClass}>
                Dia do mês em que o aluguel vence
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="lease_renewal_date" className={labelClass}>
                Data de renovação do contrato
              </label>
              <input
                id="lease_renewal_date"
                name="lease_renewal_date"
                type="date"
                defaultValue={defaults.lease_renewal_date || ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="adjustment_index" className={labelClass}>
                Índice de reajuste
              </label>
              <select
                id="adjustment_index"
                name="adjustment_index"
                defaultValue={defaults.adjustment_index || ""}
                className={inputClass}
              >
                <option value="">Não definido</option>
                <option value="igpm">IGP-M</option>
                <option value="ipca">IPCA</option>
                <option value="ivar">IVAR</option>
                <option value="inpc">INPC</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ── TEMPORADA / AIRBNB ────────────────────────── */}
      {modality === "short_stay" && (
        <section className="space-y-5">
          <h2 className={sectionTitleClass}>Temporada</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="daily_rate" className={labelClass}>
                Diária média (R$)
              </label>
              <input
                id="daily_rate"
                name="daily_rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                defaultValue={defaults.daily_rate ?? ""}
                className={inputClass}
              />
              <p className={hintClass}>Valor médio cobrado por diária</p>
            </div>
            <div>
              <label htmlFor="target_occupancy" className={labelClass}>
                Ocupação esperada (%)
              </label>
              <input
                id="target_occupancy"
                name="target_occupancy"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="Ex: 70"
                defaultValue={defaults.target_occupancy ?? ""}
                className={inputClass}
              />
              <p className={hintClass}>
                % médio de dias ocupados no mês
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="monthly_rent" className={labelClass}>
              Receita mensal estimada (R$)
            </label>
            <input
              id="monthly_rent"
              name="monthly_rent"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue={defaults.monthly_rent ?? ""}
              className={inputClass}
            />
            <p className={hintClass}>
              Estimativa de receita mensal média pra cálculo de yield. Receitas
              reais são lançadas em transações.
            </p>
          </div>
        </section>
      )}

      {/* ── NA PLANTA ─────────────────────────────────── */}
      {modality === "under_construction" && (
        <section className="space-y-5">
          <h2 className={sectionTitleClass}>Planta</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="total_investment" className={labelClass}>
                Valor total do contrato (R$)
              </label>
              <input
                id="total_investment"
                name="total_investment"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                defaultValue={defaults.total_investment ?? ""}
                className={inputClass}
              />
              <p className={hintClass}>VGV ou valor total a pagar</p>
            </div>
            <div>
              <label htmlFor="delivery_date" className={labelClass}>
                Previsão de entrega
              </label>
              <input
                id="delivery_date"
                name="delivery_date"
                type="date"
                defaultValue={defaults.delivery_date || ""}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="monthly_rent" className={labelClass}>
              Aluguel projetado após entrega (R$)
            </label>
            <input
              id="monthly_rent"
              name="monthly_rent"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue={defaults.monthly_rent ?? ""}
              className={inputClass}
            />
            <p className={hintClass}>
              Estimativa de aluguel futuro pra calcular yield projetado
            </p>
          </div>
        </section>
      )}
    </>
  );
}
