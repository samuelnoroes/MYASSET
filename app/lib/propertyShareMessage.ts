// Modelo padrão da mensagem de compartilhamento de imóvel com o cliente.
// Centralizado aqui para que o app e, futuramente, o assistente AI no
// WhatsApp montem exatamente a mesma ficha a partir dos dados do imóvel.

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  land: "Terreno",
  mixed: "Misto",
};

export type ShareableProperty = {
  name: string;
  property_type: string | null;
  listing_purpose: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  current_value: number | string | null;
  monthly_rent: number | string | null;
  iptu_amount: number | string | null;
  condo_fee: number | string | null;
  listing_url?: string | null;
};

function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildPropertyShareMessage(property: ShareableProperty): string {
  const isSale = property.listing_purpose !== "rent";
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type || ""] || null;
  const location = [property.address, property.city, property.state].filter(Boolean).join(", ");

  const saleValue = property.current_value ? Number(property.current_value) : null;
  const rentValue = property.monthly_rent ? Number(property.monthly_rent) : null;
  const iptu = property.iptu_amount ? Number(property.iptu_amount) : null;
  const condo = property.condo_fee ? Number(property.condo_fee) : null;

  const lines: string[] = [];

  lines.push(`🏠 *${property.name}*`);
  lines.push([typeLabel, isSale ? "Venda" : "Locação"].filter(Boolean).join(" · "));
  lines.push("");

  if (location) lines.push(`📍 ${location}`);

  if (isSale && saleValue) {
    lines.push(`💰 Valor: ${brl(saleValue)}`);
    if (rentValue) lines.push(`🔑 Potencial de aluguel: ${brl(rentValue)}/mês`);
  } else if (!isSale && rentValue) {
    lines.push(`🔑 Aluguel: ${brl(rentValue)}/mês`);
  }

  const costs: string[] = [];
  if (iptu) costs.push(`IPTU ${brl(iptu)}/mês`);
  if (condo) costs.push(`Condomínio ${brl(condo)}/mês`);
  if (costs.length > 0) lines.push(`🧾 ${costs.join(" · ")}`);

  if (property.listing_url) {
    lines.push("");
    lines.push(`🔗 Mais fotos e detalhes: ${property.listing_url}`);
  }

  lines.push("");
  lines.push("Quer conhecer? Me chama que agendo sua visita! 😊");

  // Remove linhas vazias duplicadas
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
