import { ButtonLink } from "@/components/ui/button";
import { GuestFeedbackHeader } from "@/components/feedback/guest-feedback-header";

type GuestFeedbackInvalidProps = {
  title?: string;
  message?: string;
};

export function GuestFeedbackInvalid({
  title = "This feedback link isn’t valid",
  message = "The demo QR link may be incomplete or expired. Scan a current code from your table, or ask staff for help.",
}: GuestFeedbackInvalidProps) {
  return (
    <>
      <GuestFeedbackHeader />
      <main className="wrap guest-main guest-main--center">
        <div className="card guest-card">
          <h1>{title}</h1>
          <p className="hint" style={{ marginTop: "0.65rem" }}>
            {message}
          </p>
          <p className="hint guest-demo-tag">No sign-up required</p>
          <ButtonLink href="/" fullWidth style={{ marginTop: "1.25rem" }}>
            Back to ScanReview
          </ButtonLink>
        </div>
      </main>
    </>
  );
}
