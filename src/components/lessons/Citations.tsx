import type { Citation } from "@/lib/data/lessons";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Presents references exactly as stored. Nothing is inferred: a missing grade stays missing, an unverified
 * reference is labelled as unverified, and a grade is always attributed to the named authority.
 */
export function Citations({ citations, dict }: { citations: Citation[]; dict: Dictionary }) {
  if (citations.length === 0) return null;
  const c = dict.citations;
  return (
    <section className="mt-12 border-t border-rule pt-6" aria-labelledby="sources-title">
      <h2 id="sources-title" className="text-xl font-semibold text-deep">
        {dict.lesson.sources}
      </h2>
      <ol className="mt-4 space-y-6">
        {citations.map((s) => {
          const locators: Array<[string, string | null]> = [
            [c.volume, s.volume],
            [c.page, s.page],
            [c.chapter, s.chapter],
            [c.hadithNumber, s.hadith_number],
            [c.locator, s.edition_locator],
          ];
          const graded = s.authenticity_grade !== "unverified" && s.authenticity_grade !== "not_applicable";
          return (
            <li key={s.id} className="ps-1">
              <p className="font-semibold text-deep" dir="auto">
                {s.source_url ? (
                  <a className="text-gold underline" href={s.source_url} rel="nofollow noopener noreferrer" target="_blank">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
                {s.author_or_compiler && <span className="font-normal text-mute"> — {s.author_or_compiler}</span>}
              </p>
              {(s.edition || s.publisher || s.publication_year) && (
                <p className="ui text-sm text-mute" dir="auto">
                  {[s.edition && `${c.edition}: ${s.edition}`, s.publisher, s.publication_year].filter(Boolean).join(" · ")}
                </p>
              )}
              {locators.some(([, v]) => v) && (
                <p className="ui mt-1 text-sm" dir="auto">
                  {locators.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </p>
              )}
              {s.quotation && (
                <blockquote className="mt-2 border-s-4 border-rule ps-4 text-mute" dir="auto">
                  {s.quotation}
                </blockquote>
              )}
              {graded && (
                <p className="ui mt-2 text-sm">
                  <span className="font-medium">{c.grade}:</span> {c.grades[s.authenticity_grade]}
                  {s.graded_by && (
                    <>
                      {" "}
                      {c.gradedBy} <span dir="auto">{s.graded_by}</span>
                    </>
                  )}
                </p>
              )}
              <p className={`ui mt-2 text-xs ${s.reference_verified ? "text-moss" : "text-danger"}`}>{s.reference_verified ? `✓ ${c.verified}` : c.unverified}</p>
              {s.editorial_notes && (
                <p className="ui mt-1 text-sm text-mute" dir="auto">
                  {c.notes}: {s.editorial_notes}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
