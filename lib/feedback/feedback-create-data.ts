export function buildFeedbackCreateData(
  spot: { id: string; organizationId: string },
  input: {
    rating: number;
    comment: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  },
) {
  return {
    organizationId: spot.organizationId,
    spotId: spot.id,
    rating: input.rating,
    comment: input.comment,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
  };
}
