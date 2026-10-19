import { safeJsonLd } from "@/lib/format";

/** Structured data. Content is serialised with `<` escaped so it can never terminate the script element. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />;
}
