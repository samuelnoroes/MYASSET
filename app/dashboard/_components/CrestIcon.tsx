/**
 * Brasão simplificado (escudo + monograma) usado no white-label da
 * Leopoldo Cabral e Associados. Recriado em SVG — sem asset raster — pra
 * ficar nítido em qualquer tamanho e herdar a cor do texto ao redor.
 */
export default function CrestIcon({
  size = 24,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path d="M16 2c3 1.8 6 2.4 9 2.4v7.6c0 6.6-3.7 11.4-9 13.8-5.3-2.4-9-7.2-9-13.8V4.4c3 0 6-0.6 9-2.4z" />
      <text
        x="16"
        y="16.5"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="10"
        stroke="none"
        fill={color}
      >
        LC
      </text>
    </svg>
  );
}
