import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { LessonCreateForm } from "./LessonCreateForm";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/lessons" className="text-sm text-gold underline underline-offset-2">← Back to lessons</Link>
      <p className="mt-4 text-sm font-medium uppercase tracking-wide text-mute">Content management</p>
      <h1 className="mt-2 text-2xl font-semibold text-deep">Create lesson</h1>
      <p className="mt-1 text-sm text-mute">Create the first translation for a new lesson.</p>
      <LessonCreateForm />
    </div>
  );
}
