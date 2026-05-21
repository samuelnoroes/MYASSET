"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-header flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="font-display text-4xl italic text-white">
              My<span style={{ color: "#6BA68A" }}>Asset</span>
            </h1>
          </Link>
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mt-3">
            Nova senha
          </p>
        </div>

        <div className="bg-card rounded-card shadow-card-md p-8">
          <p className="text-sm text-ink-2 mb-6 leading-relaxed">
            Escolha uma nova senha para sua conta.
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2"
              >
                Confirmar senha
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-4 py-3 bg-surface border border-border rounded text-sm text-ink focus:border-forest focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-forest text-white font-bold tracking-wider uppercase text-sm hover:bg-forest-light transition-colors rounded disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
