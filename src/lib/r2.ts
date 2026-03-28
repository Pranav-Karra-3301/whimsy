import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * R2 bucket structure:
 *   originals/{objectId}.{ext}  — Original captured images
 *   googly/{objectId}.jpg       — Images with googly eyes added
 *   cutouts/{objectId}.png      — Cutout/segmented images
 */

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await S3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await S3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export async function listR2Objects(
  prefix: string
): Promise<{ key: string; size: number; lastModified: Date }[]> {
  const result = await S3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  return (result.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size ?? 0,
    lastModified: obj.LastModified ?? new Date(),
  }));
}

export async function objectExistsInR2(key: string): Promise<boolean> {
  try {
    await S3.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/** Extract the R2 key from a full public URL */
export function r2KeyFromUrl(url: string): string | null {
  if (!url || !url.startsWith(PUBLIC_URL)) return null;
  return url.slice(PUBLIC_URL.length + 1); // strip "https://...r2.dev/"
}

/** Delete R2 objects by their public URLs */
export async function deleteObjectImages(...urls: string[]): Promise<void> {
  for (const url of urls) {
    const key = r2KeyFromUrl(url);
    if (key) {
      await deleteFromR2(key);
    }
  }
}
