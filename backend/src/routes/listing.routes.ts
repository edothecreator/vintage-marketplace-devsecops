// Routes d'annonces.
// Pratiques : P20. ASVS V8 (autorisation au niveau donnée — IDOR/BOLA, T14).
//
// GET (liste, détail) sont publics. CREATE/UPDATE/DELETE exigent une
// authentification ET la propriété de l'annonce (résolue en base, jamais par
// le corps). PUT et DELETE sont les cibles de la démonstration IDOR de phase 9.

import { Router, raw } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate, requireParam } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { searchLimiter, writeLimiter } from '../middleware/rateLimit.middleware.js';
import {
  createListingSchema,
  updateListingSchema,
  listListingsQuerySchema,
  idParamSchema,
} from '../validation/schemas.js';
import * as listingService from '../services/listing.service.js';
import { storeListingImage } from '../services/upload.service.js';
import { toPublicListing } from '../dto/mappers.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { env } from '../config/env.js';
import type {
  CreateListingInput,
  UpdateListingInput,
  ListListingsQuery,
} from '../validation/schemas.js';

export const listingRouter = Router();

// --- Public : liste paginée + recherche -------------------------------------
listingRouter.get(
  '/',
  searchLimiter,
  validate(listListingsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListListingsQuery;
    const { items, total } = await listingService.listListings({
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
    res.json({
      items: items.map(toPublicListing),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  }),
);

// --- Public : détail ---------------------------------------------------------
listingRouter.get(
  '/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const listing = await listingService.getListingById(requireParam(req, 'id'));
    res.json(toPublicListing(listing));
  }),
);

// --- Authentifié : création --------------------------------------------------
listingRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate(createListingSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const input = req.body as CreateListingInput;
    // sellerId provient du jeton (req.user.id), jamais du corps (T16, 8.3.1).
    const listing = await listingService.createListing(req.user.id, input);
    res.status(201).json(toPublicListing(listing));
  }),
);

// --- Propriétaire : mise à jour (CIBLE DÉMO IDOR, phase 9) --------------------
listingRouter.put(
  '/:id',
  requireAuth,
  writeLimiter,
  validate(idParamSchema, 'params'),
  validate(updateListingSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const input = req.body as UpdateListingInput;
    // updateListing vérifie la propriété en base avant toute modification (T14).
    const listing = await listingService.updateListing(requireParam(req, 'id'), req.user.id, input);
    res.json(toPublicListing(listing));
  }),
);

// --- Propriétaire : suppression (logique, passage à REMOVED) -----------------
listingRouter.delete(
  '/:id',
  requireAuth,
  writeLimiter,
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    await listingService.deleteListing(requireParam(req, 'id'), req.user.id);
    res.status(204).send();
  }),
);

// --- Propriétaire : téléversement d'image -----------------------------------
// On reçoit les octets bruts (image binaire) avec une limite stricte appliquée
// AVANT bufferisation complète (anti-DoS, T23). La validation réelle du contenu
// (octets magiques, ré-encodage) est faite par le service d'upload.
listingRouter.post(
  '/:id/images',
  requireAuth,
  writeLimiter,
  validate(idParamSchema, 'params'),
  raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: env.MAX_UPLOAD_BYTES }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const result = await storeListingImage({
      listingId: requireParam(req, 'id'),
      sellerId: req.user.id,
      declaredMime: req.headers['content-type'],
      body,
      ip: req.ip,
    });
    res.status(201).json(result);
  }),
);
