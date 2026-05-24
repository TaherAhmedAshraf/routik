import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production';
const ALGORITHM = 'sha256';

export interface TokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresInMs = 86400000): string {
  const iat = Date.now();
  const exp = iat + expiresInMs;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat, exp })).toString('base64url');
  const signature = createHmac(ALGORITHM, SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const [header, body, signature] = parts;
  const expectedSig = createHmac(ALGORITHM, SECRET).update(`${header}.${body}`).digest('base64url');

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    throw new Error('Invalid token signature');
  }

  const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (Date.now() > payload.exp) throw new Error('Token expired');

  return payload;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHmac(ALGORITHM, salt).update(password).digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const expected = createHmac(ALGORITHM, salt).update(password).digest('hex');
  return hash === expected;
}
