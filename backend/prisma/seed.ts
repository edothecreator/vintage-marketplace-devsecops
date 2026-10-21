// Script de peuplement de la base (développement et démonstration).
// Pratique : P20. ASVS 6.3.2 (aucun compte par défaut en production).
//
// *** Ce seed ne s'exécute qu'en développement / test. *** Il crée des comptes
// de démonstration aux mots de passe connus, ce qui serait une faille en
// production (menace T04). Le garde ci-dessous refuse l'exécution si
// NODE_ENV=production.
//
// Les comptes servent aux démonstrations de phase 9 (IDOR/BOLA) : deux
// vendeurs distincts (alice, bob) permettent de prouver qu'alice ne peut pas
// modifier l'annonce de bob.

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/password.service.js';

const prisma = new PrismaClient();

// Mot de passe de démonstration : fort, hors liste courante, et sans mot
// interdit par le contexte (ni "vintage", ni "devsecops", etc.).
//
// EXCEPTION GITLEAKS DOCUMENTÉE : il ne s'agit PAS d'un secret réel mais d'un
// identifiant de démonstration, en clair et assumé, pour un script de seed qui
// REFUSE de s'exécuter en production (garde NODE_ENV ci-dessous, ASVS 6.3.2).
// L'annotation inline #gitleaks:allow lève l'alerte de façon auditable, plutôt
// que d'ajouter une règle globale qui masquerait de vrais secrets ailleurs.
const DEMO_PASSWORD = 'Corr3ct-Horse-Staple-42'; // gitleaks:allow

interface SeedUser {
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
}

const USERS: SeedUser[] = [
  { email: 'alice@example.com', role: 'SELLER' },
  { email: 'bob@example.com', role: 'SELLER' },
  { email: 'carol@example.com', role: 'BUYER' },
  { email: 'admin@example.com', role: 'ADMIN' },
];

async function main(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Le seed de démonstration est interdit en production (ASVS 6.3.2).');
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // Upsert : le seed est idempotent, on peut le rejouer sans doublon.
  const created: Record<string, string> = {};
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: { email: u.email, passwordHash, role: u.role },
    });
    created[u.email] = user.id;
  }

  const aliceId = created['alice@example.com'];
  const bobId = created['bob@example.com'];
  if (!aliceId || !bobId) {
    throw new Error('Comptes vendeurs introuvables après upsert.');
  }

  // Annonces de démonstration. On nettoie d'abord les annonces de seed pour
  // rester idempotent (titres préfixés [SEED]).
  await prisma.listing.deleteMany({ where: { title: { startsWith: '[SEED]' } } });

  await prisma.listing.createMany({
    data: [
      {
        sellerId: aliceId,
        title: '[SEED] Veste en jean délavé années 80',
        description: 'Pièce authentique, coupe oversize, excellent état.',
        priceCents: 4500,
      },
      {
        sellerId: aliceId,
        title: '[SEED] Appareil photo argentique 35mm',
        description: 'Fonctionne parfaitement, livré avec étui cuir.',
        priceCents: 12000,
      },
      {
        sellerId: bobId,
        title: '[SEED] Disque vinyle jazz 1972',
        description: 'Pressage original, pochette en bon état.',
        priceCents: 3000,
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('Seed terminé. Comptes de démonstration :');
  for (const u of USERS) {
    // eslint-disable-next-line no-console
    console.log(`  ${u.role.padEnd(6)}  ${u.email}  /  ${DEMO_PASSWORD}`);
  }
}

main()
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Échec du seed :', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
