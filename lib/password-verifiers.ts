import { pbkdf2Sync } from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Verifies a password against an ASP.NET MVC System.Web.Helpers.Crypto hash
 * Format: Base64(16-byte salt + 32-byte subkey)
 * Uses PBKDF2 with HMACSHA1, 1000 iterations
 */
export function verifyAspNetMvcCryptoPassword(
  password: string,
  hashedPassword: string
): boolean {
  try {
    const hashedBytes = Buffer.from(hashedPassword, 'base64');

    // ASP.NET MVC Crypto uses 16 bytes salt + 32 bytes subkey = 48 bytes total
    if (hashedBytes.length !== 48) {
      return false;
    }

    const salt = hashedBytes.subarray(0, 16);
    const storedSubkey = hashedBytes.subarray(16, 48);

    // PBKDF2 with HMACSHA1, 1000 iterations, 32 bytes subkey
    const derivedSubkey = pbkdf2Sync(password, salt, 1000, 32, 'sha1');

    // Constant-time comparison
    return timingSafeEqual(storedSubkey, derivedSubkey);
  } catch (error) {
    return false;
  }
}

/**
 * Verifies a password against a .NET Core Identity password hash
 * Supports V2 and V3 formats
 */
export function verifyDotNetCoreIdentityPassword(
  password: string,
  hashedPassword: string
): boolean {
  try {
    const hashedBytes = Buffer.from(hashedPassword, 'base64');

    if (hashedBytes.length === 0) {
      return false;
    }

    const version = hashedBytes[0];

    if (version === 0x00) {
      // V2 format: 0x00 | prf (4 bytes) | iter count (4 bytes) | salt size (4 bytes) | salt | subkey
      return verifyPasswordHasherV2(password, hashedBytes);
    } else if (version === 0x01) {
      // V3 format: 0x01 | prf (4 bytes) | iter count (4 bytes) | salt size (4 bytes) | salt | subkey
      return verifyPasswordHasherV3(password, hashedBytes);
    }

    return false;
  } catch (error) {
    return false;
  }
}

function verifyPasswordHasherV2(password: string, hashedBytes: Buffer): boolean {
  // V2: 0x00 | prf (4 bytes) | iter count (4 bytes) | salt size (4 bytes) | salt | subkey
  if (hashedBytes.length < 13) {
    return false;
  }

  const prf = hashedBytes.readUInt32BE(1);
  const iterCount = hashedBytes.readUInt32BE(5);
  const saltSize = hashedBytes.readUInt32BE(9);

  if (hashedBytes.length < 13 + saltSize) {
    return false;
  }

  const salt = hashedBytes.subarray(13, 13 + saltSize);
  const storedSubkey = hashedBytes.subarray(13 + saltSize);
  const subkeyLength = storedSubkey.length;

  const algorithm = getAlgorithmFromPrf(prf);
  if (!algorithm) {
    return false;
  }

  const derivedSubkey = pbkdf2Sync(password, salt, iterCount, subkeyLength, algorithm);

  return timingSafeEqual(storedSubkey, derivedSubkey);
}

function verifyPasswordHasherV3(password: string, hashedBytes: Buffer): boolean {
  // V3: 0x01 | prf (4 bytes) | iter count (4 bytes) | salt size (4 bytes) | salt | subkey
  if (hashedBytes.length < 13) {
    return false;
  }

  const prf = hashedBytes.readUInt32BE(1);
  const iterCount = hashedBytes.readUInt32BE(5);
  const saltSize = hashedBytes.readUInt32BE(9);

  if (hashedBytes.length < 13 + saltSize) {
    return false;
  }

  const salt = hashedBytes.subarray(13, 13 + saltSize);
  const storedSubkey = hashedBytes.subarray(13 + saltSize);
  const subkeyLength = storedSubkey.length;

  const algorithm = getAlgorithmFromPrf(prf);
  if (!algorithm) {
    return false;
  }

  const derivedSubkey = pbkdf2Sync(password, salt, iterCount, subkeyLength, algorithm);

  return timingSafeEqual(storedSubkey, derivedSubkey);
}

function getAlgorithmFromPrf(prf: number): string | null {
  // KeyDerivationPrf enum values
  switch (prf) {
    case 0: // HMACSHA1
      return 'sha1';
    case 1: // HMACSHA256
      return 'sha256';
    case 2: // HMACSHA512
      return 'sha512';
    default:
      return null;
  }
}

/**
 * Timing-safe buffer comparison
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

/**
 * Hashes a password using bcrypt for the migration
 */
export async function hashPasswordBcrypt(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifies a password against a bcrypt hash
 */
export async function verifyBcryptPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Attempts to verify a password using all known hash formats
 * Returns the verification result and the hash type
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ verified: boolean; hashType: 'legacy' | 'identity' | 'bcrypt' | 'unknown' }> {
  // Check if it's already a bcrypt hash
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    const verified = await verifyBcryptPassword(password, storedHash);
    return { verified, hashType: 'bcrypt' };
  }

  // Try legacy ASP.NET MVC Crypto first (as requested)
  if (verifyAspNetMvcCryptoPassword(password, storedHash)) {
    return { verified: true, hashType: 'legacy' };
  }

  // Try .NET Core Identity
  if (verifyDotNetCoreIdentityPassword(password, storedHash)) {
    return { verified: true, hashType: 'identity' };
  }

  return { verified: false, hashType: 'unknown' };
}
