import { z } from "zod";

import { isValidPublicSpotTokenFormat } from "@/lib/spots/public-token";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PUBLIC_FEEDBACK_MAX_JSON_BYTES = 8192;
export const COMMENT_MAX_LENGTH = 500;
export const CONTACT_NAME_MAX_LENGTH = 80;
export const CONTACT_VALUE_MAX_LENGTH = 254;

export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
export const PHONE_PATTERN = /^[+]?[\d\s().-]{7,}$/;

export const publicSpotQuerySchema = z.object({
  token: z
    .string()
    .trim()
    .min(16)
    .max(64)
    .refine(isValidPublicSpotTokenFormat, "Invalid public token."),
  organizationId: z
    .string()
    .trim()
    .regex(UUID_RE, "Invalid organization id."),
});

export type PublicSpotQuery = z.infer<typeof publicSpotQuerySchema>;

export const createPublicFeedbackBodySchema = z.object({
  token: z
    .string()
    .trim()
    .min(16)
    .max(64)
    .refine(isValidPublicSpotTokenFormat, "Invalid public token."),
  organizationId: z
    .string()
    .trim()
    .regex(UUID_RE, "Invalid organization id."),
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(COMMENT_MAX_LENGTH)
    .optional()
    .nullable(),
  contactName: z
    .string()
    .trim()
    .max(CONTACT_NAME_MAX_LENGTH)
    .optional()
    .nullable(),
  contact: z
    .string()
    .trim()
    .max(CONTACT_VALUE_MAX_LENGTH)
    .optional()
    .nullable(),
});

export type CreatePublicFeedbackBody = z.infer<
  typeof createPublicFeedbackBodySchema
>;

export type ParsedContact = {
  contactEmail: string | null;
  contactPhone: string | null;
};

export function parseOptionalContact(
  contact: string | null | undefined,
): { ok: true; value: ParsedContact } | { ok: false; message: string } {
  const trimmed = contact?.trim() ?? "";
  if (!trimmed) {
    return { ok: true, value: { contactEmail: null, contactPhone: null } };
  }

  if (trimmed.includes("@")) {
    if (!EMAIL_PATTERN.test(trimmed)) {
      return { ok: false, message: "Enter a valid email or phone number." };
    }
    return {
      ok: true,
      value: { contactEmail: trimmed, contactPhone: null },
    };
  }

  const digitCount = trimmed.replace(/\D/g, "").length;
  if (!PHONE_PATTERN.test(trimmed) || digitCount < 7) {
    return { ok: false, message: "Enter a valid email or phone number." };
  }

  return {
    ok: true,
    value: { contactEmail: null, contactPhone: trimmed },
  };
}

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
