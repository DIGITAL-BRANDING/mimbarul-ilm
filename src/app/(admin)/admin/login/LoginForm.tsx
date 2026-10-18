"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="rounded border border-rule bg-white px-3 py-2" aria-describedby={state.error ? "login-error" : undefined} />
      </div>
      <div className="grid gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="rounded border border-rule bg-white px-3 py-2" />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="rounded bg-deep px-4 py-2.5 font-medium text-ivory hover:bg-moss disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
