// app/admin/whatsapp/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface WhatsAppUser {
  user_id: string;
  full_name: string;
  phone: string;
  plan: string;
  message_count: number;
  month: string;
  last_message_at: string;
}

export default async function AdminWhatsAppPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const { data: usageData } = await supabase
    .from("whatsapp_usage")
    .select(
      `
      user_id,
      message_count,
      month,
      last_message_at,
      user_profiles!inner(full_name, phone, plan)
    `
    )
    .order("last_message_at", { ascending: false });

  const usersMap = new Map<string, WhatsAppUser>();
  for (const row of usageData ?? []) {
    const profile = row.user_profiles as unknown as {
      full_name: string;
      phone: string;
      plan: string;
    };
    if (usersMap.has(row.user_id)) {
      const existing = usersMap.get(row.user_id)!;
      existing.message_count += row.message_count;
    } else {
      usersMap.set(row.user_id, {
        user_id: row.user_id,
        full_name: profile?.full_name ?? "—",
        phone: profile?.phone ?? "—",
        plan: profile?.plan ?? "—",
        message_count: row.message_count,
        month: row.month,
        last_message_at: row.last_message_at,
      });
    }
  }

  const users = Array.from(usersMap.values()).sort(
    (a, b) =>
      new Date(b.last_message_at).getTime() -
      new Date(a.last_message_at).getTime()
  );

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Histórico WhatsApp</h1>
        <p className="text-ink-2 text-sm mt-1">
          {users.length} usuário{users.length !== 1 ? "s" : ""} com conversa
          registrada
        </p>
      </div>

      {users.length === 0 ? (
        <div className="card p-8 text-center text-ink-3">
          Nenhuma conversa registrada ainda.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-ink-2 font-medium">Usuário</th>
                <th className="text-left px-4 py-3 text-ink-2 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 text-ink-2 font-medium">Plano</th>
                <th className="text-right px-4 py-3 text-ink-2 font-medium">Mensagens</th>
                <th className="text-left px-4 py-3 text-ink-2 font-medium">Último contato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.user_id}
                  className={`border-b border-border last:border-0 hover:bg-surface transition-colors ${
                    i % 2 === 0 ? "" : "bg-surface/40"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-ink">{u.full_name}</td>
                  <td className="px-4 py-3 text-ink-2">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.plan === "pro"
                          ? "bg-forest/10 text-forest"
                          : u.plan === "trial"
                          ? "bg-warning/10 text-warning"
                          : "bg-ink-3/10 text-ink-3"
                      }`}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink font-medium">{u.message_count}</td>
                  <td className="px-4 py-3 text-ink-2 text-xs">{formatDate(u.last_message_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/whatsapp/${u.user_id}`}
                      className="text-xs font-medium text-forest hover:text-forest-light underline underline-offset-2"
                    >
                      Ver conversa →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
