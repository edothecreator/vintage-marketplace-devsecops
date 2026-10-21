// Limitation de débit — anti-automatisation.
// Pratique : P20, pratique Tier 1 adjacente (anti-automatisation ASVS 2.4.1).
// Menaces couvertes : T01 bourrage d'identifiants, T02 force brute,
// T09 DoS par hachage, T11 moissonnage, T34 création massive de commandes,
// T45 abus du quota IA.
//
// Décision (ADR 0006, ASVS 6.1.1) : limitation de débit, JAMAIS blocage de
// compte — un blocage serait lui-même un vecteur de déni de service contre un
// utilisateur ciblé.

import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { logSecurityEvent } from '../config/logger.js';

function build(opts: {
  windowMs: number;
  limit: number;
  name: string;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Message générique (pas de détail exploitable).
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Trop de requêtes. Réessayez plus tard.' } },
    handler: (req, res, _next, options) => {
      logSecurityEvent('ratelimit.triggered', {
        ip: req.ip,
        resource: req.originalUrl,
        action: req.method,
        reason: opts.name,
      });
      res.status(options.statusCode).json(options.message);
    },
  });
}

// Connexion / inscription : strict (ADR 0006 — 30/IP/15 min pour l'auth).
export const authLimiter = build({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  name: 'auth',
});

// Recherche : 60/min/IP (ADR 0006).
export const searchLimiter = build({
  windowMs: 60 * 1000,
  limit: 60,
  name: 'search',
});

// Écritures générales (commandes, annonces, avis).
export const writeLimiter = build({
  windowMs: 60 * 1000,
  limit: 30,
  name: 'write',
});

// Endpoint IA : plus strict (le quota gratuit est une ressource rare, T45).
export const aiLimiter = build({
  windowMs: 60 * 1000,
  limit: 5,
  name: 'ai',
});
