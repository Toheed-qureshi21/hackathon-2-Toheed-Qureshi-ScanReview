import { GuestReviewDrafter } from "@/components/feedback/guest-review-drafter";
import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";

type GuestReviewHandoffProps = {
  context: GuestFeedbackContext;
  rating: number;
  note?: string;
};

/** Phase 6 route name; renders the Phase 7 review drafter UI. */
export function GuestReviewHandoff({
  context,
  rating,
  note,
}: GuestReviewHandoffProps) {
  return (
    <GuestReviewDrafter
      context={context}
      rating={rating}
      initialNote={note}
    />
  );
}
