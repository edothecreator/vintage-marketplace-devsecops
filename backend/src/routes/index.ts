// Assemblage du routeur de l'API.
// Pratique : P20. Point unique où toutes les ressources sont montées sous /api.
// L'ordre de montage n'affecte pas la sécurité (chaque route porte ses propres
// gardes) mais centralise la cartographie des endpoints.

import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { listingRouter } from './listing.routes.js';
import { orderRouter } from './order.routes.js';
import { reviewRouter } from './review.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/listings', listingRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/admin', adminRouter);
