// Service d'authentification — orchestre mots de passe, jetons et sessions.
// Pratiques : P20. ASVS V6 (authentification), V7 (sessions).
//
// Décisions clés :
//   - rotation du jeton de rafraîchissement à chaque usage, avec détection de
//     réutilisation et révocation en cascade (ASVS 7.4.1, menace T07)
//   - message d'erreur générique et uniforme pour empêcher l'énumération de
//     comptes (ASVS 6.3.8, menace T03)
//   - aucun compte par défaut (ASVS 6.3.2) — les comptes sont créés via le seed

import { addDays } from '../utils/time.js';
import { prisma } from '../config/prisma.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} from './password.service.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from './token.service.js';
import { UnauthorizedError, ConflictError } from '../errors/AppError.js';
import { logSecurityEvent } from '../config/logger.js';
import type { Role, User } from '@prisma/client';

const REFRESH_TTL_DAYS = 7;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: Role };
}

function toPublicUser(user: User): { id: string; email: string; role: Role } {
  // DTO : on ne renvoie jamais passwordHash ni les timestamps internes
  // (ASVS 15.3.1, minimisation de l'exposition).
  return { id: user.id, email: user.email, role: user.role };
}

/** Inscription. Le rôle n'est JAMAIS accepté du client (menace T40). */
export async function register(
  email: string,
  password: string,
  ip: string | undefined,
): Promise<AuthResult> {
  validatePasswordPolicy(password);

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // On renvoie un conflit générique. On ne précise pas « e-mail déjà
    // utilisé » de manière exploitable pour énumérer (ASVS 6.3.8).
    throw new ConflictError("Impossible de créer le compte avec ces informations.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash, role: 'BUYER' },
  });

  logSecurityEvent('auth.login.success', { userId: user.id, ip, reason: 'register' });
  return issueSession(user);
}

/**
 * Connexion. En cas d'échec, message identique que l'e-mail existe ou non,
 * et on effectue tout de même une vérification de mot de passe sur une
 * empreinte factice pour homogénéiser le temps de réponse (ASVS 6.3.8, T03).
 */
export async function login(
  email: string,
  password: string,
  ip: string | undefined,
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    // Comparaison factice pour éviter une différence de timing révélatrice.
    await verifyPassword(
      '$argon2id$v=19$m=19456,t=2,p=1$YWFhYWFhYWFhYWFhYWFhYQ$' +
        'Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyMA',
      password,
    );
    logSecurityEvent('auth.login.failure', { ip, reason: 'compte inexistant' });
    throw new UnauthorizedError('Identifiants invalides.');
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    logSecurityEvent('auth.login.failure', { userId: user.id, ip, reason: 'mot de passe' });
    throw new UnauthorizedError('Identifiants invalides.');
  }

  logSecurityEvent('auth.login.success', { userId: user.id, ip });
  return issueSession(user);
}

/** Crée une nouvelle session : jeton d'accès + jeton de rafraîchissement. */
async function issueSession(user: User): Promise<AuthResult> {
  const accessToken = await signAccessToken({ sub: user.id, role: user.role });
  const { token, tokenHash } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: addDays(new Date(), REFRESH_TTL_DAYS),
    },
  });

  return { accessToken, refreshToken: token, user: toPublicUser(user) };
}

/**
 * Rafraîchissement avec ROTATION et détection de réutilisation (ASVS 7.4.1).
 *
 * Si un jeton déjà révoqué est présenté, cela signale un vol probable (le
 * jeton a été utilisé deux fois) : on révoque alors TOUS les jetons de
 * l'utilisateur (menace T07).
 */
export async function refresh(
  presentedToken: string,
  ip: string | undefined,
): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(presentedToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored) {
    throw new UnauthorizedError('Session invalide.');
  }

  // Jeton déjà révoqué présenté à nouveau -> réutilisation détectée.
  if (stored.revokedAt) {
    logSecurityEvent('auth.token.reuse_detected', { userId: stored.userId, ip });
    // Révocation en cascade : toute la chaîne de l'utilisateur.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError('Session invalide.');
  }

  if (stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Session expirée.');
  }

  // Rotation : on révoque l'ancien et on en émet un nouveau.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  logSecurityEvent('auth.token.refresh', { userId: stored.userId, ip });
  return issueSession(stored.user);
}

/** Déconnexion : révoque le jeton de rafraîchissement présenté. */
export async function logout(presentedToken: string, ip: string | undefined): Promise<void> {
  const tokenHash = hashRefreshToken(presentedToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  logSecurityEvent('auth.logout', { ip });
}
