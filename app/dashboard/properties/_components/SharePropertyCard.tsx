"use client";

import { useState } from "react";

type Props = {
  message: string;
};

export default function SharePropertyCard({ message }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Fallback para navegadores sem clipboard API (ou sem HTTPS)
      const el = document.createElement("textarea");
      el.value = message;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title" style={{ marginBottom: 0 }}>Compartilhar com cliente</p>
        <span className="text-xs text-ink-3 uppercase tracking-wider">Mensagem pronta</span>
      </div>

      <div className="bg-surface border border-border rounded p-4 mb-4">
        <pre className="text-sm text-ink-2 whitespace-pre-wrap font-sans leading-relaxed">{message}</pre>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={copyMessage}
          className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
            copied
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/30"
              : "bg-surface border border-border text-ink hover:border-forest hover:text-forest"
          }`}
        >
          {copied ? "✓ Copiada!" : "Copiar mensagem"}
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg width="14" height="14" viewBox="0 0 32 32" fill="white">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.675 4.796 1.851 6.782L2 30l7.438-1.82A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.29 19.927c-.344-.172-2.035-1.003-2.35-1.118-.316-.115-.546-.172-.776.172-.23.344-.888 1.118-1.088 1.348-.2.23-.4.258-.744.086-.344-.172-1.454-.535-2.768-1.703-1.023-.912-1.714-2.037-1.914-2.381-.2-.344-.022-.53.15-.701.155-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.057-.43-.028-.601-.086-.172-.776-1.872-1.062-2.564-.28-.672-.565-.58-.776-.59l-.66-.012c-.23 0-.601.086-.916.43-.315.344-1.204 1.175-1.204 2.866 0 1.69 1.233 3.324 1.405 3.553.172.23 2.428 3.71 5.882 5.203.822.355 1.464.567 1.965.726.826.262 1.578.225 2.173.137.663-.098 2.035-.832 2.322-1.635.287-.803.287-1.49.2-1.635-.086-.144-.315-.23-.659-.4z"/>
          </svg>
          Enviar no WhatsApp
        </a>
      </div>
      <p className="text-xs text-ink-3 mt-3">
        A mensagem é montada automaticamente com os dados do imóvel — atualize o cadastro e ela se atualiza junto.
      </p>
    </div>
  );
}
