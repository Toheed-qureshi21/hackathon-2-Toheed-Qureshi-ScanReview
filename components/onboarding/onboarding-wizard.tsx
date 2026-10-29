"use client";

import { Button } from "@/components/ui/button";
import { ChipRadioGroup } from "@/components/onboarding/chip-radio-group";
import { OnboardingQrGrid } from "@/components/onboarding/onboarding-qr-grid";
import {
  BUSINESS_TYPES,
  LABEL_PRESETS,
  resolveBusinessType,
  resolveSpotLabel,
  SPOT_COUNT_MAX,
  SPOT_COUNT_MIN,
  type BusinessType,
  type LabelPreset,
} from "@/lib/onboarding/constants";
import { useCreateOrganization } from "@/hooks/mutations/use-create-organization";
import { useInviteManager } from "@/hooks/mutations/use-invite-manager";
import { ApiClientError } from "@/lib/api/api-error";
import type { CreateOrganizationBody } from "@/lib/validations/onboarding";
import type { CreateOrganizationResponse } from "@/types/organization-onboarding";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type AlertRecipient = "me" | "manager";

type FieldErrors = {
  org?: string;
  businessType?: string;
  label?: string;
  count?: string;
  url?: string;
  manager?: string;
};

export type OnboardingSnapshot = {
  org: string;
  businessType: string;
  labelPreset: LabelPreset;
  customLabel: string;
  spotLabel: string;
  spotCount: number;
  reviewUrl: string;
  alertRecipient: AlertRecipient;
  managerName: string;
  managerEmail: string;
};

function validateForm(input: {
  org: string;
  businessType: BusinessType;
  customBusinessType: string;
  labelPreset: LabelPreset;
  customLabel: string;
  spotCount: number;
  reviewUrl: string;
  alertRecipient: AlertRecipient;
  managerName: string;
  managerEmail: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const org = input.org.trim();
  const businessTypeDisplay = resolveBusinessType(
    input.businessType,
    input.customBusinessType,
  );
  const spotLabel = resolveSpotLabel(input.labelPreset, input.customLabel);

  if (!org) errors.org = "Enter your business name.";
  if (!businessTypeDisplay) {
    errors.businessType = "Enter your type of business.";
  }
  if (!spotLabel) errors.label = "Enter a name for your spots.";
  if (
    !Number.isFinite(input.spotCount) ||
    input.spotCount < SPOT_COUNT_MIN ||
    input.spotCount > SPOT_COUNT_MAX
  ) {
    errors.count = `Choose a number from ${SPOT_COUNT_MIN} to ${SPOT_COUNT_MAX}.`;
  }
  const link = input.reviewUrl.trim();
  if (link && !/^https:\/\/.+/i.test(link)) {
    errors.url = "Review links must start with https://";
  }
  if (input.alertRecipient === "manager") {
    if (!input.managerName.trim()) {
      errors.manager = "Enter your manager’s name.";
    } else if (!EMAIL_PATTERN.test(input.managerEmail.trim())) {
      errors.manager = "Enter a valid email for your manager.";
    }
  }

  return errors;
}

export function OnboardingWizard() {
  const [step, setStep] = useState<"form" | "done">("form");
  const [org, setOrg] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("Restaurant");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [labelPreset, setLabelPreset] = useState<LabelPreset>("Table");
  const [customLabel, setCustomLabel] = useState("");
  const [spotCount, setSpotCount] = useState(10);
  const [reviewUrl, setReviewUrl] = useState(
    "https://maps.app.goo.gl/KDyq5QPbGM9oXhS28",
  );
  const [alertRecipient, setAlertRecipient] = useState<AlertRecipient>("me");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<CreateOrganizationResponse | null>(
    null,
  );
  const createOrganization = useCreateOrganization();
  const inviteManager = useInviteManager();
  const router = useRouter();
  const submitting = createOrganization.isPending;
  const inviting = inviteManager.isPending;

  const spotLabelPreview = useMemo(
    () => resolveSpotLabel(labelPreset, customLabel) || "…",
    [labelPreset, customLabel],
  );

  useEffect(() => {
    document.title =
      step === "done"
        ? "Your QR codes are ready | ScanReview"
        : "Set up your business | ScanReview";
  }, [step]);

  const adjustCount = useCallback((delta: number) => {
    setSpotCount((current) => {
      const next = Math.min(
        SPOT_COUNT_MAX,
        Math.max(SPOT_COUNT_MIN, (Number(current) || SPOT_COUNT_MIN) + delta),
      );
      return next;
    });
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const parsed: OnboardingSnapshot = {
      org: org.trim(),
      businessType: resolveBusinessType(businessType, customBusinessType),
      labelPreset,
      customLabel: customLabel.trim(),
      spotLabel: resolveSpotLabel(labelPreset, customLabel),
      spotCount: Number(spotCount),
      reviewUrl: reviewUrl.trim(),
      alertRecipient,
      managerName: managerName.trim(),
      managerEmail: managerEmail.trim(),
    };

    const nextErrors = validateForm({
      org: parsed.org,
      businessType,
      customBusinessType: customBusinessType.trim(),
      labelPreset: parsed.labelPreset,
      customLabel: parsed.customLabel,
      spotCount: parsed.spotCount,
      reviewUrl: parsed.reviewUrl,
      alertRecipient: parsed.alertRecipient,
      managerName: parsed.managerName,
      managerEmail: parsed.managerEmail,
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const requestBody: CreateOrganizationBody = {
      organizationName: parsed.org,
      businessType,
      customBusinessType:
        businessType === "Custom" ? customBusinessType.trim() : undefined,
      labelPreset,
      customLabel: labelPreset === "Custom" ? customLabel.trim() : undefined,
      spotCount: parsed.spotCount,
      reviewUrl: parsed.reviewUrl || undefined,
      alertRecipient,
      managerName:
        alertRecipient === "manager" ? parsed.managerName : undefined,
      managerEmail:
        alertRecipient === "manager" ? parsed.managerEmail : undefined,
    };

    createOrganization.mutate(requestBody, {
      onSuccess: (data) => {
        setResult(data);
        setStep("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onError: (err) => {
        if (err instanceof ApiClientError) {
          if (err.code === "ORGANIZATION_ALREADY_EXISTS") {
            setFormError(
              "You already belong to an organization. Open the dashboard instead.",
            );
            return;
          }
          if (err.code === "QR_STORAGE_FAILED") {
            setFormError(err.message);
            return;
          }
          if (err.code === "VALIDATION_ERROR") {
            setFormError(err.message);
            return;
          }
          setFormError(err.message);
          return;
        }
        setFormError("Could not create your organization. Try again.");
      },
    });
  }

  if (step === "done" && result) {
    const managerInvite = result.managerInvite.requested;
    return (
      <section className="onboarding-done-panel" aria-labelledby="ob-done-title">
        <div className="ob-panel-head">
          <h1 id="ob-done-title">Your QR codes are ready</h1>
          <p className="hint">
            {result.spots.length} QR codes for {result.organization.name} (
            {result.organization.businessType}). Saved to your account.
          </p>
          <p className="hint" role="status">
            {result.managerInvite.notice}
          </p>
        </div>
        <div className="onboarding-review-summary noprint" role="status">
          <dl>
            <div>
              <dt>Business</dt>
              <dd>
                {result.organization.name} · {result.organization.businessType}
              </dd>
            </div>
            <div>
              <dt>Spot label</dt>
              <dd>{result.organization.spotLabel}</dd>
            </div>
            <div>
              <dt>Spots</dt>
              <dd>{result.spots.length}</dd>
            </div>
            <div>
              <dt>Review link</dt>
              <dd>{result.organization.publicReviewUrl || "Not set"}</dd>
            </div>
            <div>
              <dt>Alerts</dt>
              <dd>
                {managerInvite
                  ? result.managerInvite.sent
                    ? "Manager invite sent"
                    : "Manager (invite not sent)"
                  : "Just me (admin)"}
              </dd>
            </div>
          </dl>
        </div>
        {managerInvite && !result.managerInvite.sent ? (
          <div className="acts noprint">
            <Button
              type="button"
              variant="ghost"
              disabled={inviting || !managerName.trim() || !managerEmail.trim()}
              aria-busy={inviting}
              onClick={() => {
                inviteManager.mutate(
                  {
                    managerName: managerName.trim(),
                    managerEmail: managerEmail.trim(),
                  },
                  {
                    onSuccess: (data) => {
                      setResult((current) =>
                        current
                          ? { ...current, managerInvite: data.managerInvite }
                          : current,
                      );
                    },
                    onError: (err) => {
                      const message =
                        err instanceof ApiClientError
                          ? err.message
                          : "The invite could not be sent. Try again.";
                      setResult((current) =>
                        current
                          ? {
                              ...current,
                              managerInvite: {
                                ...current.managerInvite,
                                sent: false,
                                notice: message,
                              },
                            }
                          : current,
                      );
                    },
                  },
                );
              }}
            >
              {inviting ? "Sending invite…" : "Send manager invite"}
            </Button>
          </div>
        ) : null}
        <div className="acts noprint">
          <Button type="button" onClick={() => window.print()}>
            Print codes
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/dashboard")}
          >
            Open dashboard
          </Button>
        </div>
        <OnboardingQrGrid spots={result.spots} />
        <p className="hint noprint ob-panel-footnote">
          Tap a code to open the guest feedback page for that spot. Guest
          persistence and alerts are enabled in later slices.
        </p>
      </section>
    );
  }

  return (
    <section className="onboarding-form-panel" aria-labelledby="ob-form-title">
      <div className="ob-panel-head">
        <h1 id="ob-form-title">Set up your business</h1>
        <p className="hint">
          Takes about a minute. You can print your QR codes right after.
        </p>
      </div>
      <form className="card ob-form" noValidate onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="ob-org">Business name</label>
          <input
            id="ob-org"
            autoComplete="organization"
            placeholder="Cafe Nova"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(errors.org)}
            aria-describedby={errors.org ? "ob-org-error" : undefined}
          />
          {errors.org ? (
            <p id="ob-org-error" className="err" role="alert">
              {errors.org}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <ChipRadioGroup
            name="businessType"
            legend="Type of business"
            options={BUSINESS_TYPES.map((value) => ({ value, label: value }))}
            value={businessType}
            onChange={(v) => setBusinessType(v as BusinessType)}
            disabled={submitting}
          />
          {businessType === "Custom" ? (
            <>
              <label htmlFor="ob-custom-business">Your business type</label>
              <input
                id="ob-custom-business"
                maxLength={40}
                placeholder="e.g. Nail studio"
                value={customBusinessType}
                onChange={(e) => setCustomBusinessType(e.target.value)}
                disabled={submitting}
              />
            </>
          ) : null}
          {errors.businessType ? (
            <p className="err" role="alert">
              {errors.businessType}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <ChipRadioGroup
            name="spotLabel"
            legend="What do you call your spots?"
            options={LABEL_PRESETS.map((value) => ({ value, label: value }))}
            value={labelPreset}
            onChange={(v) => setLabelPreset(v as LabelPreset)}
            disabled={submitting}
          />
          {labelPreset === "Custom" ? (
            <>
              <label htmlFor="ob-custom-label">Your label</label>
              <input
                id="ob-custom-label"
                maxLength={20}
                placeholder="e.g. Cabana"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                disabled={submitting}
              />
            </>
          ) : null}
          {errors.label ? (
            <p className="err" role="alert">
              {errors.label}
            </p>
          ) : (
            <p className="hint field-note">
              Preview: {spotLabelPreview} 1, {spotLabelPreview} 2, …
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="ob-count">How many?</label>
          <div className="num">
            <Button
              type="button"
              variant="ghost"
              aria-label="Fewer"
              onClick={() => adjustCount(-1)}
              disabled={submitting || spotCount <= SPOT_COUNT_MIN}
            >
              −
            </Button>
            <input
              id="ob-count"
              type="number"
              inputMode="numeric"
              min={SPOT_COUNT_MIN}
              max={SPOT_COUNT_MAX}
              value={spotCount}
              onChange={(e) => setSpotCount(Number(e.target.value))}
              disabled={submitting}
            />
            <Button
              type="button"
              variant="ghost"
              aria-label="More"
              onClick={() => adjustCount(1)}
              disabled={submitting || spotCount >= SPOT_COUNT_MAX}
            >
              +
            </Button>
          </div>
          <p className="hint field-note">Up to {SPOT_COUNT_MAX} for now.</p>
          {errors.count ? (
            <p className="err" role="alert">
              {errors.count}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="ob-review-url">
            Public review link <span className="hint">(optional)</span>
          </label>
          <input
            id="ob-review-url"
            type="url"
            inputMode="url"
            placeholder="https://maps.google.com/…"
            value={reviewUrl}
            onChange={(e) => setReviewUrl(e.target.value)}
            disabled={submitting}
          />
          <p className="hint field-note">
            Guests are sent here after they copy their review, for example your
            Google Maps page.
          </p>
          {errors.url ? (
            <p className="err" role="alert">
              {errors.url}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <ChipRadioGroup
            name="alertRecipient"
            legend="Who should get the alerts?"
            options={[
              { value: "me", label: "Just me" },
              { value: "manager", label: "A manager I’ll invite" },
            ]}
            value={alertRecipient}
            onChange={(v) => setAlertRecipient(v as AlertRecipient)}
            disabled={submitting}
          />
        </div>

        {alertRecipient === "manager" ? (
          <>
            <div className="form-field">
              <label htmlFor="ob-manager-name">Manager’s name</label>
              <input
                id="ob-manager-name"
                autoComplete="name"
                placeholder="Alex Morgan"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="ob-manager-email">Manager’s email</label>
              <input
                id="ob-manager-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="manager@restaurant.com"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                disabled={submitting}
              />
              <p className="hint field-note">
                We’ll email them an invite to set a password and view
                feedback. Low-rating alerts will go to this address.
              </p>
              {errors.manager ? (
                <p className="err" role="alert">
                  {errors.manager}
                </p>
              ) : null}
            </div>
          </>
        ) : errors.manager ? (
          <div className="form-field">
            <p className="err" role="alert">
              {errors.manager}
            </p>
          </div>
        ) : null}

        {formError ? (
          <p className="err" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="form-field form-field--submit">
          <Button
            type="submit"
            fullWidth
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Creating…" : "Create QR codes"}
          </Button>
        </div>
      </form>
    </section>
  );
}
