"use client";

import { useAcceptInvite } from "@/hooks/mutations/use-accept-invite";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { ApiClientError } from "@/lib/api/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";

export function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirmFailed = searchParams.has("error");
  const {
    data: currentUser,
    isLoading: userLoading,
    isError: userError,
  } = useCurrentUser();
  const acceptInvite = useAcceptInvite();

  const formId = useId();
  const passwordId = `${formId}-password`;
  const confirmId = `${formId}-confirm`;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const lengthOk = password.length >= 8;
  const matchOk = password.length > 0 && password === confirm;
  const hasSession = Boolean(currentUser);
  const alreadyMember = Boolean(currentUser?.membership);
  const pendingInvite = Boolean(currentUser?.pendingManagerInvite);
  const inviteInvalid =
    confirmFailed ||
    userError ||
    (!userLoading && !hasSession) ||
    (!userLoading && hasSession && !alreadyMember && !pendingInvite);

  useEffect(() => {
    document.title = inviteInvalid
      ? "Invite unavailable | ScanReview"
      : "Choose your password | ScanReview";
  }, [inviteInvalid]);

  useEffect(() => {
    if (alreadyMember) {
      router.replace("/dashboard");
    }
  }, [alreadyMember, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lengthOk) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (!matchOk) {
      setError("The two passwords don’t match.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      });
      if (passwordError) {
        setError(passwordError.message || "Unable to set your password.");
        return;
      }

      await acceptInvite.mutateAsync();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to finish this invite. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading || alreadyMember) {
    return <p className="hint">Loading…</p>;
  }

  if (inviteInvalid) {
    return (
      <section aria-labelledby="invite-bad-title">
        <header className="auth-card-header">
          <h1 id="invite-bad-title">This invite link isn’t valid</h1>
          <p className="hint auth-lead">
            It may have expired or already been used. Ask your admin to send a
            new invite, or{" "}
            <Link href="/auth/login">log in</Link> if you already have a
            password.
          </p>
        </header>
      </section>
    );
  }

  const busy = submitting || acceptInvite.isPending;

  return (
    <section aria-labelledby="invite-form-title">
      <header className="auth-card-header">
        <h1 id="invite-form-title">Choose your password</h1>
        <p className="hint auth-lead">
          You’ve been invited to see guest feedback. Set a password to finish.
        </p>
      </header>
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor={passwordId}>Password</label>
        <div className="pw">
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
            disabled={busy}
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </Button>
        </div>
        <label htmlFor={confirmId}>Confirm password</label>
        <div className="pw">
          <input
            id={confirmId}
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={busy}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={
              showConfirm ? "Hide confirm password" : "Show confirm password"
            }
            aria-pressed={showConfirm}
            onClick={() => setShowConfirm((v) => !v)}
            disabled={busy}
          >
            {showConfirm ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </Button>
        </div>
        <ul className="req" aria-label="Password requirements">
          <li className={cn(lengthOk && "on")} id={`${formId}-req-length`}>
            At least 8 characters
          </li>
          <li className={cn(matchOk && "on")} id={`${formId}-req-match`}>
            Passwords match
          </li>
        </ul>
        {error ? (
          <p className="err" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          fullWidth
          className="auth-submit"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Saving" : "Set password and continue"}
        </Button>
      </form>
    </section>
  );
}
