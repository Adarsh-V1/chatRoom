const encoder = new TextEncoder();
const LEGACY_PASSWORD_RE = /^[A-Za-z]{4,5}$/;
const STRONG_PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim().toLowerCase();
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    const byteHex = normalized.slice(i * 2, i * 2 + 2);
    out[i] = Number.parseInt(byteHex, 16);
  }
  return out;
}

export function validatePasswordForRegistration(password: string): void {
  const trimmed = password.trim();
  if (!STRONG_PASSWORD_RE.test(trimmed)) {
    throw new Error(
      "Password must be 8-72 chars and include letters, numbers, and a symbol"
    );
  }
}

export function validatePasswordForLogin(password: string): void {
  const trimmed = password.trim();
  if (STRONG_PASSWORD_RE.test(trimmed)) return;
  if (LEGACY_PASSWORD_RE.test(trimmed)) return;
  throw new Error(
    "Password format invalid (use your legacy 4-5 letter password or a strong password)"
  );
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const aa = a.trim().toLowerCase();
  const bb = b.trim().toLowerCase();
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i += 1) {
    diff |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  }
  return diff === 0;
}

function randomSaltHex(byteLength = 16): string {
  const salt = new Uint8Array(byteLength);
  crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

async function pbkdf2HashHex(password: string, saltHex: string): Promise<string> {
  const salt = hexToBytes(saltHex);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 120_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(bits));
}

async function sha256HashHex(password: string, saltHex: string): Promise<string> {
  const salt = hexToBytes(saltHex);
  const pwd = encoder.encode(password);
  const combined = new Uint8Array(salt.length + pwd.length);
  combined.set(salt, 0);
  combined.set(pwd, salt.length);
  const digest = await crypto.subtle.digest("SHA-256", combined);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashPassword(password: string): Promise<{
  saltHex: string;
  hashHex: string;
}> {
  validatePasswordForRegistration(password);
  const saltHex = randomSaltHex(16);
  try {
    const hashHex = await pbkdf2HashHex(password, saltHex);
    return { saltHex, hashHex };
  } catch {
    const hashHex = await sha256HashHex(password, saltHex);
    return { saltHex, hashHex };
  }
}

export async function verifyPassword(params: {
  password: string;
  saltHex: string;
  expectedHashHex: string;
}): Promise<boolean> {
  validatePasswordForLogin(params.password);

  let computed: string;
  try {
    computed = await pbkdf2HashHex(params.password, params.saltHex);
  } catch {
    computed = await sha256HashHex(params.password, params.saltHex);
  }

  return timingSafeEqualHex(computed, params.expectedHashHex);
}

// Backward-compatible exports for older imports.
export const validateShortPassword = validatePasswordForRegistration;
export const hashShortPassword = hashPassword;
export const verifyShortPassword = verifyPassword;
