# Backend — Place de marché vintage

API REST (Express.js + TypeScript) de la place de marché vintage, construite
comme support de démonstration de la chaîne DevSecOps (Projet 3, IRISI 3, FST
Marrakech).

La sécurité n'est pas une surcouche : chaque composant est écrit à partir du
modèle de menaces (`docs/threat-model/`) et des exigences OWASP ASVS 5.0
retenues (ADR 0005). Les commentaires du code renvoient aux menaces (Txx) et
aux exigences ASVS correspondantes.

## Pile technique

| Rôle | Choix | Raison (ADR) |
| --- | --- | --- |
| Langage | TypeScript (strict) | typage fort, `exactOptionalPropertyTypes` |
| Serveur HTTP | Express 4 | écosystème du sujet (Projet 3) |
| ORM | Prisma + PostgreSQL | requêtes paramétrées par défaut (anti-injection, T10) |
| Hachage | Argon2id | ADR 0006 (ASVS 11.4.2) |
| Jetons | JWT (jose) + rafraîchissement opaque | ADR 0006 (ASVS V7/V9) |
| Validation | Zod | schémas stricts (anti affectation de masse, T40) |
| Images | sharp | ré-encodage défensif (T20/T21/T24/T25) |
| En-têtes | Helmet | CSP, anti-clickjacking (T35) |
| Journalisation | pino | JSON structuré, expurgation des secrets (ASVS 16.2.5) |

## Prérequis

- Node.js >= 22
- Docker (pour la base PostgreSQL locale)

## Démarrage

```bash
# 1. Depuis la racine du dépôt : lancer la base
docker compose up -d

# 2. Dans backend/ : installer les dépendances
npm install

# 3. Créer le fichier d'environnement local (NON versionné)
cp .env.example .env
# puis renseigner JWT_SECRET :
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 4. Appliquer le schéma et peupler des données de démonstration
npm run prisma:migrate   # applique les migrations
npm run prisma:seed      # comptes + annonces de démonstration

# 5. Lancer en développement
npm run dev              # http://localhost:3000
```

## Comptes de démonstration (seed)

Le seed REFUSE de s'exécuter en production (`NODE_ENV=production`), conformément
à ASVS 6.3.2 (aucun compte par défaut en production).

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| SELLER | alice@example.com | `Corr3ct-Horse-Staple-42` |
| SELLER | bob@example.com | `Corr3ct-Horse-Staple-42` |
| BUYER | carol@example.com | `Corr3ct-Horse-Staple-42` |
| ADMIN | admin@example.com | `Corr3ct-Horse-Staple-42` |

Les deux vendeurs (alice, bob) servent à la démonstration IDOR/BOLA de phase 9 :
alice ne peut pas modifier une annonce de bob (réponse 404).

## Scripts

| Script | Effet |
| --- | --- |
| `npm run dev` | Serveur en rechargement à chaud (tsx) |
| `npm run build` | Compilation de production (`tsconfig.build.json`) |
| `npm run typecheck` | Vérification de types stricte (`tsc --noEmit`) |
| `npm run lint` | ESLint + eslint-plugin-security, `--max-warnings=0` |
| `npm run format:check` | Vérification Prettier |
| `npm run prisma:migrate` | Migration de développement |
| `npm run prisma:seed` | Peuplement de démonstration |
| `npm run db:reset` | Réinitialisation complète de la base |

Ces mêmes contrôles (lint, format, typecheck) sont appliqués en amont par les
hooks pre-commit (`.pre-commit-config.yaml`) et en CI.

## Architecture des dossiers

```
src/
  config/        env (fail-fast), logger (expurgation), prisma, security (Helmet/CORS)
  errors/        hiérarchie AppError -> messages publics génériques (ASVS 16.5)
  middleware/    auth (authn/authz), validate (Zod), rateLimit, errorHandler
  services/      logique métier : password, token, auth, listing, order, review, upload
  dto/           mappeurs — minimisation de l'exposition (jamais d'entité brute)
  validation/    schémas Zod stricts
  routes/        handlers HTTP par ressource + assemblage
  app.ts         composition Express (testable, sans écoute réseau)
  server.ts      écoute réseau + arrêt gracieux
prisma/
  schema.prisma  modèle de données
  migrations/    migrations versionnées
  seed.ts        peuplement de démonstration
openapi.yaml     spécification + inventaire d'API (ASVS 13.1)
```

## Contrôles de sécurité implémentés (carte menace -> code)

| Menace | Contrôle | Emplacement |
| --- | --- | --- |
| T03 Énumération de comptes | message + timing homogènes | `services/auth.service.ts` |
| T05 Confusion d'algorithme JWT | liste d'algorithmes stricte | `services/token.service.ts` |
| T07 Vol de jeton de rafraîchissement | rotation + détection de réutilisation | `services/auth.service.ts` |
| T10 Injection SQL | Prisma paramétré, requête brute paramétrée | partout, `services/order.service.ts` |
| T14/T29 IDOR / BOLA | propriété résolue en base | `middleware/auth.middleware.ts`, services |
| T16/T40 Affectation de masse | Zod `.strict()`, champs du jeton | `validation/schemas.ts` |
| T20-T25 Upload malveillant | octets magiques + ré-encodage sharp | `services/upload.service.ts` |
| T28/T31 Double vente | verrou `FOR UPDATE` transactionnel | `services/order.service.ts` |
| T35 Clickjacking | `frame-ancestors 'none'`, Helmet | `config/security.ts` |
| T36 CORS permissif | liste d'autorisation stricte | `config/security.ts` |
| T39 Contrôle de fonction | `requireRole('ADMIN')` | `routes/admin.routes.ts` |
| T51 Fuite d'erreur | 500 générique, détail en journal | `middleware/errorHandler.ts` |
| Anti-automatisation | limitation de débit par zone | `middleware/rateLimit.middleware.ts` |

## Note sur les vulnérabilités de démonstration

Certaines routes (`PUT /api/listings/:id`, `GET /api/orders`) sont des cibles
prévues pour la démonstration de détection en phase 9 : le contrôle de propriété
y sera retiré sur une branche dédiée pour générer une alerte dans la chaîne,
puis restauré. À ce stade (phase 2), **tous les contrôles sont en place et
vérifiés** (voir journaux d'exécution et tests de la phase 3).
