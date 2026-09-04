/**
 * Brasão da Leopoldo Cabral e Associados, recriado em SVG (sem asset
 * raster) para os ícones do app (favicon, apple-touch-icon, manifest).
 *
 * Compatível com o renderer do next/og (Satori): o Satori NÃO suporta
 * <text> dentro de <svg> ("<text> nodes are not currently supported"),
 * então o monograma "LC" é uma <div> normal sobreposta ao SVG (só com
 * o escudo + louros), não um <text> do próprio SVG.
 */
export function CrestGlyph({
  boxSize,
  stroke = "#141618",
  background = "#F5F1EA",
}: {
  boxSize: number;
  stroke?: string;
  background?: string;
}) {
  const leaves = (flip: 1 | -1) =>
    Array.from({ length: 6 }, (_, i) => {
      const t = i / 5;
      const y = 20 + t * 62;
      const spread = 10 + t * 14;
      const x = 50 + flip * (16 + t * 6);
      const cx = 50 + flip * spread;
      return (
        <path
          key={`${flip}-${i}`}
          d={`M${50 + flip * 4} ${y} Q${cx} ${y - 4} ${x} ${y + 6}`}
          stroke={stroke}
          strokeWidth={3.2}
          strokeLinecap="round"
          fill="none"
        />
      );
    });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", background }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {leaves(-1)}
        {leaves(1)}
        <path
          d="M50 8c8 4.5 16 6 24 6v21c0 18-10 31-24 38-14-7-24-20-24-38V14c8 0 16-1.5 24-6z"
          stroke={stroke}
          strokeWidth={3.2}
          fill={background}
        />
        <circle cx="50" cy="34" r="13" stroke={stroke} strokeWidth={2.4} fill="none" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "21%",
          left: 0,
          right: 0,
          height: "26%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          fontSize: Math.round(boxSize * 0.13),
          color: stroke,
        }}
      >
        LC
      </div>
    </div>
  );
}
