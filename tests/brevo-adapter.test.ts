import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBrevoEnv } from "@/lib/email/brevo-config";
import {
  BREVO_SMTP_URL,
  postBrevoTransactionalEmail,
} from "@/lib/email/brevo-request";

describe("getBrevoEnv", () => {
  it("returns null when configuration is missing", () => {
    const previousKey = process.env.BREVO_API_KEY;
    const previousSender = process.env.BREVO_SENDER_EMAIL;
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    try {
      assert.equal(getBrevoEnv(), null);
    } finally {
      if (previousKey !== undefined) process.env.BREVO_API_KEY = previousKey;
      else delete process.env.BREVO_API_KEY;
      if (previousSender !== undefined) {
        process.env.BREVO_SENDER_EMAIL = previousSender;
      } else {
        delete process.env.BREVO_SENDER_EMAIL;
      }
    }
  });

  it("returns null when the sender address is invalid", () => {
    const previousKey = process.env.BREVO_API_KEY;
    const previousSender = process.env.BREVO_SENDER_EMAIL;
    process.env.BREVO_API_KEY = "xkeysib-test";
    process.env.BREVO_SENDER_EMAIL = "not-an-email";
    try {
      assert.equal(getBrevoEnv(), null);
    } finally {
      if (previousKey !== undefined) process.env.BREVO_API_KEY = previousKey;
      else delete process.env.BREVO_API_KEY;
      if (previousSender !== undefined) {
        process.env.BREVO_SENDER_EMAIL = previousSender;
      } else {
        delete process.env.BREVO_SENDER_EMAIL;
      }
    }
  });
});

const env = {
  apiKey: "secret-test-key",
  senderEmail: "alerts@scanreview.test",
};

const payload = {
  toEmail: "admin@venue.test",
  subject: "Low rating",
  text: "text",
  html: "<p>html</p>",
};

describe("postBrevoTransactionalEmail", () => {
  it("posts to the Brevo SMTP API with the api-key header", async () => {
    let capturedUrl = "";
    let capturedHeaders: HeadersInit | undefined;
    const result = await postBrevoTransactionalEmail(
      env,
      payload,
      async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init?.headers;
        return new Response(null, { status: 201 });
      },
    );
    assert.equal(result.ok, true);
    assert.equal(capturedUrl, BREVO_SMTP_URL);
    const headers = new Headers(capturedHeaders);
    assert.equal(headers.get("api-key"), env.apiKey);
    assert.equal("apiKey" in result, false);
  });

  it("returns failed on non-success HTTP status without exposing the body", async () => {
    const result = await postBrevoTransactionalEmail(env, payload, async () =>
      new Response("provider-secret-body", { status: 401 }),
    );
    assert.deepEqual(result, { ok: false, reason: "failed" });
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("provider-secret-body"), false);
    assert.equal(serialized.includes("secret-test-key"), false);
  });

  it("returns failed when fetch throws (timeout/abort)", async () => {
    const result = await postBrevoTransactionalEmail(env, payload, async () => {
      throw new Error("AbortError");
    });
    assert.deepEqual(result, { ok: false, reason: "failed" });
  });

  it("does not include guest contact fields in the provider JSON body", async () => {
    let body = "";
    await postBrevoTransactionalEmail(
      env,
      {
        ...payload,
        text: "Cafe received a 1-star rating.",
        html: "<p>Cafe received a 1-star rating.</p>",
      },
      async (_url, init) => {
        body = String(init?.body ?? "");
        return new Response(null, { status: 201 });
      },
    );
    assert.equal(body.includes("contactEmail"), false);
    assert.equal(body.includes("contactPhone"), false);
    assert.equal(body.includes("contactName"), false);
    assert.equal(body.includes("guest"), false);
  });
});
