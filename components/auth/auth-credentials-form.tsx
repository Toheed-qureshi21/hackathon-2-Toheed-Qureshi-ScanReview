"use client";

import { useQueryClient } from "@tanstack/react-query";
import { clearAuthSessionQueries } from "@/lib/auth/query-cache";
import { queryKeys } from "@/hooks/queries/query-keys";
import { ApiClientError } from "@/lib/api/api-error";
import { getAuthMe } from "@/lib/api/auth";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { AuthModeTabs } from "./auth-mode-tabs";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export type AuthCredentialsMode = "login" | "signup";

type AuthCredentialsFormProps = {
  mode: AuthCredentialsMode;
};

export function AuthCredentialsForm({ mode }: AuthCredentialsFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const signup = mode === "signup";

  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const errorId = `${formId}-error`;
  const infoId = `${formId}-info`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectMode = useCallback(
    (nextSignup: boolean) => {
      router.push(nextSignup ? "/auth/signup" : "/auth/login");
      setError("");
      setInfoMessage("");
      setSubmitting(false);
    },
    [router],
  );

  useEffect(() => {
    document.title = signup
      ? "Create your account | ScanReview"
      : "Log in to ScanReview";
  }, [signup]);

  function validate(): string {
    const trimmedEmail = email.trim();
    if (signup && !name.trim()) {
      return "Enter your name.";
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return "Enter a valid email address.";
    }
    if (password.length < 8) {
      return "Use a password with at least 8 characters.";
    }
    return "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInfoMessage("");
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const trimmedEmail = email.trim();

      if (signup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: name.trim() },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (!data.session) {
          setInfoMessage(
            "Check your email to confirm your account, then log in.",
          );
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      }

      clearAuthSessionQueries(queryClient);
      const me = await getAuthMe();
      queryClient.setQueryData(queryKeys.auth.me, me);

      const next = searchParams.get("next");
      router.push(resolvePostAuthPath(me, next));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(
          err.status === 401
            ? "Signed in, but the session could not be verified. Try again."
            : err.message,
        );
        return;
      }
      setError(
        "Authentication is not configured. Check Supabase environment variables.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const title = signup ? "Create your account" : "Welcome back";
  const description = signup
    ? "Set up your business in about a minute."
    : "Log in to see your feedback and QR codes.";
  const submitLabel = signup ? "Create account" : "Log in";

  return (
    <>
      <header className="auth-card-header">
        <h1>{title}</h1>
        <p className="hint auth-lead">{description}</p>
      </header>
      <AuthModeTabs signup={signup} onSelect={selectMode} />
      <form
        id="auth-panel"
        role="tabpanel"
        aria-labelledby={signup ? "auth-tab-signup" : "auth-tab-login"}
        noValidate
        onSubmit={handleSubmit}
      >
        {signup ? (
          <div>
            <label htmlFor={nameId}>Your name</label>
            <input
              id={nameId}
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
        ) : null}
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@restaurant.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <label htmlFor={passwordId}>Password</label>
        <div className="pw">
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
            disabled={submitting}
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </Button>
        </div>
        {error ? (
          <p id={errorId} className="err" role="alert">
            {error}
          </p>
        ) : null}
        {infoMessage ? (
          <p id={infoId} className="auth-demo-notice" role="status">
            {infoMessage}
          </p>
        ) : null}
        <Button
          type="submit"
          fullWidth
          className="auth-submit"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Please wait" : submitLabel}
        </Button>
      </form>
    </>
  );
}
