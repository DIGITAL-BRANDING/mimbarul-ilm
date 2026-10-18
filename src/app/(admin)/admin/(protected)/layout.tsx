import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { MinbarMark } from "@/components/layout/MinbarMark";
import { logout } from "./actions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/lessons", label: "Lessons" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/profile", label: "Author profile" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/revisions", label: "Revisions" },
  { href: "/admin/settings", label: "Settings" },
];

// Every page under this layout is gated server-side, regardless of what the proxy did.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  return (
    <div className="grid min-h-dvh md:grid-cols-[14rem_1fr]">
      <aside className="bg-deep text-ivory md:sticky md:top-0 md:h-dvh md:overflow-y-auto">
        <div className="flex items-center gap-2 px-4 py-4">
          <MinbarMark className="h-6 w-7 text-gold-bright" />
          <span className="font-semibold">Mimbarul Ilm</span>
        </div>
        <nav aria-label="Administration" className="px-2 pb-4">
          <ul className="grid gap-0.5 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block rounded px-3 py-2 hover:bg-white/10">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 px-4 py-3 text-sm">
          <p className="truncate">{profile.display_name}</p>
          <p className="text-xs text-ivory/60">{profile.role}</p>
          <form action={logout} className="mt-2">
            <button type="submit" className="rounded border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
