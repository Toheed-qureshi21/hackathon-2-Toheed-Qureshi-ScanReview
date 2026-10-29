import { z } from "zod";

export const listSpotsQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
});

export type ListSpotsQuery = z.infer<typeof listSpotsQuerySchema>;
