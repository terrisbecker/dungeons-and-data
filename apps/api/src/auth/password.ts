import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

// Password hashing with Node's built-in scrypt — no external dependency. Each
// hash carries its own random salt; the stored format is "salt:hash" (both hex).
// Verification is constant-time via timingSafeEqual.

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  const stored_ = Buffer.from(hashHex, "hex");
  // Length guard so timingSafeEqual doesn't throw on a malformed stored value.
  if (stored_.length !== derived.length) return false;
  return timingSafeEqual(stored_, derived);
}
