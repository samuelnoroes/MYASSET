/**
 * White-label por imobiliária: quando o corretor logado pertence a uma
 * dessas agências (por nome, já que agency_id ainda não é estável o
 * bastante pra chavear por id), a marca "MyAsset" vira a marca da
 * imobiliária nos cabeçalhos do dashboard. Adicionar uma imobiliária aqui
 * não precisa de nova coluna nem migration.
 */
export const AGENCY_BRANDS = [
  { match: "leopoldo cabral", name: "Leopoldo Cabral", suffix: "e Associados" },
];

export function resolveAgencyBrand(agencyName: string | null | undefined) {
  if (!agencyName) return null;
  const needle = agencyName.toLowerCase();
  return AGENCY_BRANDS.find((b) => needle.includes(b.match)) ?? null;
}
