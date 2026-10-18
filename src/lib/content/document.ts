import { z } from "zod";

/**
 * Validated rich-text document (Tiptap/ProseMirror JSON subset).
 * The editor output is NEVER trusted: this allowlist schema runs on write AND before render.
 * Unknown node/mark types are rejected, so arbitrary HTML cannot be smuggled in.
 */
export const MAX_DEPTH = 12;
export const MAX_NODES = 20_000;

const safeHref = z
  .string()
  .max(2048)
  .refine((v) => {
    try {
      const u = new URL(v, "https://placeholder.invalid");
      return ["http:", "https:", "mailto:"].includes(u.protocol) || v.startsWith("/");
    } catch {
      return false;
    }
  }, "Unsafe or malformed link");

const markSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }).strict(),
  z.object({ type: z.literal("italic") }).strict(),
  z
    .object({
      type: z.literal("link"),
      attrs: z.object({ href: safeHref, target: z.string().nullish(), rel: z.string().nullish(), class: z.string().nullish() }).strict(),
    })
    .strict(),
]);

const dirSchema = z.enum(["ltr", "rtl"]);
const langSchema = z.enum(["ar", "ha", "en"]);

/** Religious-text semantics: each block keeps its identity so presentation can distinguish them. */
export const QUOTE_KINDS = ["quran", "hadith", "translation", "commentary", "scholar_quote", "author_note", "editorial_note"] as const;

export type DocMark = z.infer<typeof markSchema>;
export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: DocMark[];
  text?: string;
};

const textAttrs = z.object({ dir: dirSchema.nullish(), lang: langSchema.nullish() }).strict();

const nodeSchema: z.ZodType<DocNode> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal("text"), text: z.string().max(200_000), marks: z.array(markSchema).max(6).optional() }).strict(),
    z.object({ type: z.literal("hardBreak") }).strict(),
    z.object({ type: z.literal("horizontalRule") }).strict(),
    z.object({ type: z.enum(["paragraph", "listItem", "bulletList", "tableRow"]), attrs: textAttrs.optional(), content: z.array(nodeSchema).optional() }).strict(),
    z.object({ type: z.literal("orderedList"), attrs: z.object({ start: z.number().int().min(1).max(10_000).optional(), type: z.string().nullish() }).strict().optional(), content: z.array(nodeSchema).optional() }).strict(),
    z.object({ type: z.literal("heading"), attrs: z.object({ level: z.number().int().min(2).max(4), dir: dirSchema.nullish(), lang: langSchema.nullish() }).strict(), content: z.array(nodeSchema).optional() }).strict(),
    z
      .object({
        type: z.literal("blockquote"),
        attrs: z.object({ kind: z.enum(QUOTE_KINDS).nullish(), dir: dirSchema.nullish(), lang: langSchema.nullish(), sourceId: z.uuid().nullish() }).strict().optional(),
        content: z.array(nodeSchema).optional(),
      })
      .strict(),
    z
      .object({
        type: z.enum(["table", "tableCell", "tableHeader"]),
        attrs: z.object({ colspan: z.number().int().min(1).max(10).nullish(), rowspan: z.number().int().min(1).max(10).nullish(), colwidth: z.array(z.number()).nullish() }).strict().optional(),
        content: z.array(nodeSchema).optional(),
      })
      .strict(),
    // Media nodes reference approved library records by id; raw URLs are resolved server-side.
    z.object({ type: z.literal("mediaRef"), attrs: z.object({ mediaId: z.uuid(), caption: z.string().max(500).nullish() }).strict() }).strict(),
  ]),
);

export const documentSchema = z.object({ type: z.literal("doc"), content: z.array(nodeSchema).max(5000) }).strict();
export type RichDocument = z.infer<typeof documentSchema>;

export const EMPTY_DOC: RichDocument = { type: "doc", content: [{ type: "paragraph" }] };

function measure(node: DocNode, depth: number, acc: { nodes: number; maxDepth: number }) {
  acc.nodes += 1;
  acc.maxDepth = Math.max(acc.maxDepth, depth);
  node.content?.forEach((c) => measure(c, depth + 1, acc));
}

export type DocValidation = { ok: true; doc: RichDocument } | { ok: false; error: string };

export function validateDocument(input: unknown): DocValidation {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid document structure" };
  const acc = { nodes: 0, maxDepth: 0 };
  parsed.data.content.forEach((n) => measure(n, 1, acc));
  if (acc.maxDepth > MAX_DEPTH) return { ok: false, error: "Document is nested too deeply" };
  if (acc.nodes > MAX_NODES) return { ok: false, error: "Document is too large" };
  return { ok: true, doc: parsed.data };
}

const BLOCKS = new Set(["paragraph", "heading", "blockquote", "listItem", "tableRow", "tableCell", "tableHeader"]);

/** Plain text of a document (used for search indexing and publish checks). Each block ends with one newline. */
export function extractText(node: DocNode | RichDocument): string {
  const n = node as DocNode;
  if (typeof n.text === "string") return n.text;
  const joined = (n.content ?? []).map(extractText).join("");
  return BLOCKS.has(n.type) && !joined.endsWith("\n") ? joined + "\n" : joined;
}
