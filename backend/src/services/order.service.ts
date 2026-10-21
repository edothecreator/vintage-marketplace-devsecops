// Service de commande.
// Pratique : P20. ASVS 2.3.3 (transaction atomique), 2.3.4 (verrouillage).
//
// *** CONTRÔLE SIGNATURE DU PROJET : non-duplication de vente (menace T28) ***
//
// Les articles vintage sont uniques. Deux acheteurs ne doivent jamais pouvoir
// acquérir le même objet. Le risque est une condition de concurrence : deux
// requêtes de commande simultanées lisent toutes deux l'annonce comme
// AVAILABLE avant que l'une ne la passe à SOLD.
//
// Défense : un verrou de ligne pessimiste (SELECT ... FOR UPDATE) à l'intérieur
// d'une transaction. La première transaction verrouille la ligne ; la seconde
// attend, puis lit l'état déjà mis à jour (SOLD) et échoue proprement en 409.

import { prisma } from '../config/prisma.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../errors/AppError.js';
import { logSecurityEvent } from '../config/logger.js';
import type { Order } from '@prisma/client';

interface CreateOrderParams {
  buyerId: string;
  listingId: string;
  shippingAddress: string;
}

export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const { buyerId, listingId, shippingAddress } = params;

  return prisma.$transaction(async (tx) => {
    // Verrou pessimiste sur la ligne de l'annonce. Prisma n'exprime pas
    // "FOR UPDATE" dans son API typée, on utilise donc une requête brute
    // PARAMÉTRÉE ($1) — pas de concaténation, donc pas d'injection (ASVS 1.2.4).
    const rows = await tx.$queryRaw<
      { id: string; sellerId: string; priceCents: number; status: string }[]
    >`SELECT id, "sellerId", "priceCents", status
        FROM listings
       WHERE id = ${listingId}::uuid
       FOR UPDATE`;

    const listing = rows[0];
    if (!listing) {
      throw new NotFoundError('Annonce introuvable.');
    }

    // Un vendeur ne peut pas acheter sa propre annonce (ADR 0006, cohérence).
    if (listing.sellerId === buyerId) {
      throw new ForbiddenError('Vous ne pouvez pas commander votre propre annonce.');
    }

    // Vérification d'état SOUS le verrou : c'est ici que la seconde requête
    // concurrente échoue (menaces T28, T31).
    if (listing.status !== 'AVAILABLE') {
      throw new ConflictError('Cet article n’est plus disponible.');
    }

    // Marque l'annonce comme vendue dans la même transaction.
    await tx.listing.update({
      where: { id: listingId },
      data: { status: 'SOLD' },
    });

    const order = await tx.order.create({
      data: {
        listingId,
        buyerId,
        shippingAddress,
        priceCents: listing.priceCents,
        status: 'COMPLETED',
      },
    });

    logSecurityEvent('order.state_change', {
      userId: buyerId,
      resource: `listing:${listingId}`,
      action: 'order.created',
      reason: 'AVAILABLE->SOLD',
    });

    return order;
  });
}

/**
 * Liste les commandes de l'acheteur courant UNIQUEMENT.
 * Le filtre par buyerId est la défense BOLA (menace T29, ASVS 8.2.2) : un
 * acheteur ne peut jamais voir les commandes d'un autre.
 */
export async function listOrdersForBuyer(buyerId: string): Promise<Order[]> {
  return prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: 'desc' },
  });
}

/** Récupère une commande en vérifiant que le demandeur y a droit. */
export async function getOrderForUser(orderId: string, userId: string): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { listing: true },
  });
  if (!order) {
    throw new NotFoundError('Commande introuvable.');
  }
  // Visible de l'acheteur OU du vendeur concerné (ASVS 8.2.3).
  if (order.buyerId !== userId && order.listing.sellerId !== userId) {
    throw new ForbiddenError();
  }
  return order;
}
