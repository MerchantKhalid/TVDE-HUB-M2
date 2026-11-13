import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { del, get, put } from "@vercel/blob";

/**
 * File storage with two visibilities:
 *  - "public":  profile photos / logos. Served straight from the public Blob store.
 *  - "private": legal documents. Never reachable by URL; only streamed through
 *               /api/documents/[id]/file after an authorization check.
 *
 * Production uses two Vercel Blob stores (one Public, one Private), each with its own token.
 * In development, when a token is missing, files are written to local folders instead so you
 * can work without a Vercel account. Production without tokens fails loudly on purpose.
 */
export type Visibility = "public" | "private";

const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads");
const PRIVATE_DIR = path.join(process.cwd(), ".private-uploads");

function tokenFor(visibility: Visibility): string | undefined {
  return visibility === "public"
    ? process.env.BLOB_PUBLIC_READ_WRITE_TOKEN
    : process.env.BLOB_PRIVATE_READ_WRITE_TOKEN;
}

function shouldUseLocalDisk(visibility: Visibility): boolean {
  if (tokenFor(visibility)) return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Storage is not configured: set ${
        visibility === "public" ? "BLOB_PUBLIC_READ_WRITE_TOKEN" : "BLOB_PRIVATE_READ_WRITE_TOKEN"
      }.`,
    );
  }
  return true;
}

function localPath(visibility: Visibility, key: string): string {
  const base = visibility === "public" ? PUBLIC_DIR : PRIVATE_DIR;
  const resolved = path.resolve(base, key);
  if (!resolved.startsWith(base + path.sep)) throw new Error("Invalid storage key");
  return resolved;
}

export type StoredFile = {
  /** Storage pathname. For private files this is what we keep in Document.fileKey. */
  key: string;
  /** Public URL (public files only). */
  url: string | null;
};

export async function storeFile(input: {
  visibility: Visibility;
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<StoredFile> {
  const { visibility, key, body, contentType } = input;

  if (shouldUseLocalDisk(visibility)) {
    const target = localPath(visibility, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return { key, url: visibility === "public" ? `/uploads/${key}` : null };
  }

  const result = await put(key, body, {
    access: visibility,
    token: tokenFor(visibility),
    contentType,
    addRandomSuffix: true,
  });
  return { key: result.pathname, url: visibility === "public" ? result.url : null };
}

export async function readPrivateFile(
  key: string,
): Promise<{ stream: ReadableStream<Uint8Array>; size: number | null } | null> {
  if (shouldUseLocalDisk("private")) {
    const target = localPath("private", key);
    try {
      const info = await stat(target);
      const stream = Readable.toWeb(createReadStream(target)) as ReadableStream<Uint8Array>;
      return { stream, size: info.size };
    } catch {
      return null;
    }
  }

  const result = await get(key, { access: "private", token: tokenFor("private") });
  if (!result || result.statusCode !== 200) return null;
  return { stream: result.stream, size: result.blob.size };
}

/** Best-effort delete: a missing file must never block a database change. */
export async function deleteFile(visibility: Visibility, keyOrUrl: string): Promise<void> {
  try {
    if (shouldUseLocalDisk(visibility)) {
      const key = keyOrUrl.startsWith("/uploads/") ? keyOrUrl.slice("/uploads/".length) : keyOrUrl;
      await rm(localPath(visibility, key), { force: true });
      return;
    }
    await del(keyOrUrl, { token: tokenFor(visibility) });
  } catch (error) {
    console.error("[storage] delete failed", error);
  }
}
