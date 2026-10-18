import { redirect } from "next/navigation";
import { MinbarMark } from "@/components/layout/MinbarMark";
import { getStaff } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/security/redirect";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeInternalPath(next);
  if (await getStaff()) redirect(safeNext);
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded border border-rule bg-ivory p-8 shadow-sm">
        <MinbarMark className="h-8 w-9 text-deep" />
        <h1 className="mt-3 text-2xl font-semibold text-deep">Administration</h1>
        <p className="mt-1 text-sm text-mute">Sign in to manage lessons, media and settings.</p>
        <LoginForm next={next ? safeNext : undefined} />
      </div>
    </main>
  );
}
