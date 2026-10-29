import { z } from "zod";

import {
  BUSINESS_TYPES,
  LABEL_PRESETS,
  resolveBusinessType,
  resolveSpotLabel,
  SPOT_COUNT_MAX,
  SPOT_COUNT_MIN,
} from "@/lib/onboarding/constants";

const trimmedString = (max: number) =>
  z.string().trim().min(1).max(max);

export const createOrganizationBodySchema = z
  .object({
    organizationName: trimmedString(120),
    businessType: z.enum(BUSINESS_TYPES),
    customBusinessType: z.string().trim().max(40).optional(),
    labelPreset: z.enum(LABEL_PRESETS),
    customLabel: z.string().trim().max(20).optional(),
    spotCount: z.coerce
      .number()
      .int()
      .min(SPOT_COUNT_MIN)
      .max(SPOT_COUNT_MAX),
    reviewUrl: z.string().trim().max(2048).optional(),
    alertRecipient: z.enum(["me", "manager"]),
    managerName: z.string().trim().max(80).optional(),
    managerEmail: z.string().trim().email().max(254).optional(),
  })
  .superRefine((data, ctx) => {
    const businessType = resolveBusinessType(
      data.businessType,
      data.customBusinessType ?? "",
    );
    if (!businessType) {
      ctx.addIssue({
        code: "custom",
        message: "Enter your type of business.",
        path: ["customBusinessType"],
      });
    }

    const spotLabel = resolveSpotLabel(
      data.labelPreset,
      data.customLabel ?? "",
    );
    if (!spotLabel) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a name for your spots.",
        path: ["customLabel"],
      });
    }

    const review = data.reviewUrl?.trim() ?? "";
    if (review && !/^https:\/\/.+/i.test(review)) {
      ctx.addIssue({
        code: "custom",
        message: "Review links must start with https://",
        path: ["reviewUrl"],
      });
    }

    if (data.alertRecipient === "manager") {
      if (!data.managerName?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Enter your manager’s name.",
          path: ["managerName"],
        });
      }
      if (!data.managerEmail?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid email for your manager.",
          path: ["managerEmail"],
        });
      }
    }
  });

export type CreateOrganizationBody = z.infer<typeof createOrganizationBodySchema>;

export function mapOrganizationBodyToDomain(input: CreateOrganizationBody) {
  const businessType = resolveBusinessType(
    input.businessType,
    input.customBusinessType ?? "",
  );
  const spotLabel = resolveSpotLabel(
    input.labelPreset,
    input.customLabel ?? "",
  );
  const reviewUrl = input.reviewUrl?.trim() || null;

  return {
    name: input.organizationName.trim(),
    businessType,
    labelPreset: input.labelPreset,
    customLabel:
      input.labelPreset === "Custom" ? input.customLabel?.trim() || null : null,
    spotLabel,
    publicReviewUrl: reviewUrl,
    alertRecipient: input.alertRecipient,
    managerName: input.managerName?.trim() || null,
    managerEmail: input.managerEmail?.trim() || null,
    spotCount: input.spotCount,
  };
}
