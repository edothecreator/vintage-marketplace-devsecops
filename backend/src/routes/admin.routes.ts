// Routes d'administration / modération.
// Pratiques : P20. ASVS 8.2.1 (autorisation au niveau fonction par rôle, T39).
//
// Toutes les routes exigent le rôle ADMIN. requireRole est appliqué au niveau
// du routeur : aucune route d'admin ne peut exister sans contrôle de rôle.

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate, requireParam } from '../middleware/validate.middleware.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { listListingsQuerySchema, idParamSchema } from '../validation/schemas.js';
import * as listingService from '../services/listing.service.js';
import { toPublicListing } from '../dto/mappers.js';
import { logSecurityEvent } from '../config/logger.js';
import type { ListListingsQuery } from '../validation/schemas.js';

export const adminRouter = Router();

// Garde de rôle appliquée à TOUTES les routes montées ci-dessous.
adminRouter.use(requireAuth, requireRole('ADMIN'));

// --- Vue de modération : toutes les annonces, tous statuts -------------------
adminRouter.get(
  '/listings',
  validate(listListingsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListListingsQuery;
    const { items, total } = await listingService.listAllListingsForAdmin({
      page: query.page,
      pageSize: query.pageSize,
    });
    res.json({ items: items.map(toPublicListing), page: query.page, total });
  }),
);

// --- Retrait d'une annonce par un modérateur --------------------------------
adminRouter.delete(
  '/listings/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const listingId = requireParam(req, 'id');
    await listingService.removeListingAsAdmin(listingId);
    logSecurityEvent('moderation.action', {
      userId: req.user?.id,
      ip: req.ip,
      resource: `listing:${listingId}`,
      action: 'remove',
    });
    res.status(204).send();
  }),
);
