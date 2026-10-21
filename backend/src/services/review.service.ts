// Service d'avis.
// Pratique : P20. ASVS V8 (autorisation), 2.3.1 (cohérence de l'état métier).
//
// Règle métier : un avis ne peut être déposé que par l'ACHETEUR d'une commande
// ABOUTIE, et une seule fois par commande (contrainte @unique sur orderId).
// On vérifie la propriété de la commande côté serveur (menace T38, BOLA T29).

import { prisma } from '../config/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/AppError.js';
import type { CreateReviewInput } from '../validation/schemas.js';
import type { Review } from '@prisma/client';

export async function createReview(authorId: string, input: CreateReviewInput): Promise<Review> {
  // La commande doit exister ET appartenir à l'auteur (ASVS 8.2.2).
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    throw new NotFoundError('Commande introuvable.');
  }
  if (order.buyerId !== authorId) {
    // Seul l'acheteur de la commande peut l'évaluer (menace T38).
    throw new ForbiddenError();
  }
  if (order.status !== 'COMPLETED') {
    throw new ConflictError('La commande n’est pas finalisée.');
  }

  // Un seul avis par commande : la contrainte @unique(orderId) garantit
  // l'invariant même en cas de concurrence ; on devance avec un message clair.
  const existing = await prisma.review.findUnique({ where: { orderId: input.orderId } });
  if (existing) {
    throw new ConflictError('Un avis existe déjà pour cette commande.');
  }

  return prisma.review.create({
    data: {
      orderId: input.orderId,
      authorId,
      rating: input.rating,
      body: input.body,
    },
  });
}

/** Liste publique des avis reçus par un vendeur, via ses annonces vendues. */
export async function listReviewsForSeller(sellerId: string): Promise<Review[]> {
  return prisma.review.findMany({
    where: { order: { listing: { sellerId } } },
    orderBy: { createdAt: 'desc' },
  });
}
