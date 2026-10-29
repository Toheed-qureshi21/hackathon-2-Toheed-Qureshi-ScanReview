"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { AuthModeTabs } from "./auth-mode-tabs";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const DEMO_FAIL_EMAIL = "fail@demo.scanreview";

export type AuthCredentialsMode = "login" | "signup";

type AuthCredentialsFormProps = {
  mode: AuthCredentialsMode;
};

export function AuthCredentialsForm({ mode }: AuthCredentialsFormProps) {
  const router = useRouter();
  const signup = mode === "signup";

  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [demoMessage, setDemoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectMode = useCallback(
    (nextSignup: boolean) => {
      router.push(nextSignup ? "/auth/signup" : "/auth/login");
      setError("");
      setDemoMessage("");
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDemoMessage("");
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setSubmitting(true);

    window.setTimeout(() => {
      setSubmitting(false);
      if (email.trim().toLowerCase() === DEMO_FAIL_EMAIL) {
        setDemoMessage("");
        setError(
          signup
            ? "Demo only: sign-up failed (simulated). No account was created."
            : "Demo only: sign-in failed (simulated). You are not signed in.",
        );
        return;
      }
      setError("");
      setDemoMessage(
        signup
          ? "Demo only: account creation is not connected. In production, you would continue to onboarding."
          : "Demo only: authentication is not connected. In production, you would continue to the dashboard.",
      );
    }, 600);
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
          <p className="err" role="alert">
            {error}
          </p>
        ) : null}
        {demoMessage ? (
          <p className="auth-demo-notice" role="status">
            {demoMessage}
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
        <p className="hint auth-demo-hint">
          Demo: use <code>{DEMO_FAIL_EMAIL}</code> to preview a simulated error.
        </p>
      </form>
    </>
  );
}
