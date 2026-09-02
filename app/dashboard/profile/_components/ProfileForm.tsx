"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "../actions";

type Props = {
  email: string;
  defaultFullName: string;
  defaultPhone: string;
  defaultCreci: string;
  defaultAgencyName: string;
};

export default function ProfileForm({ email, defaultFullName, defaultPhone, defaultCreci, defaultAgencyName }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState(defaultPhone);
  const [creci, setCreci] = useState(defaultCreci);
  const [agencyName, setAgencyName] = useState(defaultAgencyName);

  const inputBase = "w-full px-4 py-3 border rounded text-sm transition-colors";
  const inputEditing = `${inputBase} bg-surface border-border focus:border-forest focus:outline-none text-ink`;
  const inputReadonly = `${inputBase} bg-surface border-transparent text-ink-2 cursor-default`;

  async function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("phone", phone);
    formData.append("creci", creci);
    formData.append("agency_name", agencyName);
    await updateProfile(formData);
    router.refresh();
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleCancel() {
    setFullName(defaultFullName);
    setPhone(defaultPhone);
    setCreci(defaultCreci);
    setAgencyName(defaultAgencyName);
    setEditing(false);
    setSaved(false);
  }

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-400/30 rounded">
          <span className="text-positive text-base select-none">✓</span>
          <p className="text-sm font-semibold text-positive">
            Alterações salvas com sucesso.
          </p>
        </div>
      )}

      {/* E-mail */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          disabled
          className={`${inputReadonly} cursor-not-allowed opacity-60`}
        />
        <p className="text-xs text-ink-3 mt-1">O e-mail não pode ser alterado.</p>
      </div>

      {/* Nome */}
      <div>
        <label htmlFor="full_name" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
          Nome completo
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          readOnly={!editing}
          placeholder={editing ? "Seu nome completo" : "—"}
          className={editing ? inputEditing : inputReadonly}
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
          WhatsApp
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          readOnly={!editing}
          placeholder={editing ? "(85) 99999-9999" : "—"}
          className={editing ? inputEditing : inputReadonly}
        />
        {editing && (
          <p className="text-xs text-ink-3 mt-1">
            Para lembretes de visitas e novidades da sua carteira.
          </p>
        )}
      </div>

      {/* CRECI */}
      <div>
        <label htmlFor="creci" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
          CRECI
        </label>
        <input
          id="creci"
          type="text"
          value={creci}
          onChange={(e) => setCreci(e.target.value)}
          readOnly={!editing}
          placeholder={editing ? "Ex: CRECI-CE 12345" : "—"}
          className={editing ? inputEditing : inputReadonly}
        />
      </div>

      {/* Imobiliária */}
      <div>
        <label htmlFor="agency_name" className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
          Imobiliária
        </label>
        <input
          id="agency_name"
          type="text"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          readOnly={!editing}
          placeholder={editing ? "Nome da sua imobiliária (ou vazio se autônomo)" : "—"}
          className={editing ? inputEditing : inputReadonly}
        />
        {editing && (
          <p className="text-xs text-ink-3 mt-1">
            Aparece na aba Metas junto da meta geral do time.
          </p>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 bg-surface border border-border text-ink font-bold tracking-wider uppercase text-sm hover:border-forest hover:text-forest transition-colors rounded"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-6 py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
