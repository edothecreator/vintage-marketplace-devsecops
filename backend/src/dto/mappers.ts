// Mappeurs DTO — minimisation de l'exposition des données.
// Pratique : P20. ASVS 15.3.1 (ne renvoyer que le sous-ensemble requis),
// 8.2.3 (contrôle d'accès au niveau du champ).
//
// Principe : on ne renvoie JAMAIS une entité Prisma brute au client. Chaque
// entité a un mappeur explicite qui liste les champs exposés. Cela empêche la
// fuite de champs sensibles (passwordHash, timestamps internes) et constitue
// la défense contre la sur-exposition de données (menace T12).

import type { User, Listing, ListingImage, Order, Review } from '@prisma/client';

export interface PublicUser {
  id: string;
  role: string;
}

export function toPublicUser(user: Pick<User, 'id' | 'role'>): PublicUser {
  return { id: user.id, role: user.role };
}

export interface PublicListing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  priceCents: number;
  status: string;
  createdAt: string;
  images: { id: string; url: string }[];
}

export function toPublicListing(listing: Listing & { images?: ListingImage[] }): PublicListing {
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    title: listing.title,
    description: listing.description,
    priceCents: listing.priceCents,
    status: listing.status,
    createdAt: listing.createdAt.toISOString(),
    images: (listing.images ?? []).map((img) => ({
      id: img.id,
      url: `/api/listings/${listing.id}/images/${img.id}`,
    })),
  };
}

export interface PrivateOrder {
  id: string;
  listingId: string;
  buyerId: string;
  status: string;
  shippingAddress: string;
  priceCents: number;
  createdAt: string;
}

// L'adresse de livraison (N2) n'est incluse que dans cette vue, servie
// uniquement à l'acheteur ou au vendeur concernés (ASVS 8.2.3).
export function toPrivateOrder(order: Order): PrivateOrder {
  return {
    id: order.id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    status: order.status,
    shippingAddress: order.shippingAddress,
    priceCents: order.priceCents,
    createdAt: order.createdAt.toISOString(),
  };
}

export interface PublicReview {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
}

export function toPublicReview(review: Review): PublicReview {
  return {
    id: review.id,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
  };
}
