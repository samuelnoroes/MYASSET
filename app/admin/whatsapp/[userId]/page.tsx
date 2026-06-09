// app/admin/whatsapp/[userId]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface MonthUsage {
  month: string;
  message_count: number;
}

export default async function AdminWhatsAppConversationPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { month?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!adminProfile?.is_admin) redirect("/dashboard");

  const targetUserId = params.userId;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, plan")
    .eq("id", targetUserId)
    .single();

  const { data: usageMonths } = await supabase
    .from("whatsapp_usage")
    .select("month, message_count")
    .eq("user_id", targetUserId)
    .order("month", { ascending: false });

  let query = supabase
    .from("whatsapp_messages")
    .select("id, role, content, created_at")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: true });

  if (searchParams.month) {
    const start = `${searchParams.month}-01T00:00:00Z`;
    const [year, month] = searchParams.month.split("-").map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00Z`;
    query = query.gte("created_at", start).lt("created_at", end);
  }

  const { data: messages } = await query;

  const groupedMessages: Record<string, Message[]> = {};
  for (const msg of messages ?? []) {
    const day = new Date(msg.created_at).toLocaleDateString("pt-BR");
    if (!groupedMessages[day]) groupedMessages[day] = [];
    groupedMessages[day].push(msg as Message);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMonthLabel(ym: string) {
    const [year, month] = ym.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  const totalMessages = messages?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/whatsapp"
            className="text-xs text-ink-3 hover:text-ink-2 mb-2 inline-block"
          >
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-ink">
            {profile?.full_name ?? "Usuário"}
          </h1>
          <p className="text-ink-2 text-sm mt-0.5">
            {profile?.phone} ·{" "}
            <span
              className={`font-medium ${
                profile?.plan === "pro" ? "text-forest" : "text-warning"
              }`}
            >
              {profile?.plan}
            </span>{" "}
            · {totalMessages} mensagem{totalMessages !== 1 ? "s" : ""}{" "}
            {searchParams.month
              ? `em ${formatMonthLabel(searchParams.month)}`
              : "no total"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            href={`/admin/whatsapp/${targetUserId}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !searchParams.month
                ? "bg-forest text-white"
                : "bg-surface text-ink-2 hover:bg-border"
            }`}
          >
            Todos
          </Link>
          {(usageMonths as MonthUsage[])?.map((u) => (
            <Link
              key={u.month}
              href={`/admin/whatsapp/${targetUserId}?month=${u.month}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                searchParams.month === u.month
                  ? "bg-forest text-white"
                  : "bg-surface text-ink-2 hover:bg-border"
              }`}
            >
              {formatMonthLabel(u.month)} ({u.message_count})
            </Link>
          ))}
        </div>
      </div>

      {Object.keys(groupedMessages).length === 0 ? (
        <div className="card p-12 text-center text-ink-3">
          Nenhuma mensagem encontrada
          {searchParams.month
            ? ` em ${formatMonthLabel(searchParams.month)}`
            : ""}
          .
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([day, msgs]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-ink-3 font-medium px-2">{day}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-2">
                {msgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        msg.role === "user"
                          ? "bg-white border border-border rounded-tl-sm"
                          : "bg-forest text-white rounded-tr-sm"
                      }`}
                    >
                      {msg.content ? (
                        <p
                          className={`text-sm whitespace-pre-wrap leading-relaxed ${
                            msg.role === "user" ? "text-ink" : "text-white"
                          }`}
                        >
                          {msg.content}
                        </p>
                      ) : (
                        <p
                          className={`text-xs italic ${
                            msg.role === "user" ? "text-ink-3" : "text-white/50"
                          }`}
                        >
                          (sem conteúdo)
                        </p>
                      )}
                      <p
                        className={`text-xs mt-1 text-right ${
                          msg.role === "user" ? "text-ink-3" : "text-white/60"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
