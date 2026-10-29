import { z } from "zod";

export const inviteManagerBodySchema = z.object({
  managerName: z.string().trim().min(1).max(80),
  managerEmail: z.string().trim().email().max(254),
});

export type InviteManagerBody = z.infer<typeof inviteManagerBodySchema>;

/** Client extras like role/organizationId are ignored and never authorized. */
export const acceptInviteBodySchema = z.object({}).passthrough();

export const authConfirmQuerySchema = z.object({
  token_hash: z.string().trim().min(1).max(512),
  type: z.enum([
    "invite",
    "signup",
    "email",
    "magiclink",
    "recovery",
    "email_change",
  ]),
});

export type AuthConfirmQuery = z.infer<typeof authConfirmQuerySchema>;
