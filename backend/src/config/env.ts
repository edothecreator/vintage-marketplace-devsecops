// Validation de la configuration au démarrage.
// Pratique : P20 Secure coding. L'application refuse de démarrer si une
// variable essentielle est absente ou invalide, plutôt que d'échouer plus tard
// de façon imprévisible (ASVS 14.1, fail-fast de configuration).

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),

  // La clé de signature doit être longue. On refuse une valeur trop courte,
  // qui affaiblirait la sécurité des jetons (ASVS 9.1.2).
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),

  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  SESSION_ABSOLUTE_TTL: z.string().default('30d'),

  // Clé IA optionnelle à ce stade (branchée en phase 8).
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash-lite'),
  AI_DAILY_LIMIT_PER_USER: z.coerce.number().int().positive().default(20),
  AI_DAILY_LIMIT_GLOBAL: z.coerce.number().int().positive().default(200),

  UPLOAD_DIR: z.string().default('./storage/uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_242_880),

  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Erreur de configuration : on l'affiche et on arrête immédiatement.
  // On n'expose jamais ceci au client — c'est une erreur de démarrage serveur.
  // eslint-disable-next-line no-console
  console.error(
    'Configuration invalide :\n',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;

export const corsAllowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
