type Props = {
  light?: boolean; // true = branco (fundos escuros), false = azul navy (fundos claros)
  height?: number;
};

export default function A5Logo({ light = false, height = 28 }: Props) {
  const color = light ? "#FFFFFF" : "#141618";
  const width = Math.round(height * 1.65);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 66 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="A5 Asset"
    >
      <text
        x="1"
        y="36"
        fontFamily="'Arial Black', 'Arial Bold', Impact, sans-serif"
        fontWeight="900"
        fontSize="40"
        fill={color}
        letterSpacing="-2"
      >
        A5
      </text>
    </svg>
  );
}
