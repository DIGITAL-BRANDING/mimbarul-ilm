/** Only these hosts may be embedded as video. Everything else is rejected, never rendered. */
export type EmbedProvider = "youtube" | "vimeo";

export interface ParsedEmbed {
  provider: EmbedProvider;
  id: string;
  embedUrl: string;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

export function parseVideoUrl(raw: string): ParsedEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return YT_ID.test(id) ? yt(id) : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") ?? "";
      return YT_ID.test(id) ? yt(id) : null;
    }
    const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})$/);
    return m?.[1] ? yt(m[1]) : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(?:^\/|\/video\/)(\d{6,12})$/);
    return m?.[1] && VIMEO_ID.test(m[1]) ? { provider: "vimeo", id: m[1], embedUrl: `https://player.vimeo.com/video/${m[1]}?dnt=1` } : null;
  }
  return null;
}

function yt(id: string): ParsedEmbed {
  return { provider: "youtube", id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
}
