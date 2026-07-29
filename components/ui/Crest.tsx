import { crestFromSeed, crestToSvg } from "@/lib/crest";

interface Props {
  seed: string;
  size?: number;
  className?: string;
}

/**
 * A house's generated coat of arms.
 *
 * `crestToSvg` is pure, so this renders on the server with no client boundary.
 * `dangerouslySetInnerHTML` is safe here: the markup is built entirely from a
 * fixed grammar of hard-coded paths and hex values — the seed only ever indexes
 * into constant arrays, so no user input reaches the output.
 */
export function Crest({ seed, size = 40, className }: Props) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: crestToSvg(crestFromSeed(seed), size) }}
    />
  );
}
