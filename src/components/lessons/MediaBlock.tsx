import type { PublicMedia } from "@/lib/data/lessons";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Audio files and approved video embeds attached to a lesson. Nothing is fetched until the reader interacts. */
export function MediaBlock({ items, dict }: { items: PublicMedia[]; dict: Dictionary }) {
  const playable = items.filter((m) => (m.kind === "audio" && m.url) || (m.kind === "video" && m.embedUrl));
  if (playable.length === 0) return null;
  return (
    <section className="mt-10 space-y-8" aria-labelledby="media-title">
      <h2 id="media-title" className="text-xl font-semibold text-deep">
        {dict.lessons.media}
      </h2>
      {playable.map((m) => (
        <figure key={m.id}>
          {m.title && (
            <figcaption className="ui mb-2 text-sm font-medium" dir="auto">
              {m.title}
            </figcaption>
          )}
          {m.kind === "audio" && m.url ? (
            <audio controls preload="none" src={m.url} className="w-full" aria-label={m.title ?? dict.lessons.audioLabel} />
          ) : (
            m.embedUrl && (
              <div className="aspect-video w-full overflow-hidden rounded bg-deep-2">
                <iframe
                  src={m.embedUrl}
                  title={m.title ?? dict.lessons.videoLabel}
                  loading="lazy"
                  allow="fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  className="h-full w-full border-0"
                />
              </div>
            )
          )}
          {m.caption && (
            <p className="ui mt-2 text-sm text-mute" dir="auto">
              {m.caption}
            </p>
          )}
        </figure>
      ))}
    </section>
  );
}
