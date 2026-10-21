// Route de santé — support de la surveillance continue.
// Pratiques : P5 Continuous monitoring. Expose un état minimal, SANS détail
// interne exploitable (ASVS 16.5.1) : ni version, ni dépendances, ni chemin.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../config/prisma.js';

export const healthRouter = Router();

// Vivacité : le processus répond.
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Disponibilité : la base est joignable. On n'expose pas le détail de l'erreur.
healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  }),
);
