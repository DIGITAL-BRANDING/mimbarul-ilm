import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";

const SECTION_TITLES: Record<string, string> = {
  lessons: "Lessons",
  categories: "Categories",
  tags: "Tags",
  sources: "Sources",
  media: "Media",
  books: "Books",
  profile: "Author profile",
  seo: "SEO",
  revisions: "Revisions",
  settings: "Settings",
};

export const dynamic = "force-dynamic";

/**
 * Keep links in the protected admin navigation useful while each CRUD screen is
 * being delivered. Unknown admin paths also land here instead of the public 404.
 */
export default async function AdminSectionPage({ params }: { params: Promise<{ section: string[] }> }) {
  await requireStaff();
  const { section } = await params;
  const key = section[0] ?? "";
  const title = SECTION_TITLES[key] ?? "Administration";

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium uppercase tracking-wide text-mute">Administration</p>
      <h1 className="mt-2 text-2xl font-semibold text-deep">{title}</h1>
      <div className="mt-6 rounded border border-rule bg-ivory p-6 shadow-sm">
        <p className="text-mute">
          This section is connected to the admin navigation and is being prepared for content management.
        </p>
        <Link href="/admin" className="ui mt-5 inline-block rounded bg-deep px-4 py-2 text-ivory hover:bg-moss">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
