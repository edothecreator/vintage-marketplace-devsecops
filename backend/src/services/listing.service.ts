// Service d'annonces.
// Pratique : P20. ASVS V8 (autorisation), 1.2.4 (requêtes paramétrées).
//
// PUT/DELETE/images résolvent la propriété en base via getOwnedListing, qui
// est la cible correcte de la démonstration V5 (IDOR, menace T14). Le contrôle
// est implémenté correctement ici ; il sera retiré volontairement en phase 9
// sur une branche de démonstration, puis restauré.

import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../errors/AppError.js';
import type { CreateListingInput, UpdateListingInput } from '../validation/schemas.js';
import type { Listing, ListingImage, Prisma } from '@prisma/client';

type ListingWithImages = Listing & { images: ListingImage[] };

export async function listListings(params: {
  q?: string | undefined;
  page: number;
  pageSize: number;
}): Promise<{ items: ListingWithImages[]; total: number }> {
  // Filtre de recherche construit via l'API Prisma (paramétrée), jamais par
  // concaténation de chaîne (ASVS 1.2.4, menace T10).
  const where: Prisma.ListingWhereInput = {
    status: 'AVAILABLE',
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q, mode: 'insensitive' } },
            { description: { contains: params.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { images: true },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.listing.count({ where }),
  ]);

  return { items, total };
}

export async function getListingById(id: string): Promise<ListingWithImages> {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!listing) {
    throw new NotFoundError('Annonce introuvable.');
  }
  return listing;
}

export async function createListing(
  sellerId: string,
  input: CreateListingInput,
): Promise<ListingWithImages> {
  // sellerId provient du jeton, jamais du corps (ASVS 8.3.1, menace T16).
  const listing = await prisma.listing.create({
    data: {
      sellerId,
      title: input.title,
      description: input.description,
      priceCents: input.priceCents,
    },
    include: { images: true },
  });
  return listing;
}

/**
 * Charge une annonce ET vérifie que l'utilisateur en est le propriétaire.
 * C'est le point de contrôle IDOR/BOLA (menace T14, ASVS 8.2.2). La propriété
 * est lue en base (listing.sellerId) et comparée à l'utilisateur authentifié.
 * Renvoie NotFound si l'annonce n'existe pas OU n'appartient pas à l'utilisateur
 * (on ne révèle pas l'existence d'une annonce d'autrui).
 */
export async function getOwnedListing(
  listingId: string,
  sellerId: string,
): Promise<ListingWithImages> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });
  if (!listing || listing.sellerId !== sellerId) {
    throw new NotFoundError('Annonce introuvable.');
  }
  return listing;
}

export async function updateListing(
  listingId: string,
  sellerId: string,
  input: UpdateListingInput,
): Promise<ListingWithImages> {
  // Vérifie la propriété avant toute modification (menace T14).
  await getOwnedListing(listingId, sellerId);

  // Construit le payload en n'incluant que les champs fournis. Avec
  // exactOptionalPropertyTypes, Prisma n'accepte pas `undefined` comme valeur
  // d'un champ ; on omet donc les clés absentes plutôt que de les passer à undefined.
  const data: Prisma.ListingUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.priceCents !== undefined) data.priceCents = input.priceCents;

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data,
    include: { images: true },
  });
  return listing;
}

export async function deleteListing(listingId: string, sellerId: string): Promise<void> {
  await getOwnedListing(listingId, sellerId);
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'REMOVED' },
  });
}

// --- Modération (ADMIN uniquement) ------------------------------------------
// Ces fonctions ne vérifient PAS la propriété : l'autorisation est au niveau
// fonction (requireRole('ADMIN'), ASVS 8.2.1, menace T39). Le contrôle de rôle
// est appliqué par l'intergiciel de route en amont.

/** Liste TOUTES les annonces, tous statuts confondus (vue de modération). */
export async function listAllListingsForAdmin(params: {
  page: number;
  pageSize: number;
}): Promise<{ items: ListingWithImages[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      include: { images: true },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.listing.count(),
  ]);
  return { items, total };
}

/** Retrait d'une annonce par un modérateur (menace T39). */
export async function removeListingAsAdmin(listingId: string): Promise<void> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    throw new NotFoundError('Annonce introuvable.');
  }
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'REMOVED' },
  });
}
