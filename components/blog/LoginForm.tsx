"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/blog/actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);
  // Controlled so a failed attempt keeps the email; React resets uncontrolled fields after an action.
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor="password">Password</label>
      <div className="password">
        <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required />
        <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {state.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
