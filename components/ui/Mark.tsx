import { markSvg } from "@/lib/mark";

interface Props {
  size?: number;
  className?: string;
}

/**
 * The product mark, for brand lockups — the landing eyebrow, and anywhere else
 * that names the *tool* rather than a house.
 *
 * Deliberately not `<Crest>`: a crest is a dynasty's own arms and belongs to
 * the user's data. This is one fixed drawing, so `dangerouslySetInnerHTML`
 * carries even less risk here than it does there — nothing indexes into it.
 */
export function Mark({ size = 32, className }: Props) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: markSvg(size) }}
    />
  );
}
