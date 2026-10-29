import { formatSpotName, SPOT_COUNT_MAX } from "@/lib/onboarding/constants";

export class SpotLimitReachedError extends Error {
  readonly name = "SpotLimitReachedError";
  readonly code = "SPOT_LIMIT_REACHED";
  readonly status = 409;

  constructor(
    message = "This organization already has 50 QR codes, the maximum allowed.",
  ) {
    super(message);
  }
}

export type NextSpotAllocation =
  | { ok: true; number: number; displayName: string }
  | { ok: false; reason: "SPOT_LIMIT_REACHED" };

/** Next sequential number from trusted existing rows — never from client input. */
export function allocateNextSpot(
  existingNumbers: readonly number[],
  spotLabel: string,
  maxSpots = SPOT_COUNT_MAX,
): NextSpotAllocation {
  if (existingNumbers.length >= maxSpots) {
    return { ok: false, reason: "SPOT_LIMIT_REACHED" };
  }

  const highest = existingNumbers.reduce(
    (max, value) => (value > max ? value : max),
    0,
  );
  const number = highest + 1;
  const label = spotLabel.trim();

  return {
    ok: true,
    number,
    displayName: formatSpotName(label, number),
  };
}

/**
 * Same outcome as creating spots while holding an organization row lock:
 * allocations see each prior insert before choosing the next number.
 */
export function applySerializedSpotAllocations(
  existingNumbers: readonly number[],
  spotLabel: string,
  attempts: number,
  maxSpots = SPOT_COUNT_MAX,
): {
  numbers: number[];
  successes: number;
  limitRejections: number;
} {
  const numbers = [...existingNumbers];
  let successes = 0;
  let limitRejections = 0;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = allocateNextSpot(numbers, spotLabel, maxSpots);
    if (!result.ok) {
      limitRejections += 1;
      continue;
    }
    numbers.push(result.number);
    successes += 1;
  }

  return { numbers, successes, limitRejections };
}
