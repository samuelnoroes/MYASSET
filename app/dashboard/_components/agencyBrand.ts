/**
 * White-label por imobiliária: quando o corretor logado pertence a uma
 * dessas agências (por nome, já que agency_id ainda não é estável o
 * bastante pra chavear por id), a marca "MyAsset" vira a marca da
 * imobiliária nos cabeçalhos do dashboard. Adicionar uma imobiliária aqui
 * não precisa de nova coluna nem migration.
 *
 * `logo`, quando presente, é uma logo horizontal pronta (public/agencies/…)
 * usada no lugar do brasão + nome renderizados em texto.
 */
export const AGENCY_BRANDS = [
  {
    match: "leopoldo cabral",
    name: "Leopoldo Cabral",
    suffix: "e Associados",
    logo: "/agencies/leopoldo-cabral-horizontal.png",
    logoAlt: "Leopoldo Cabral e Associados",
    // proporção real do arquivo (660x124) — usada pra reservar espaço sem distorcer
    logoAspect: 660 / 124,
  },
];

export function resolveAgencyBrand(agencyName: string | null | undefined) {
  if (!agencyName) return null;
  const needle = agencyName.toLowerCase();
  return AGENCY_BRANDS.find((b) => needle.includes(b.match)) ?? null;
}
