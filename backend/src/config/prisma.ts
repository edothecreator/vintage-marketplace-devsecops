// Client Prisma en singleton.
// Prisma génère des requêtes paramétrées par défaut : c'est la mesure
// d'atténuation principale de la menace T10 (injection SQL), ASVS 1.2.4.

import { PrismaClient } from '@prisma/client';
import { isProduction } from './env.js';

export const prisma = new PrismaClient({
  log: isProduction ? ['warn', 'error'] : ['warn', 'error'],
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
