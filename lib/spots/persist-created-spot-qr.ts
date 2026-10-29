import { publicSpotFeedbackUrl } from "@/lib/feedback/public-spot-url";
import { spotQrStoragePath } from "@/lib/storage/qr-codes-constants";

export class QrPersistenceFailedError extends Error {
  readonly name = "QrPersistenceFailedError";
}

export type PersistCreatedSpotQrInput = {
  organizationId: string;
  spotId: string;
  publicToken: string;
  appOrigin: string;
  renderPng: (publicFeedbackUrl: string) => Promise<Buffer>;
  upload: (storagePath: string, png: Buffer) => Promise<void>;
  savePath: (spotId: string, storagePath: string) => Promise<void>;
  rollback: (spotId: string, uploadedPaths: string[]) => Promise<void>;
};

export function isDemoFeedbackUrl(url: string): boolean {
  return /\/feedback\/demo(?:[/?#]|$)/i.test(url);
}

/**
 * Render, upload, and persist the QR path. Roll back the spot on any failure
 * so callers never report success for an unusable record.
 */
export async function persistCreatedSpotQr(
  input: PersistCreatedSpotQrInput,
): Promise<string> {
  const storagePath = spotQrStoragePath(input.organizationId, input.spotId);
  const uploadedPaths: string[] = [];

  try {
    const publicFeedbackUrl = publicSpotFeedbackUrl(
      input.appOrigin,
      input.organizationId,
      input.publicToken,
    );
    if (isDemoFeedbackUrl(publicFeedbackUrl)) {
      throw new Error("Refusing to persist a demo feedback URL.");
    }

    const png = await input.renderPng(publicFeedbackUrl);
    await input.upload(storagePath, png);
    uploadedPaths.push(storagePath);
    await input.savePath(input.spotId, storagePath);
    return storagePath;
  } catch (error) {
    await input.rollback(input.spotId, uploadedPaths);
    if (error instanceof QrPersistenceFailedError) {
      throw error;
    }
    throw new QrPersistenceFailedError();
  }
}
