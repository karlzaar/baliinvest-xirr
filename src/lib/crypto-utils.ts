/**
 * Enterprise Crypto Utilities
 * Browser-compatible cryptographic operations using Web Crypto API
 * Adapted from Pellago enterprise security standards
 */

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert ArrayBuffer to hex string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert string to ArrayBuffer
 */
export function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

// ============================================================================
// Random Generation
// ============================================================================

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate UUID v4
 */
export function uuid(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bufferToHex(bytes.buffer as ArrayBuffer);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ============================================================================
// Key Derivation (PBKDF2)
// ============================================================================

/**
 * Derive key bits from a password using PBKDF2
 */
export async function deriveKeyBits(
  password: string,
  salt: Uint8Array,
  bits = 256,
  iterations = 100000
): Promise<ArrayBuffer> {
  const passwordBuffer = stringToBuffer(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    bits
  );
}

// ============================================================================
// Password Hashing (Enterprise Grade)
// ============================================================================

const PBKDF2_ITERATIONS = 100000;

/**
 * Hash a password for storage using PBKDF2
 * Format: iterations$salt$hash (all base64)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveKeyBits(password, salt, 256, PBKDF2_ITERATIONS);

  return `${PBKDF2_ITERATIONS}$${bufferToBase64(salt.buffer as ArrayBuffer)}$${bufferToBase64(derivedKey)}`;
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }

  const [iterationsStr, saltBase64, hashBase64] = parts;
  const iterations = parseInt(iterationsStr, 10);

  if (isNaN(iterations) || iterations < 1) {
    return false;
  }

  try {
    const salt = base64ToBuffer(saltBase64);
    const derivedKey = await deriveKeyBits(password, salt, 256, iterations);
    const derivedBase64 = bufferToBase64(derivedKey);

    return timingSafeEqual(derivedBase64, hashBase64);
  } catch {
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// Password Strength Checking
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-7
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
}

/**
 * Check password strength and provide feedback
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length < 8) feedback.push('Use at least 8 characters');

  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 1;
  }

  if (/^[0-9]+$/.test(password)) {
    score -= 2;
    feedback.push('Don\'t use only numbers');
  }

  const finalScore = Math.max(0, Math.min(7, score));

  let level: PasswordStrength['level'];
  if (finalScore <= 2) level = 'weak';
  else if (finalScore <= 4) level = 'fair';
  else if (finalScore <= 5) level = 'good';
  else level = 'strong';

  return { score: finalScore, level, feedback };
}

// ============================================================================
// Session Token Generation
// ============================================================================

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  const bytes = randomBytes(32);
  return bufferToHex(bytes.buffer as ArrayBuffer);
}
