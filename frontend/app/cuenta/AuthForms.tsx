"use client";

import { useState } from "react";
import type { Dictionary } from "../lib/i18n";
import { login, register, type AuthError } from "../lib/auth-actions";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

const labelClass = "mb-1 block text-sm font-medium text-slate-700";

function AuthForm({
  mode,
  t,
}: {
  mode: "login" | "register";
  t: Omit<Dictionary["account"], "welcome">;
}) {
  const [error, setError] = useState<AuthError | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await (mode === "login" ? login : register)(formData);
    // A successful action ends in a redirect and resolves without a value;
    // only a returned error state means something went wrong.
    if (result && result.error) {
      setError(result.error);
      setPending(false);
    }
  }

  const errorMessage =
    error === "credentials"
      ? t.errorCredentials
      : error === "taken"
        ? t.errorTaken
        : error === "invalid"
          ? t.errorInvalid
          : t.errorGeneric;

  const isLogin = mode === "login";

  return (
    <form action={submit} className="space-y-4" data-testid={`${mode}-form`}>
      {error && (
        <p
          data-testid={`${mode}-error`}
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      {!isLogin && (
        <div>
          <label htmlFor={`${mode}-name`} className={labelClass}>
            {t.name}
          </label>
          <input
            id={`${mode}-name`}
            name="name"
            required
            placeholder={t.namePlaceholder}
            data-testid={`${mode}-name`}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor={`${mode}-email`} className={labelClass}>
          {t.email}
        </label>
        <input
          id={`${mode}-email`}
          type="email"
          name="email"
          required
          placeholder={t.emailPlaceholder}
          data-testid={`${mode}-email`}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${mode}-password`} className={labelClass}>
          {t.password}
        </label>
        <input
          id={`${mode}-password`}
          type="password"
          name="password"
          required
          minLength={isLogin ? 1 : 8}
          placeholder="••••••••"
          data-testid={`${mode}-password`}
          className={inputClass}
        />
        {!isLogin && <p className="mt-1 text-xs text-slate-400">{t.passwordHint}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid={`${mode}-submit`}
        className="w-full rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isLogin ? t.loginButton : t.registerButton}
      </button>
    </form>
  );
}

export default function AuthForms({
  t,
}: {
  t: Omit<Dictionary["account"], "welcome">;
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t.loginTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.loginSubtitle}</p>
        <div className="mt-4">
          <AuthForm mode="login" t={t} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t.registerTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.registerSubtitle}</p>
        <div className="mt-4">
          <AuthForm mode="register" t={t} />
        </div>
      </section>
    </div>
  );
}
