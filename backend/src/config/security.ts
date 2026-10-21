// En-têtes de sécurité HTTP et politique CORS.
// Pratique : P20. ASVS V3 (en-têtes de réponse de sécurité), 3.4.x (CORS),
// 3.2.x (en-têtes de contenu). Menaces : T25 (XSS), T35 (clickjacking),
// T36 (CORS permissif), T46 (fuite via Referer).

import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import type { RequestHandler } from 'express';
import { corsAllowedOrigins, isProduction } from './env.js';
import { logSecurityEvent } from './logger.js';

/**
 * Helmet pose un ensemble d'en-têtes défensifs : CSP, X-Content-Type-Options,
 * X-Frame-Options (anti-clickjacking, T35), Referrer-Policy, etc.
 * L'API ne sert que du JSON ; une CSP stricte interdit tout script (T25).
 */
export function securityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"], // anti-clickjacking (T35)
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    // L'API est consommée en cross-origin par le front : on n'impose pas
    // Cross-Origin-Embedder-Policy qui casserait les requêtes légitimes.
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' }, // T46
    hsts: isProduction ? { maxAge: 15552000, includeSubDomains: true } : false,
  });
}

/**
 * CORS sur LISTE D'AUTORISATION stricte (ASVS 3.4.2, menace T36).
 * Aucune origine générique "*". Une origine inconnue est refusée et journalisée.
 * Les requêtes sans origine (curl, same-origin, outils serveur) sont permises
 * car elles ne relèvent pas du modèle de menace CORS (pas de navigateur tiers).
 */
export function corsPolicy(): RequestHandler {
  const options: CorsOptions = {
    origin(origin, callback) {
      if (!origin || corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      logSecurityEvent('authz.denied', {
        reason: `origine CORS refusée: ${origin}`,
      });
      callback(new Error('Origine non autorisée par la politique CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  };
  return cors(options);
}
