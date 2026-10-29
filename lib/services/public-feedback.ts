import "server-only";

import { prisma } from "@/lib/db/prisma";
import { buildFeedbackCreateData } from "@/lib/feedback/feedback-create-data";
import { resolveSpotForFeedbackWrite } from "@/lib/services/public-spot";
import type { PublicFeedbackDto } from "@/types/public-feedback";
import {
  emptyToNull,
  parseOptionalContact,
  type CreatePublicFeedbackBody,
} from "@/lib/validations/public-feedback";

export class PublicFeedbackValidationError extends Error {
  readonly name = "PublicFeedbackValidationError";
  constructor(message: string) {
    super(message);
  }
}

export async function createPublicFeedback(
  body: CreatePublicFeedbackBody,
): Promise<PublicFeedbackDto> {
  const spot = await resolveSpotForFeedbackWrite({
    token: body.token,
    organizationId: body.organizationId,
  });

  const contact = parseOptionalContact(body.contact);
  if (!contact.ok) {
    throw new PublicFeedbackValidationError(contact.message);
  }

  const data = buildFeedbackCreateData(spot, {
    rating: body.rating,
    comment: emptyToNull(body.comment),
    contactName: emptyToNull(body.contactName),
    contactEmail: contact.value.contactEmail,
    contactPhone: contact.value.contactPhone,
  });

  const row = await prisma.feedback.create({ data });

  return {
    id: row.id,
    rating: row.rating,
    createdAt: row.createdAt.toISOString(),
  };
}
