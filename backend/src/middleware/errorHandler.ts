// Gestionnaire d'erreurs de dernier recours.
// Pratique : P20. ASVS 16.5.1, 16.5.3, 16.5.4.
//
// - Toute erreur attendue (AppError) renvoie son message public.
// - Toute erreur INATTENDUE renvoie un message générique 500 et journalise le
//   détail côté serveur uniquement (ASVS 16.5.1, menace T51).
// - Ce gestionnaire intercepte tout, pour qu'aucune exception non gérée ne
//   fasse fuiter une trace ni ne paralyse le processus (ASVS 16.5.4).

import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../errors/AppError.js';
import { logger, logSecurityEvent } from '../config/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ressource introuvable.' } });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Erreur de validation Zod -> 400 avec détail de forme (sans donnée sensible)
  if (err instanceof ZodError) {
    const ve = new ValidationError('Données invalides.', err.flatten().fieldErrors);
    res.status(ve.statusCode).json({
      error: { code: ve.code, message: ve.publicMessage, details: ve.details },
    });
    return;
  }

  // Erreur applicative attendue -> message public
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ error: { code: err.code, message: err.publicMessage } });
    return;
  }

  // Erreur inattendue -> 500 générique, détail en journal uniquement.
  logSecurityEvent('error.unexpected', {
    ip: req.ip,
    resource: req.originalUrl,
    action: req.method,
  });
  const errorForLog: unknown = err;
  logger.error({ err: errorForLog, url: req.originalUrl, method: req.method }, 'unhandled error');

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
  });
};
