// Service de jetons.
// Pratiques : P20. ASVS chapitre V7 (sessions) et V9 (jetons autonomes).
//
// Modèle retenu (ADR 0006) :
//   - jeton d'ACCÈS : JWT court (15 min), autonome, signé HS256
//   - jeton de RAFRAÎCHISSEMENT : opaque, aléatoire, stocké haché en base,
//     rotation à chaque usage, détection de réutilisation (ASVS 7.4.1, T07)
//
// Contrôles de sécurité des JWT :
//   - liste d'autorisation d'algorithmes, rejet de "none" (ASVS 9.1.2, T05)
//   - vérification de l'audience et de l'expiration (ASVS 9.2.1, 9.2.3)
//   - secret de signature >= 32 caractères, validé au démarrage (env.ts)

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config/env.js';
import type { Role } from '@prisma/client';

const ISSUER = 'vintage-marketplace';
const AUDIENCE = 'vintage-marketplace-api';
const ALG = 'HS256';

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessTokenClaims {
  sub: string; // id utilisateur
  role: Role;
}

/** Émet un jeton d'accès JWT court. */
export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(secretKey);
}

/**
 * Vérifie un jeton d'accès.
 * jose impose explicitement l'algorithme attendu : un jeton forgé avec
 * "alg: none" ou un autre algorithme est rejeté (ASVS 9.1.2, menace T05).
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, secretKey, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG], // liste d'autorisation stricte
  });
  return extractClaims(payload);
}

function extractClaims(payload: JWTPayload): AccessTokenClaims {
  const sub = payload.sub;
  const role = payload['role'];
  if (typeof sub !== 'string' || typeof role !== 'string') {
    throw new Error('Claims de jeton invalides');
  }
  return { sub, role: role as Role };
}

// --- Jetons de rafraîchissement opaques --------------------------------------

/**
 * Génère un jeton de rafraîchissement opaque (128 bits d'entropie minimum,
 * ASVS 7.2.3) via un CSPRNG. La valeur en clair n'est transmise qu'au client ;
 * seule son empreinte est stockée (même principe que les mots de passe).
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url'); // 256 bits
  const tokenHash = hashRefreshToken(token);
  return { token, tokenHash };
}

/**
 * Empreinte d'un jeton de rafraîchissement. SHA-256 suffit ici : le jeton a
 * déjà une entropie élevée (>= 112 bits), donc une fonction de hachage standard
 * est admise (ASVS 6.5.2). Inutile d'employer Argon2 pour une valeur aléatoire.
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Comparaison à temps constant de deux empreintes (ASVS 11.2.4). */
export function safeHashCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
