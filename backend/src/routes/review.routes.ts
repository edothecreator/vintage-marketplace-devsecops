// Routes d'avis.
// Pratiques : P20. ASVS V8 (autorisation), 2.3.1 (cohérence métier, T38).
//
// Un avis ne peut être créé que par l'acheteur d'une commande finalisée. La
// liste des avis d'un vendeur est publique (réputation).

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate, requireParam } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { writeLimiter } from '../middleware/rateLimit.middleware.js';
import { createReviewSchema, idParamSchema } from '../validation/schemas.js';
import * as reviewService from '../services/review.service.js';
import { toPublicReview } from '../dto/mappers.js';
import { UnauthorizedError } from '../errors/AppError.js';
import type { CreateReviewInput } from '../validation/schemas.js';

export const reviewRouter = Router();

// --- Création d'un avis (acheteur de la commande uniquement, T38) ------------
reviewRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate(createReviewSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const input = req.body as CreateReviewInput;
    const review = await reviewService.createReview(req.user.id, input);
    res.status(201).json(toPublicReview(review));
  }),
);

// --- Avis publics reçus par un vendeur --------------------------------------
reviewRouter.get(
  '/seller/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const reviews = await reviewService.listReviewsForSeller(requireParam(req, 'id'));
    res.json({ items: reviews.map(toPublicReview) });
  }),
);
