---
sidebar_position: 7
---

# File Storage (Cloudflare R2)

## What it is

File uploads/downloads go through Cloudflare R2 via presigned URLs — the Express server never
proxies file bytes. `backend/src/services/storage.ts` wraps the AWS SDK's S3 client (R2 is
S3-API-compatible) behind two functions: `getUploadUrl()` and `getDownloadUrl()`.

## Why R2 over the alternatives

R2 over S3 directly mainly for cost — R2 has no egress fees, which matters more to an indie
project's margins than to a funded startup's. Because R2 is S3-API-compatible, the exact same
`@aws-sdk/client-s3` code works against either; only the endpoint URL and region differ, so
switching to real S3 (or any other S3-compatible provider) later is a small, contained change,
not a rewrite.

## The wrapper

```ts title="backend/src/services/storage.ts"
/**
 * The client is built lazily inside each exported function rather than
 * once at module load, so importing this file never crashes when R2
 * credentials aren't configured yet. Only actually calling
 * getUploadUrl/getDownloadUrl without credentials throws a clear
 * AppError instead of a cryptic SDK connection failure.
 */
function getClient(): S3Client {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new AppError(NOT_CONFIGURED_MESSAGE, 500);
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({ Bucket: getBucketName(), Key: key, ContentType: contentType });
  return getSignedUrl(client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS }); // 5 minutes
}

export async function getDownloadUrl(key: string): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: getBucketName(), Key: key });
  return getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS }); // 5 minutes
}
```

This module has no idea who's allowed to write to which key — that's a deliberate boundary.
Permission checks happen one layer up, in the feature module calling it.

## The two-step upload flow (reference: the Items module)

```ts title="backend/src/modules/items/items.service.ts"
export async function requestItemUploadUrl(
  userId: string,
  itemId: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string }> {
  await getOwnedOrThrow(userId, itemId); // permission check happens here, not in storage.ts
  const key = `items/${itemId}/${randomUUID()}`;
  const uploadUrl = await storage.getUploadUrl(key, contentType);
  return { uploadUrl, key };
}

export async function attachItemFile(userId: string, itemId: string, key: string): Promise<Item> {
  await getOwnedOrThrow(userId, itemId);
  return itemsRepository.attachFile(itemId, key);
}
```

1. Client asks the API for an upload URL (`requestItemUploadUrl`) — the API checks ownership,
   mints an R2 object key scoped to that item, and returns a presigned `PUT` URL.
2. The **client PUTs the file bytes directly to R2** using that URL — the request never touches
   the Express server's body.
3. Client calls back (`attachItemFile`) to persist the key once the upload succeeds. The backend
   deliberately doesn't re-verify the object exists in R2 before saving — that would mean a
   synchronous R2 call on every confirmation, trading a cheap DB write for a network round-trip
   with no real safety gain in this reference flow.

Reading a file follows the same shape in reverse: `getItemFileUrl()` checks ownership, then
returns a presigned `GET` URL the client fetches directly from R2.

## Without R2 configured

The app boots fine — `getUploadUrl`/`getDownloadUrl` only throw a clear "not configured"
`AppError` the moment they're actually called, not at startup. Nothing else in the app depends
on R2 being present.
