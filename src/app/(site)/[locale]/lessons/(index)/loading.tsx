export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-48 animate-pulse rounded bg-parchment" />
      <div className="mt-8 space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 w-2/3 animate-pulse rounded bg-parchment" />
            <div className="h-4 w-full animate-pulse rounded bg-parchment/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
