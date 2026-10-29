import { generatePublicSpotToken } from "@/lib/spots/public-token";

type PublicTokenLookup = {
  findUnique: (args: {
    where: { publicToken: string };
    select: { id: true };
  }) => Promise<{ id: string } | null>;
};

/** Allocate a unique opaque token; never use sequential or client-supplied values. */
export async function reserveUniquePublicSpotToken(
  spots: PublicTokenLookup,
): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const token = generatePublicSpotToken();
    const existing = await spots.findUnique({
      where: { publicToken: token },
      select: { id: true },
    });
    if (!existing) {
      return token;
    }
  }
  throw new Error("Unable to allocate a unique public token.");
}
