// Schémas de validation Zod.
// Pratiques : P20. ASVS 2.2.1, 2.2.2 (validation en couche de service de
// confiance). Valeurs issues des décisions documentées (ADR 0006).
//
// La validation par schéma rejette toute entrée non conforme AVANT la logique
// métier. Les champs non listés sont ignorés par .strict(), ce qui constitue
// la défense de première ligne contre l'affectation de masse (T16, T40).

import { z } from 'zod';

// --- Primitives réutilisables ---
const uuid = z.string().uuid('Identifiant invalide.');
const email = z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(254);
// La politique de longueur/complexité est vérifiée par password.service
// (liste de mots courants, mots de contexte). Ici on borne seulement.
const password = z.string().min(8, 'Mot de passe trop court.').max(128);

// --- Auth ---
export const registerSchema = z
  .object({
    email,
    password,
    // Volontairement ABSENT : role. Le rôle n'est jamais accepté du client
    // (menace T40). .strict() rejette tout champ supplémentaire comme "role".
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(128), // pas de politique au login
  })
  .strict();

// --- Annonces ---
export const createListingSchema = z
  .object({
    title: z.string().trim().min(3, 'Titre trop court.').max(120),
    description: z.string().max(4000).default(''),
    priceCents: z.number().int().min(100).max(10_000_000),
    // sellerId ABSENT : résolu à partir du jeton, jamais du corps (T16, 8.3.1).
  })
  .strict();

export const updateListingSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().max(4000).optional(),
    priceCents: z.number().int().min(100).max(10_000_000).optional(),
    // status, sellerId ABSENTS : non modifiables par cette route.
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'Aucun champ à mettre à jour.');

export const listListingsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20), // borne anti-moissonnage (T11)
  })
  .strict();

// --- Commandes ---
export const createOrderSchema = z
  .object({
    listingId: uuid,
    shippingAddress: z.string().trim().min(5).max(500),
    // priceCents ABSENT : lu en base, jamais accepté du client (T30, 15.3.3).
  })
  .strict();

// --- Avis ---
export const createReviewSchema = z
  .object({
    orderId: uuid,
    rating: z.number().int().min(1).max(5), // échelle fermée (T38)
    body: z.string().trim().max(2000).default(''),
  })
  .strict();

// --- Paramètres de route ---
export const idParamSchema = z.object({ id: uuid }).strict();

// --- Types inférés ---
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
