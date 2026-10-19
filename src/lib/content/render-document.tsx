import type { ReactNode } from "react";
import { validateDocument } from "@/lib/content/document";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PublicMedia } from "@/lib/data/lessons";

type Node = { type?: string; text?: string; marks?: Array<{ type: string; attrs?: Record<string, string | null> }>; attrs?: Record<string, unknown>; content?: Node[] };

export interface RenderContext {
  /** Needed to label quote blocks (Qur'an / Hadith / ...). Without it blocks render unlabeled. */
  dict?: Dictionary;
  /** Resolved public media keyed by id, for `mediaRef` nodes. Unresolved refs render nothing (never a broken/private URL). */
  media?: Record<string, PublicMedia>;
}

const QUOTE_STYLE: Record<string, string> = {
  quran: "border-gold bg-parchment/60 text-ink text-xl",
  hadith: "border-moss bg-parchment/40 text-ink text-xl",
  translation: "border-rule text-ink",
  commentary: "border-rule text-mute",
  scholar_quote: "border-moss/60 text-mute",
  author_note: "border-gold-bright text-mute",
  editorial_note: "border-danger/50 bg-danger/5 text-mute text-sm",
};

/** Collects every mediaRef id so the caller can fetch them in one query. */
export function collectMediaIds(value: unknown): string[] {
  const parsed = validateDocument(value);
  if (!parsed.ok) return [];
  const ids = new Set<string>();
  const walk = (n: Node) => {
    if (n.type === "mediaRef" && typeof n.attrs?.mediaId === "string") ids.add(n.attrs.mediaId);
    n.content?.forEach(walk);
  };
  walk(parsed.doc as Node);
  return [...ids];
}

function renderNode(node: Node, key: string, ctx: RenderContext): ReactNode {
  if (node.type === "text") {
    let text: ReactNode = node.text ?? "";
    for (const mark of [...(node.marks ?? [])].reverse()) {
      if (mark.type === "bold") text = <strong key={`${key}-bold`}>{text}</strong>;
      else if (mark.type === "italic") text = <em key={`${key}-italic`}>{text}</em>;
      else if (mark.type === "link" && mark.attrs?.href) {
        const href = mark.attrs.href;
        const external = /^https?:\/\//i.test(href);
        text = (
          <a key={`${key}-link`} href={href} className="text-gold underline" rel={external ? "nofollow noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
            {text}
          </a>
        );
      }
    }
    return text;
  }
  const children = node.content?.map((child, i) => renderNode(child, `${key}-${i}`, ctx));
  const language = typeof node.attrs?.lang === "string" ? node.attrs.lang : undefined;
  // Mixed-script content: when the author did not set a direction, let the browser decide from the first strong character
  // (an Arabic paragraph inside a Hausa lesson then renders right-to-left, a Hausa paragraph left-to-right).
  const direction = node.attrs?.dir === "rtl" || node.attrs?.dir === "ltr" ? node.attrs.dir : "auto";
  const attrs = { lang: language, dir: direction };
  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return (
        <p key={key} {...attrs} className="my-5 leading-8">
          {children}
        </p>
      );
    case "heading": {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level ?? 2)));
      if (level === 2) return <h2 key={key} {...attrs} className="mt-10 text-2xl font-semibold text-deep">{children}</h2>;
      if (level === 3) return <h3 key={key} {...attrs} className="mt-8 text-xl font-semibold text-deep">{children}</h3>;
      return <h4 key={key} {...attrs} className="mt-6 text-lg font-semibold text-deep">{children}</h4>;
    }
    case "bulletList":
      return <ul key={key} className="my-5 list-disc space-y-2 ps-7">{children}</ul>;
    case "orderedList":
      return <ol key={key} className="my-5 list-decimal space-y-2 ps-7">{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote": {
      const kind = typeof node.attrs?.kind === "string" ? node.attrs.kind : null;
      const label = kind && ctx.dict ? (ctx.dict.quoteKinds as Record<string, string>)[kind] : null;
      return (
        <blockquote key={key} {...attrs} data-kind={kind ?? undefined} className={`my-6 border-s-4 ps-5 pe-3 py-1 ${kind ? (QUOTE_STYLE[kind] ?? "border-gold text-mute") : "border-gold text-mute"}`}>
          {label && <p className="ui !my-1 text-xs font-semibold tracking-wide text-gold" dir="auto">{label}</p>}
          {children}
        </blockquote>
      );
    }
    case "horizontalRule":
      return <hr key={key} className="my-8 border-rule" />;
    case "table":
      return (
        <div key={key} className="my-6 overflow-x-auto">
          <table className="w-full border-collapse">{children}</table>
        </div>
      );
    case "tableRow":
      return <tr key={key} className="border-b border-rule">{children}</tr>;
    case "tableHeader":
      return <th key={key} scope="col" className="border border-rule bg-parchment p-2 text-start font-semibold">{children}</th>;
    case "tableCell":
      return <td key={key} className="border border-rule p-2">{children}</td>;
    case "mediaRef": {
      const m = typeof node.attrs?.mediaId === "string" ? ctx.media?.[node.attrs.mediaId] : undefined;
      const caption = (typeof node.attrs?.caption === "string" && node.attrs.caption) || m?.caption || null;
      if (!m) return null;
      if (m.kind === "image" && m.url) {
        return (
          <figure key={key} className="my-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- storage CDN asset with stored dimensions */}
            <img src={m.url} alt={m.alt_text ?? ""} width={m.width ?? undefined} height={m.height ?? undefined} loading="lazy" decoding="async" className="h-auto max-w-full rounded" />
            {caption && <figcaption className="ui mt-2 text-sm text-mute">{caption}</figcaption>}
          </figure>
        );
      }
      if (m.kind === "audio" && m.url) {
        return (
          <figure key={key} className="my-6">
            {m.title && <figcaption className="ui mb-2 text-sm font-medium">{m.title}</figcaption>}
            {/* preload="none": a large audio file is not downloaded until the reader presses play */}
            <audio controls preload="none" src={m.url} className="w-full" />
            {caption && <p className="ui mt-2 text-sm text-mute">{caption}</p>}
          </figure>
        );
      }
      return null;
    }
    case "hardBreak":
      return <br key={key} />;
    default:
      return <span key={key}>{children}</span>;
  }
}

/** Render the stored ProseMirror subset as React nodes; never inject HTML from lesson content. */
export function renderDocument(value: unknown, ctx: RenderContext = {}): ReactNode {
  const parsed = validateDocument(value);
  if (!parsed.ok) return null;
  return renderNode(parsed.doc, "root", ctx);
}
