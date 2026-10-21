// Routes de commande.
// Pratiques : P20. ASVS V8 (BOLA, T29), 2.3.x (transaction/verrou, T28).
//
// GET /api/orders ne renvoie QUE les commandes de l'acheteur courant : filtre
// par buyerId issu du jeton. C'est une cible de la démonstration BOLA (phase 9).

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate, requireParam } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { writeLimiter } from '../middleware/rateLimit.middleware.js';
import { createOrderSchema, idParamSchema } from '../validation/schemas.js';
import * as orderService from '../services/order.service.js';
import { toPrivateOrder } from '../dto/mappers.js';
import { UnauthorizedError } from '../errors/AppError.js';
import type { CreateOrderInput } from '../validation/schemas.js';

export const orderRouter = Router();

// --- Création de commande (verrou anti double-vente, T28) --------------------
orderRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const input = req.body as CreateOrderInput;
    // priceCents n'est PAS lu du corps : il est fixé en base sous verrou (T30).
    const order = await orderService.createOrder({
      buyerId: req.user.id,
      listingId: input.listingId,
      shippingAddress: input.shippingAddress,
    });
    res.status(201).json(toPrivateOrder(order));
  }),
);

// --- Mes commandes (filtre BOLA par buyerId du jeton, T29) -------------------
orderRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const orders = await orderService.listOrdersForBuyer(req.user.id);
    res.json({ items: orders.map(toPrivateOrder) });
  }),
);

// --- Détail d'une commande (acheteur ou vendeur concerné uniquement) ---------
orderRouter.get(
  '/:id',
  requireAuth,
  validate(idParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError();
    const order = await orderService.getOrderForUser(requireParam(req, 'id'), req.user.id);
    res.json(toPrivateOrder(order));
  }),
);
