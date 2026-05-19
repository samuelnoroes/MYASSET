import Image from "next/image";

type Props = {
  light?: boolean;  // true = logo branca (pra fundos escuros)
  height?: number;
};

export default function A5Logo({ light = false, height = 28 }: Props) {
  return (
    <Image
      src="/a5-logo.png"
      alt="A5 Asset"
      height={height}
      width={Math.round(height * 1.8)}
      style={
        light
          ? { filter: "brightness(0) invert(1)", opacity: 0.85 }
          : {}
      }
    />
  );
}
