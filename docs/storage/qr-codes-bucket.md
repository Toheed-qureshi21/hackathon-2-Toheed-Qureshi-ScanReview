# QR codes — Supabase Storage (`scanreview-qr-codes`)

Public PNG QR images for spot feedback URLs. No guest PII or feedback data is stored here.

## Bucket

| Setting | Value |
|--------|--------|
| Name | `scanreview-qr-codes` |
| Public | **Yes** (intentional — printable QR codes) |
| Object path | `organizations/{organizationId}/spots/{spotId}.png` |

Onboarding calls `ensureQrCodesBucket()` server-side: it uses the **service role** to `getBucket`, then `createBucket` with `{ public: true }` if missing. You can also create the bucket manually in the Supabase dashboard with the same name and public access.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL (public object URLs) |
| `SUPABASE_SECRET_KEY` | Yes | Service role — Storage upload/delete on server only |
| `APP_URL` or `NEXT_PUBLIC_APP_URL` | Recommended | Encoded in QR as the guest feedback link origin |

Do not put `SUPABASE_SECRET_KEY` in any `NEXT_PUBLIC_*` variable.

## Migrations

After pulling schema changes:

```bash
npx prisma migrate deploy
# or locally:
npx prisma migrate dev
```

Adds nullable `Spot.qrStoragePath`.

## Verify uploads

1. Complete admin onboarding in the app.
2. In Supabase → **Storage** → `scanreview-qr-codes`, open `organizations/{orgId}/spots/`.
3. Confirm `{spotId}.png` files exist and open in the browser.
4. Public URL shape:  
   `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scanreview-qr-codes/organizations/.../spots/....png`

## Failure behavior

Storage and Postgres are not one transaction. If QR upload fails after the DB rows are created, the server removes uploaded objects (best effort) and deletes the new organization (cascade removes spots/members). The API returns `QR_STORAGE_FAILED` — the client must not show success.
