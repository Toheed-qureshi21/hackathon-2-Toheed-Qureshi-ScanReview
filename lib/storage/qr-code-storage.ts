import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  QR_CODES_BUCKET,
  QR_PNG_CONTENT_TYPE,
} from "@/lib/storage/qr-codes-constants";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export class QrStorageError extends Error {
  readonly name = "QrStorageError";
}

let bucketReady: Promise<void> | null = null;

export async function ensureQrCodesBucket(
  admin: SupabaseClient = getSupabaseAdminClient(),
): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data, error: getError } =
        await admin.storage.getBucket(QR_CODES_BUCKET);
      if (data) {
        return;
      }
      if (getError && !getError.message.toLowerCase().includes("not found")) {
        throw new QrStorageError("Unable to verify QR storage bucket.");
      }

      const { error: createError } = await admin.storage.createBucket(
        QR_CODES_BUCKET,
        { public: true },
      );
      if (createError) {
        const msg = createError.message.toLowerCase();
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          return;
        }
        throw new QrStorageError("Unable to create QR storage bucket.");
      }
    })();
  }
  await bucketReady;
}

export async function uploadSpotQrPng(
  storagePath: string,
  png: Buffer,
  admin: SupabaseClient = getSupabaseAdminClient(),
): Promise<void> {
  await ensureQrCodesBucket(admin);
  const { error } = await admin.storage
    .from(QR_CODES_BUCKET)
    .upload(storagePath, png, {
      contentType: QR_PNG_CONTENT_TYPE,
      upsert: true,
    });
  if (error) {
    throw new QrStorageError("Unable to upload QR image.");
  }
}

export async function removeQrObjects(
  storagePaths: string[],
  admin: SupabaseClient = getSupabaseAdminClient(),
): Promise<void> {
  if (storagePaths.length === 0) {
    return;
  }
  const { error } = await admin.storage
    .from(QR_CODES_BUCKET)
    .remove(storagePaths);
  if (error) {
    console.error(
      "[qr-storage] Failed to remove orphaned QR objects:",
      error.message,
    );
  }
}
