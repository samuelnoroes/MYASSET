"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "../actions";

type Props = {
  email: string;
  defaultFullName: string;
  defaultPhone: string;
};

export default function ProfileForm({
  email,
  defaultFullName,
  defaultPhone,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState(defaultPhone);

  async function handleSave() {
    setSaving(true);

    // Monta o FormData manualmente — sem depender de <form>
    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("phone", phone);

    await updateProfile(formData);

    router.refresh();
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleCancel() {
    // Restaura os valores originais ao cancelar
    setFullName(defaultFullName);
    setPhone(defaultPhone);
    setEditing(false);
    setSaved(false);
  }

  const inputEditing =
    "w-full px-4 py-3 bg-white border border-ink/10 focus:border-forest focus:outline-none transition-colors text-ink";
  const inputReadonly =
    "w-full px-4 py-3 bg-ink/5 border border-ink/10 text-ink/50 cursor-default";

  return (
    <div className="space-y-6">
      {/* Notificação de sucesso */}
      {saved && (
        <div className="flex items-center gap-3 px-5 py-4 bg-forest/10 border border-forest/20">
          <span className="text-forest text-lg select-none">✓</span>
          <p className="text-sm text-forest font-medium">
            Alterações salvas com sucesso.
          </p>
        </div>
      )}

      {/* E-mail — sempre bloqueado */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          disabled
          className={`${inputReadonly} cursor-not-allowed`}
        />
        <p className="text-[10px] text-ink/40 mt-2">
          O e-mail não pode ser alterado.
        </p>
      </div>

      {/* Nome */}
      <div>
        <label
          htmlFor="full_name"
          className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
        >
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
        <label
          htmlFor="phone"
          className="block text-xs uppercase tracking-wider text-ink/60 mb-2"
        >
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
          <p className="text-[10px] text-ink/40 mt-2">
            Usado para alertas de aluguel e oportunidades do portfólio.
          </p>
        )}
      </div>

      {/* Botões — sem <form>, sem risco de submit automático */}
      <div className="flex gap-3 pt-4">
        {editing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-4 bg-transparent border border-ink/20 text-ink font-medium tracking-wider uppercase text-xs hover:border-forest hover:text-forest transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-8 py-4 bg-forest text-cream font-medium tracking-wider uppercase text-xs hover:bg-ink transition-colors"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
