import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import CrestIcon from "./CrestIcon";
import { resolveAgencyBrand } from "./agencyBrand";

/**
 * Cabeçalho "voltar ao dashboard" usado nas páginas de imóvel/perfil.
 * Mostra a marca da imobiliária do corretor logado quando ela tem
 * white-label configurado (ver agencyBrand.ts); MyAsset é o padrão.
 *
 * Se a página que renderiza já buscou o profile (agency_name), passe-o
 * via prop pra evitar uma segunda consulta; senão o componente busca sozinho.
 */
export default async function BrandMark({
  className = "font-display text-xl italic",
  agencyName,
}: {
  className?: string;
  agencyName?: string | null;
}) {
  let name = agencyName;

  if (name === undefined) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    name = null;
    if (user) {
      const { data } = await supabase
        .from("user_profiles")
        .select("agency_name")
        .eq("id", user.id)
        .maybeSingle();
      name = data?.agency_name ?? null;
    }
  }

  const brand = resolveAgencyBrand(name);

  return (
    <Link href="/dashboard" className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {brand ? (
        <>
          <CrestIcon size={20} color="var(--ink)" />
          <span>
            {brand.name} <span style={{ color: "#C4A96B" }}>{brand.suffix}</span>
          </span>
        </>
      ) : (
        <>
          My<span style={{ color: "#C4A96B" }}>Asset</span>
        </>
      )}
    </Link>
  );
}
