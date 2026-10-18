import type { ReactNode } from "react";
import { validateDocument } from "@/lib/content/document";

type Node = { type?: string; text?: string; marks?: Array<{ type: string; attrs?: Record<string, string | null> }>; attrs?: Record<string, unknown>; content?: Node[] };

function renderNode(node: Node, key: string): ReactNode {
  if (node.type === "text") {
    let text: ReactNode = node.text ?? "";
    for (const mark of [...(node.marks ?? [])].reverse()) {
      if (mark.type === "bold") text = <strong key={`${key}-bold`}>{text}</strong>;
      else if (mark.type === "italic") text = <em key={`${key}-italic`}>{text}</em>;
      else if (mark.type === "link" && mark.attrs?.href) {
        const href = mark.attrs.href;
        const external = /^https?:\/\//i.test(href);
        text = <a key={`${key}-link`} href={href} className="text-gold underline" rel={external ? "nofollow noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>{text}</a>;
      }
    }
    return text;
  }
  const children = node.content?.map((child, i) => renderNode(child, `${key}-${i}`));
  const language = typeof node.attrs?.lang === "string" ? node.attrs.lang : undefined;
  const direction = node.attrs?.dir === "rtl" || node.attrs?.dir === "ltr" ? node.attrs.dir : undefined;
  const attrs = { lang: language, dir: direction };
  switch (node.type) {
    case "doc": return <>{children}</>;
    case "paragraph": return <p key={key} {...attrs} className="my-5 leading-8">{children}</p>;
    case "heading": {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level ?? 2)));
      if (level === 2) return <h2 key={key} {...attrs} className="mt-10 text-2xl font-semibold text-deep">{children}</h2>;
      if (level === 3) return <h3 key={key} {...attrs} className="mt-8 text-xl font-semibold text-deep">{children}</h3>;
      return <h4 key={key} {...attrs} className="mt-6 text-lg font-semibold text-deep">{children}</h4>;
    }
    case "bulletList": return <ul key={key} className="my-5 list-disc space-y-2 ps-7">{children}</ul>;
    case "orderedList": return <ol key={key} className="my-5 list-decimal space-y-2 ps-7">{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key} {...attrs} className={`my-6 border-s-4 border-gold ps-5 text-mute ${node.attrs?.kind === "quran" || node.attrs?.kind === "hadith" ? "text-center text-xl" : ""}`}>{children}</blockquote>;
    case "horizontalRule": return <hr key={key} className="my-8 border-rule" />;
    case "table": return <div key={key} className="my-6 overflow-x-auto"><table className="w-full border-collapse">{children}</table></div>;
    case "tableRow": return <tr key={key} className="border-b border-rule">{children}</tr>;
    case "tableHeader": return <th key={key} className="border border-rule bg-parchment p-2 text-start font-semibold">{children}</th>;
    case "tableCell": return <td key={key} className="border border-rule p-2">{children}</td>;
    case "mediaRef": return null;
    case "hardBreak": return <br key={key} />;
    default: return <span key={key}>{children}</span>;
  }
}

/** Render the stored ProseMirror subset as React nodes; never inject HTML from lesson content. */
export function renderDocument(value: unknown): ReactNode {
  const parsed = validateDocument(value);
  if (!parsed.ok) return null;
  return renderNode(parsed.doc, "root");
}
