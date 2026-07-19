import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

const NOT_CONFIGURED_MESSAGE =
  "File storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
  "R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.";

/**
 * R2 is S3-API compatible, so the AWS SDK works against it unmodified -
 * only the endpoint (per-account) and region ("auto") differ from real S3.
 *
 * The client is built lazily inside each exported function rather than
 * once at module load, so importing this file never crashes when R2
 * credentials aren't configured yet (see PERPRO-9's "build now, verify
 * later" note - this module is fully implemented but credential-gated).
 * Only actually calling getUploadUrl/getDownloadUrl without credentials
 * throws, and it throws a clear AppError instead of a cryptic SDK
 * connection failure.
 */
function getClient(): S3Client {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new AppError(NOT_CONFIGURED_MESSAGE, 500);
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function getBucketName(): string {
  if (!env.R2_BUCKET_NAME) {
    throw new AppError(NOT_CONFIGURED_MESSAGE, 500);
  }
  return env.R2_BUCKET_NAME;
}

/**
 * Short-lived (5 min) presigned PUT URL for `key`. The caller is
 * responsible for checking the requester is allowed to write to that key
 * *before* calling this - this function only knows about the storage
 * layer, not app-level permissions (see items.service.ts's
 * requestItemUploadUrl for the permission check in this reference module).
 * The frontend PUTs the file bytes directly to the returned URL; they
 * never pass through this Express server.
 */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

/**
 * Short-lived (5 min) presigned GET URL for a private object. Same
 * permission-check-happens-before-calling-this contract as getUploadUrl.
 */
export async function getDownloadUrl(key: string): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}
