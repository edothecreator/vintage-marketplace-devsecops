# ADR 0006 — Décisions de sécurité documentées

**Status:** Accepted
**Date:** Phase 1
**Practice:** P24 Security requirement gathering (Tier 2)

## Context

L'ASVS 5.0 introduit une catégorie d'exigences nouvelle par rapport à la
version 4.x : les **décisions de sécurité documentées**.

Le raisonnement du référentiel est le suivant. Certaines exigences supposent
l'application de règles qui varient d'une application à l'autre — types de
fichiers autorisés, contrôles métier applicables, caractères admis dans un
champ. L'ASVS ne peut pas les prescrire de manière générique. Et sans
documentation de ces décisions, **les exigences de mise en œuvre
correspondantes ne sont tout simplement pas vérifiables** : un vérificateur ne
peut pas juger si la validation est correcte s'il ne sait pas ce qu'elle est
censée accepter.

Ces exigences figurent dans la première section de chaque chapitre de l'ASVS et
sont toujours associées à une exigence de mise en œuvre. L'enjeu est de
distinguer la vérification de la *documentation* de celle de la *mise en œuvre
effective*.

Ce registre rassemble donc les décisions exigées pour les chapitres retenus en
ADR 0005.

## Decision

Les décisions ci-dessous sont arrêtées avant l'implémentation et serviront de
référence de vérification en phase 10.

### 1. Règles de validation des entrées (`ASVS 2.1.1`)

| Champ | Règle | Motif |
|---|---|---|
| `email` | Format RFC, 254 caractères maximum, normalisé en minuscules | Unicité fiable, prévention des doublons par casse |
| `password` | 8 à 128 caractères, **aucune restriction de composition** | `6.2.5` interdit les règles de composition ; 128 pour borner le coût de hachage |
| `title` | 3 à 120 caractères, texte brut | Affiché en liste |
| `description` | 0 à 4 000 caractères | Borne de stockage et de coût de rendu |
| `priceCents` | Entier, 100 à 10 000 000 | Prix positif obligatoire ; borne haute arbitraire mais explicite |
| `rating` | Entier, 1 à 5 | Échelle fermée |
| `body` (avis) | 0 à 2 000 caractères | Borne de stockage |
| Paramètre de recherche | 0 à 100 caractères, liste de caractères sûrs | Limite le coût de requête |
| `page`, `pageSize` | Entiers, `pageSize` ≤ 50 | Prévention du moissonnage (T11) |
| Tous les identifiants | UUID v4 strict | Rejette les tentatives d'énumération par entier |

### 2. Cohérence contextuelle des données combinées (`ASVS 2.1.2`)

| Règle | Vérification |
|---|---|
| Un avis ne peut porter que sur une commande aboutie de son auteur | `order.buyerId == review.authorId` et `order.status == COMPLETED` |
| Une commande ne peut porter que sur une annonce disponible | `listing.status == AVAILABLE` dans la transaction |
| Un vendeur ne peut acheter sa propre annonce | `listing.sellerId != order.buyerId` |

### 3. Limites de logique métier (`ASVS 2.1.3`)

| Limite | Valeur | Portée |
|---|---|---|
| Annonces actives par vendeur | 50 | par utilisateur |
| Images par annonce | 8 | par annonce |
| Commandes par acheteur et par heure | 10 | par utilisateur |
| Appels à la génération IA par utilisateur et par jour | 20 | par utilisateur |
| Appels à la génération IA, total quotidien | 200 | application |
| Tentatives de connexion par compte | 10 par 15 minutes | par compte |
| Tentatives de connexion par adresse IP | 30 par 15 minutes | par IP |
| Requêtes de recherche par IP | 60 par minute | par IP |

> Le plafond global de 200 appels IA par jour est délibérément fixé **sous** le
> quota de l'offre gratuite Gemini. L'épuisement du quota devient ainsi un
> événement applicatif contrôlé plutôt qu'une panne subie (T45, `LLM10`).

### 4. Règles d'autorisation (`ASVS 8.1.1`, `8.1.2`)

**Niveau fonction** — qui peut appeler quoi :

| Fonction | Rôles autorisés |
|---|---|
| Consultation d'annonces | visiteur, acheteur, vendeur, administrateur |
| Création et gestion d'annonce | vendeur (propriétaire uniquement) |
| Téléversement d'image | vendeur (propriétaire de l'annonce cible) |
| Passation de commande | acheteur |
| Consultation de commande | acheteur (propriétaire uniquement) |
| Dépôt d'avis | acheteur (auteur d'une commande aboutie) |
| Modération | administrateur |
| Génération IA | vendeur |

**Niveau donnée** — la propriété est **toujours** résolue en base à partir de
l'identité du jeton, **jamais** acceptée depuis le corps de la requête
(`8.3.1`).

**Niveau champ** — projection selon le demandeur :

| Entité | Champs publics | Champs restreints |
|---|---|---|
| `User` | `id`, pseudonyme dérivé | `email`, `role`, `passwordHash` |
| `Listing` | tous sauf ci-contre | aucun |
| `Order` | — | tous : visibles de l'acheteur et du vendeur concernés uniquement |
| `Order.shippingAddress` | — | acheteur et vendeur de la commande uniquement |

### 5. Gestion des fichiers (`ASVS 5.1.1`)

| Décision | Valeur |
|---|---|
| Types autorisés | `image/jpeg`, `image/png`, `image/webp` |
| Extensions attendues | `.jpg`, `.jpeg`, `.png`, `.webp` |
| **SVG** | **Refusé** — vecteur de script (T25) |
| Taille maximale par fichier | 5 Mo |
| Dimension maximale | 6 000 × 6 000 pixels |
| Quota par utilisateur | 100 fichiers, 200 Mo cumulés |
| Vérification de contenu | Octets magiques + ré-encodage systématique de l'image |
| Nom de stockage | UUID généré en interne ; nom fourni par l'utilisateur jamais utilisé comme chemin |
| Emplacement | Hors racine web, servi par un point d'accès applicatif |
| Métadonnées | Supprimées au ré-encodage (EXIF, géolocalisation) |
| Comportement si fichier malveillant détecté | Rejet HTTP 400, événement de sécurité journalisé, fichier non conservé |

### 6. Sessions (`ASVS 7.1.1`, `7.1.2`)

| Décision | Valeur | Motif |
|---|---|---|
| Durée de vie du jeton d'accès | 15 minutes | Limite la fenêtre d'exploitation d'un jeton volé |
| Durée de vie du jeton de rafraîchissement | 7 jours | Confort d'usage |
| Délai d'inactivité | 7 jours (porté par le jeton de rafraîchissement) | — |
| Durée de vie absolue de session | 30 jours | Réauthentification imposée au-delà |
| Sessions simultanées autorisées | Illimitées, mais révocables individuellement | Usage multi-appareils |
| Rotation du jeton de rafraîchissement | À chaque usage | Détection de réutilisation (T07) |
| Comportement en cas de réutilisation détectée | Révocation de **toute** la chaîne de jetons de l'utilisateur | Jeton volé présumé |

> L'ASVS `7.1.1` demande de justifier tout écart par rapport aux exigences de
> réauthentification du NIST SP 800-63B. Les valeurs ci-dessus sont celles d'une
> application grand public ; le NIST admet des règles plus souples dès lors que
> d'autres contrôles d'atténuation existent — ici la rotation et la détection de
> réutilisation.

### 7. Politique de mot de passe et anti-automatisation (`ASVS 6.1.1`)

| Décision | Valeur |
|---|---|
| Longueur | 8 minimum (15 recommandé dans l'interface), 128 maximum |
| Composition | Aucune règle imposée (`6.2.5`) |
| Vérification contre les mots de passe courants | Corpus de 3 000 minimum (`6.2.4`) |
| Vérification contre les mots de passe fuités | Oui (`6.2.12`) |
| Liste de mots propres au contexte interdits | `vintage`, `marketplace`, `elkhanfaf`, nom du projet, nom de domaine (`6.1.2`) |
| Renouvellement périodique | **Non imposé** (`6.2.10`) |
| Collage, gestionnaires de mots de passe | Autorisés (`6.2.7`) |
| Blocage de compte | **Jamais** — limitation de débit uniquement, pour éviter un déni de service par blocage malveillant (`6.1.1`) |

### 8. Inventaire de journalisation (`ASVS 16.1.1`)

| Événement | Données journalisées | Niveau |
|---|---|---|
| Connexion réussie | identifiant utilisateur, IP, horodatage UTC, agent | N1 |
| Connexion échouée | identifiant **tenté** (non confirmé), IP, horodatage | N1 |
| Refus d'autorisation | utilisateur, ressource visée, action, horodatage | N1 |
| Tentative de contournement de validation | route, nature du rejet, horodatage | N1 |
| Déclenchement de limitation de débit | utilisateur ou IP, route, horodatage | N1 |
| Fichier malveillant rejeté | utilisateur, motif, horodatage | N1 |
| Changement d'état de commande | commande, acteur, ancien et nouvel état | N1 |
| Action de modération | administrateur, cible, décision | N1 |
| Erreur inattendue | trace technique, identifiant de corrélation | N1 |

**Jamais journalisé :** mot de passe (même tronqué), jeton complet, empreinte de
mot de passe, clé API, adresse de livraison complète (`16.2.5`).

**Format :** JSON structuré, horodatage UTC (`16.2.2`), expédition hors de
l'hôte applicatif (`16.4.3`), conservation 90 jours.

### 9. Secrets et rotation (`ASVS 13.1.4`)

| Secret | Emplacement | Rotation |
|---|---|---|
| Clé de signature des jetons | Coffre CI / variable d'environnement | À la demande ; rotation = invalidation de toutes les sessions |
| Identifiants de base de données | Coffre CI / variable d'environnement | À chaque changement d'environnement |
| Clé API Gemini | Coffre CI / variable d'environnement | Immédiatement en cas de suspicion d'exposition |

**Aucun secret dans le code source ni dans un artefact de construction**
(`13.3.1`). Contrôlé par crochet local et analyse d'historique complet en CI.

### 10. Besoins de communication (`ASVS 13.1.1`)

| Service externe | Usage | Déclenché par |
|---|---|---|
| Google Gemini API | Génération de description d'annonce | Action du vendeur |

Aucun autre service externe. Aucun emplacement externe fourni par
l'utilisateur n'est appelé par le serveur : il n'existe donc **aucune surface
SSRF** dans le périmètre fonctionnel retenu.

## Consequences

**Positive**
- Les exigences de mise en œuvre associées deviennent vérifiables : il existe
  désormais une référence écrite contre laquelle comparer le code.
- Les valeurs chiffrées ci-dessus sont directement transposables en schémas de
  validation et en cas de test de la phase 3.
- Les sections de justification du rapport sont pré-rédigées.

**Negative**
- Certaines valeurs sont arbitraires (5 Mo, 50 annonces, 8 images). Elles sont
  explicitement arbitraires *et documentées*, ce qui vaut mieux qu'implicites et
  dispersées dans le code.
- Toute évolution devra donner lieu à un nouveau registre : une décision
  documentée puis contredite par le code est pire qu'une décision absente, car
  elle induit le vérificateur en erreur. Le répertoire `docs/adr/` est protégé
  par `CODEOWNERS` à cette fin.
