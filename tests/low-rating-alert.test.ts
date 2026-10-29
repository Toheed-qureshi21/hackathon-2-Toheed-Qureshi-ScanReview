import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLowRatingAlertContent,
  emailContainsGuestContact,
} from "@/lib/email/alert-content";
import {
  alertLogPayloadKeys,
  logLowRatingAlertOutcome,
} from "@/lib/email/alert-log";
import { escapeHtml } from "@/lib/email/html";
import type { BrevoSendInput, BrevoSendResult } from "@/lib/email/brevo-request";
import {
  maybeAttemptLowRatingAlert,
  resolveAlertRecipient,
  shouldAttemptLowRatingAlert,
} from "@/lib/services/alert-recipient";
import { deliverLowRatingAlert } from "@/lib/services/low-rating-alert-deliver";
import { createPublicFeedbackBodySchema } from "@/lib/validations/public-feedback";
import { generatePublicSpotToken } from "@/lib/spots/public-token";

const createdAt = new Date("2026-10-29T12:00:00.000Z");
const GUEST_EMAIL = "guest-injected@evil.test";
const ADMIN_EMAIL = "admin@venue.test";
const MANAGER_EMAIL = "manager@venue.test";

const noContact = {
  contactName: null as string | null,
  contactEmail: null as string | null,
  contactPhone: null as string | null,
};

describe("shouldAttemptLowRatingAlert", () => {
  it("attempts one alert for ratings 1 and 2 without contact", () => {
    assert.equal(shouldAttemptLowRatingAlert({ rating: 1, ...noContact }), true);
    assert.equal(shouldAttemptLowRatingAlert({ rating: 2, ...noContact }), true);
  });

  it("never attempts alerts for ratings 3, 4, or 5", () => {
    for (const rating of [3, 4, 5]) {
      assert.equal(
        shouldAttemptLowRatingAlert({ rating, ...noContact }),
        false,
      );
    }
  });

  it("skips the contact-sharing follow-up POST", () => {
    assert.equal(
      shouldAttemptLowRatingAlert({
        rating: 1,
        contactName: null,
        contactEmail: GUEST_EMAIL,
        contactPhone: null,
      }),
      false,
    );
    assert.equal(
      shouldAttemptLowRatingAlert({
        rating: 2,
        contactName: "Ada Guest",
        contactEmail: null,
        contactPhone: "555-0199",
      }),
      false,
    );
  });
});

describe("maybeAttemptLowRatingAlert", () => {
  it("invokes the sender once for ratings 1 and 2", async () => {
    for (const rating of [1, 2]) {
      let calls = 0;
      const started = await maybeAttemptLowRatingAlert({
        rating,
        ...noContact,
        attempt: async () => {
          calls += 1;
        },
        onUnexpectedFailure: () => {
          assert.fail("should not fail");
        },
      });
      assert.equal(started, true);
      assert.equal(calls, 1);
    }
  });

  it("never invokes the sender for ratings 3, 4, or 5", async () => {
    for (const rating of [3, 4, 5]) {
      let calls = 0;
      const started = await maybeAttemptLowRatingAlert({
        rating,
        ...noContact,
        attempt: async () => {
          calls += 1;
        },
        onUnexpectedFailure: () => {
          assert.fail("should not fail");
        },
      });
      assert.equal(started, false);
      assert.equal(calls, 0);
    }
  });

  it("does not send a duplicate alert on the contact-sharing request", async () => {
    let calls = 0;
    const first = await maybeAttemptLowRatingAlert({
      rating: 1,
      ...noContact,
      attempt: async () => {
        calls += 1;
      },
      onUnexpectedFailure: () => {
        assert.fail("should not fail");
      },
    });
    const second = await maybeAttemptLowRatingAlert({
      rating: 1,
      contactName: "Ada",
      contactEmail: GUEST_EMAIL,
      contactPhone: null,
      attempt: async () => {
        calls += 1;
      },
      onUnexpectedFailure: () => {
        assert.fail("should not fail");
      },
    });
    assert.equal(first, true);
    assert.equal(second, false);
    assert.equal(calls, 1);
  });

  it("swallows thrown sender errors so saved feedback stays successful", async () => {
    let failureLogged = false;
    const started = await maybeAttemptLowRatingAlert({
      rating: 1,
      ...noContact,
      attempt: async () => {
        throw new Error("provider exploded");
      },
      onUnexpectedFailure: () => {
        failureLogged = true;
      },
    });
    assert.equal(started, true);
    assert.equal(failureLogged, true);
  });
});

describe("resolveAlertRecipient", () => {
  it("uses pending manager email when MANAGER_PENDING", () => {
    const result = resolveAlertRecipient(
      {
        alertRecipient: "MANAGER_PENDING",
        pendingManagerEmail: MANAGER_EMAIL,
      },
      [{ role: "ADMIN", alertEmail: ADMIN_EMAIL }],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.email, MANAGER_EMAIL);
  });

  it("falls back to admin alertEmail if pending manager email is missing", () => {
    const result = resolveAlertRecipient(
      { alertRecipient: "MANAGER_PENDING", pendingManagerEmail: null },
      [{ role: "ADMIN", alertEmail: ADMIN_EMAIL }],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.email, ADMIN_EMAIL);
  });

  it("uses admin member email when ADMIN", () => {
    const result = resolveAlertRecipient(
      {
        alertRecipient: "ADMIN",
        pendingManagerEmail: MANAGER_EMAIL,
      },
      [{ role: "ADMIN", alertEmail: ADMIN_EMAIL }],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.email, ADMIN_EMAIL);
  });

  it("ignores MANAGER member alertEmail when selection is ADMIN", () => {
    const result = resolveAlertRecipient(
      { alertRecipient: "ADMIN", pendingManagerEmail: null },
      [
        { role: "MANAGER", alertEmail: MANAGER_EMAIL },
        { role: "ADMIN", alertEmail: ADMIN_EMAIL },
      ],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.email, ADMIN_EMAIL);
  });

  it("does not pick an arbitrary admin when multiple distinct admin emails exist", () => {
    const result = resolveAlertRecipient(
      { alertRecipient: "ADMIN", pendingManagerEmail: null },
      [
        { role: "ADMIN", alertEmail: "a@venue.test" },
        { role: "ADMIN", alertEmail: "b@venue.test" },
      ],
    );
    assert.equal(result.ok, false);
  });

  it("does not use a guest-supplied address", () => {
    const result = resolveAlertRecipient(
      { alertRecipient: "ADMIN", pendingManagerEmail: GUEST_EMAIL },
      [{ role: "ADMIN", alertEmail: ADMIN_EMAIL }],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.notEqual(result.email, GUEST_EMAIL);
  });

  it("returns no_recipient when nothing valid is configured", () => {
    const result = resolveAlertRecipient(
      { alertRecipient: "ADMIN", pendingManagerEmail: null },
      [{ role: "ADMIN", alertEmail: null }],
    );
    assert.equal(result.ok, false);
  });
});

describe("deliverLowRatingAlert", () => {
  const organization = {
    name: "Cafe Nova",
    alertRecipient: "ADMIN" as const,
    pendingManagerEmail: null as string | null,
  };
  const members = [{ role: "ADMIN" as const, alertEmail: ADMIN_EMAIL }];
  const spot = { displayName: "Table 4" };

  it("sends once to the trusted recipient for a rating 1", async () => {
    const sent: BrevoSendInput[] = [];
    const status = await deliverLowRatingAlert({
      feedbackId: "fb-1",
      organization,
      members,
      spot,
      rating: 1,
      createdAt,
      comment: "Cold soup",
      sendEmail: async (input) => {
        sent.push(input);
        return { ok: true };
      },
    });
    assert.equal(status, "sent");
    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.toEmail, ADMIN_EMAIL);
    assert.match(sent[0]?.text ?? "", /Cafe Nova/);
    assert.match(sent[0]?.text ?? "", /Table 4/);
    assert.match(sent[0]?.text ?? "", /1 \/ 5/);
    assert.match(sent[0]?.text ?? "", /2026-10-29T12:00:00.000Z/);
    assert.match(sent[0]?.text ?? "", /Cold soup/);
  });

  it("respects MANAGER_PENDING for the trusted recipient", async () => {
    const sent: string[] = [];
    await deliverLowRatingAlert({
      feedbackId: "fb-2",
      organization: {
        name: "Cafe Nova",
        alertRecipient: "MANAGER_PENDING",
        pendingManagerEmail: MANAGER_EMAIL,
      },
      members,
      spot,
      rating: 2,
      createdAt,
      comment: null,
      sendEmail: async (input) => {
        sent.push(input.toEmail);
        return { ok: true };
      },
    });
    assert.deepEqual(sent, [MANAGER_EMAIL]);
  });

  it("does not send to a guest-supplied email", async () => {
    const sent: BrevoSendInput[] = [];
    await deliverLowRatingAlert({
      feedbackId: "fb-3",
      organization: {
        name: "Cafe",
        alertRecipient: "ADMIN",
        pendingManagerEmail: GUEST_EMAIL,
      },
      members,
      spot,
      rating: 1,
      createdAt,
      comment: "Too noisy",
      sendEmail: async (input) => {
        sent.push(input);
        return { ok: true };
      },
    });
    assert.equal(sent[0]?.toEmail, ADMIN_EMAIL);
    assert.notEqual(sent[0]?.toEmail, GUEST_EMAIL);
    const blob = `${sent[0]?.subject}\n${sent[0]?.text}\n${sent[0]?.html}`;
    assert.equal(blob.includes(GUEST_EMAIL), false);
  });

  it("skips when no recipient is configured and does not call the sender", async () => {
    let calls = 0;
    const status = await deliverLowRatingAlert({
      feedbackId: "fb-4",
      organization: {
        name: "Cafe",
        alertRecipient: "ADMIN",
        pendingManagerEmail: null,
      },
      members: [{ role: "ADMIN", alertEmail: null }],
      spot,
      rating: 1,
      createdAt,
      comment: null,
      sendEmail: async () => {
        calls += 1;
        return { ok: true };
      },
    });
    assert.equal(status, "skipped_no_recipient");
    assert.equal(calls, 0);
  });

  it("records skipped_unconfigured when Brevo is not configured", async () => {
    const status = await deliverLowRatingAlert({
      feedbackId: "fb-5",
      organization,
      members,
      spot,
      rating: 1,
      createdAt,
      comment: null,
      sendEmail: async () => ({ ok: false, reason: "unconfigured" }),
    });
    assert.equal(status, "skipped_unconfigured");
  });

  it("records failed on non-success, timeout, and thrown errors without throwing", async () => {
    const cases: Array<() => Promise<BrevoSendResult>> = [
      async () => ({ ok: false, reason: "failed" }),
      async () => {
        throw new Error("AbortError");
      },
    ];
    for (const sendEmail of cases) {
      const status = await deliverLowRatingAlert({
        feedbackId: "fb-6",
        organization,
        members,
        spot,
        rating: 2,
        createdAt,
        comment: null,
        sendEmail,
      });
      assert.equal(status, "failed");
    }
  });
});

describe("buildLowRatingAlertContent", () => {
  it("includes org, spot, rating, timestamp, and comment", () => {
    const content = buildLowRatingAlertContent({
      organizationName: "Cafe Nova",
      spotDisplayName: "Table 4",
      rating: 2,
      createdAt,
      comment: "Cold soup",
    });
    assert.match(content.subject, /Cafe Nova/);
    assert.match(content.subject, /Table 4/);
    assert.match(content.text, /2 \/ 5/);
    assert.match(content.text, /2026-10-29T12:00:00.000Z/);
    assert.match(content.text, /Cold soup/);
  });

  it("escapes HTML in comments", () => {
    const content = buildLowRatingAlertContent({
      organizationName: "Cafe",
      spotDisplayName: "Table 1",
      rating: 1,
      createdAt,
      comment: `<img src=x onerror="alert(1)">`,
    });
    assert.equal(content.html.includes("<img"), false);
    assert.match(content.html, /&lt;img/);
    assert.equal(escapeHtml("<b>"), "&lt;b&gt;");
  });

  it("omits guest contact details from email content", () => {
    const content = buildLowRatingAlertContent({
      organizationName: "Cafe",
      spotDisplayName: "Table 1",
      rating: 1,
      createdAt,
      comment: "Too noisy",
    });
    assert.equal(
      emailContainsGuestContact(content, {
        name: "Ada Guest",
        email: "ada@guest.test",
        phone: "555-0199",
      }),
      false,
    );
  });
});

describe("public feedback contract vs alerts", () => {
  it("strips a guest-supplied recipient field from the request body", () => {
    const parsed = createPublicFeedbackBodySchema.safeParse({
      token: generatePublicSpotToken(),
      organizationId: "11111111-1111-4111-8111-111111111111",
      rating: 1,
      recipientEmail: GUEST_EMAIL,
      alertEmail: GUEST_EMAIL,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal("recipientEmail" in parsed.data, false);
      assert.equal("alertEmail" in parsed.data, false);
    }
  });

  it("does not put recipient addresses on the public success DTO", () => {
    const dto = {
      id: "fb-1",
      rating: 1,
      createdAt: createdAt.toISOString(),
    };
    assert.equal("alertEmail" in dto, false);
    assert.equal("pendingManagerEmail" in dto, false);
    assert.equal("recipient" in dto, false);
  });
});

describe("logLowRatingAlertOutcome", () => {
  it("logs only feedbackId and a safe status", () => {
    const lines: unknown[] = [];
    const original = console.info;
    console.info = (...args: unknown[]) => {
      lines.push(args);
    };
    try {
      logLowRatingAlertOutcome({ feedbackId: "fb-9", status: "failed" });
    } finally {
      console.info = original;
    }
    assert.equal(lines.length, 1);
    const payload = (lines[0] as unknown[])[1] as Record<string, unknown>;
    assert.deepEqual(Object.keys(payload).sort(), [...alertLogPayloadKeys()].sort());
    assert.equal(payload.feedbackId, "fb-9");
    assert.equal(payload.status, "failed");
    const serialized = JSON.stringify(lines);
    assert.equal(serialized.includes("api-key"), false);
    assert.equal(serialized.includes("BREVO"), false);
    assert.equal(serialized.includes(GUEST_EMAIL), false);
  });
});
