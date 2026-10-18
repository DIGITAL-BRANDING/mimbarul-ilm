/** The site's one signature motif: the stepped silhouette of a minbar (pulpit). Decorative only. */
export function MinbarMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 28" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title} fill="currentColor">
      <path d="M0 28V24h6v-4h6v-4h6v-4h6V8h2V4l2-4 2 4v4h2v20z" />
    </svg>
  );
}
