"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function GoogleCalendarConnectButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/google-calendar-callback`,
        scopes: "https://www.googleapis.com/auth/calendar.events",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setLoading(false);
      window.location.href = "/error?message=" + encodeURIComponent(error.message);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-6 py-3 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-forest-light transition-colors disabled:opacity-60"
    >
      {loading ? "Redirecionando..." : "Conectar Google Agenda"}
    </button>
  );
}
