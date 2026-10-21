// Assemblage de l'application Express (sans écoute réseau — testable).
// Pratiques : P20. ASVS V3 (en-têtes), V13 (API), 16.5 (gestion d'erreurs).
//
// Ordre des intergiciels (important pour la sécurité) :
//   1. En-têtes de sécurité (Helmet) AVANT toute route.
//   2. CORS sur liste d'autorisation.
//   3. Parseurs de corps avec LIMITE de taille (anti-DoS, T23).
//      NB : express.raw pour les images est appliqué par route, pas globalement.
//   4. Journalisation des requêtes (avec expurgation, cf. logger.ts).
//   5. Routes métier.
//   6. 404 puis gestionnaire d'erreurs central EN DERNIER.

import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { apiRouter } from './routes/index.js';
import { healthRouter } from './routes/health.routes.js';
import { securityHeaders, corsPolicy } from './config/security.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Derrière un proxy (déploiement), req.ip doit refléter X-Forwarded-For pour
  // que la limitation de débit par IP soit correcte. On fait confiance à un
  // seul saut de proxy (ASVS 2.4.x). En local sans proxy, cela reste sûr.
  app.set('trust proxy', 1);
  app.disable('x-powered-by'); // ne pas divulguer la pile (T46)

  // 1-2. En-têtes de sécurité + CORS.
  app.use(securityHeaders());
  app.use(corsPolicy());

  // 3. Parseur JSON avec limite stricte (anti-DoS par corps volumineux, T23).
  //    express.raw (images) est monté par route, donc placé AVANT ce parseur
  //    dans les routeurs concernés — express.json n'intercepte pas le binaire
  //    image car il ne correspond pas au type application/json.
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieParser());

  // 4. Journalisation structurée des requêtes (expurgation configurée).
  app.use(pinoHttp({ logger }));

  // 5. Routes.
  app.use(healthRouter);
  app.use('/api', apiRouter);

  // 6. 404 puis gestionnaire d'erreurs — toujours en dernier.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
