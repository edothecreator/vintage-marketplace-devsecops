# Modèle de menaces — STRIDE

> **Phase 1 — Conception.** Produit *avant* toute écriture de code applicatif.
>
> Pratique : **P7** Threat modelling (Tier 1, 40 mentions).
> Méthode : STRIDE appliqué par flux de données.
> Référence d'architecture : `01-architecture.md`.

---

## Méthode

STRIDE catégorise les menaces selon six axes :

| Lettre | Menace | Propriété violée |
|---|---|---|
| **S** | Spoofing — usurpation d'identité | Authentification |
| **T** | Tampering — altération | Intégrité |
| **R** | Repudiation — répudiation | Non-répudiation |
| **I** | Information disclosure — divulgation | Confidentialité |
| **D** | Denial of service — déni de service | Disponibilité |
| **E** | Elevation of privilege — élévation de privilège | Autorisation |

Chaque menace identifiée porte un identifiant `Tnn`, une cotation
vraisemblance × impact (détaillée dans `04-risk-assessment.md`), une mesure
d'atténuation, **l'exigence ASVS correspondante**, et le mécanisme de
vérification prévu.

> La colonne ASVS n'est pas décorative. C'est elle qui relie le modèle de
> menaces aux exigences vérifiables, puis aux tests de la phase 3, puis aux
> preuves du rapport. Sans elle, le modèle de menaces reste un document mort.

---

## DF1 — Inscription et connexion

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T01 | S | Bourrage d'identifiants depuis des fuites tierces | Limitation de débit par IP et par compte, réponse adaptative | `6.3.1`, `6.1.1` | Test d'abus, DAST |
| T02 | S | Attaque par force brute sur un compte | Limitation de débit progressive, sans blocage de compte exploitable | `6.3.1` | Test d'abus |
| T03 | I | Énumération de comptes via messages d'erreur distincts | Message d'erreur générique, temps de réponse homogène | `6.3.8` | Test d'abus |
| T04 | I | Divulgation d'empreintes en cas de fuite de base | Argon2id, paramètres conformes à l'annexe C de l'ASVS | `11.4.2` | Revue de code |
| T05 | T | Forge de jeton via l'algorithme `none` | Liste d'autorisation d'algorithmes, rejet de `none` | `9.1.2` | Test d'abus |
| T06 | T | Jeton signé avec une clé non fiable (`jku`, `jwk`) | Clés issues de sources préconfigurées uniquement | `9.1.3` | Revue de code |
| T07 | S | Réutilisation d'un jeton de rafraîchissement volé | Rotation à chaque usage, détection de réutilisation, révocation en cascade | `7.4.1` | Test d'abus |
| T08 | I | Mot de passe faible accepté | Longueur minimale, vérification contre un corpus de mots de passe fuités | `6.2.1`, `6.2.12` | Test d'abus |
| T09 | D | Déni de service par hachage coûteux répété | Limitation de débit en amont de la fonction de hachage | `2.4.1` | Test d'abus |

---

## DF2 — Recherche et consultation d'annonces

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T10 | T | Injection SQL via le paramètre de recherche | Requêtes paramétrées via l'ORM, aucune concaténation | `1.2.4` | SAST, test d'abus, **démo V1** |
| T11 | I | Moissonnage massif du catalogue et des vendeurs | Limitation de débit, anti-automatisation, pagination bornée | `2.4.1` | Test d'abus |
| T12 | I | Divulgation de champs non publics d'une annonce | Projection par DTO, jamais l'entité ORM complète | `15.3.1` | Revue de code, test d'abus |
| T13 | D | Requête de recherche coûteuse en ressources | Bornes sur la pagination, délai d'expiration de requête | `15.1.3` | Revue de code |

---

## DF3 — Création, modification et suppression d'annonce

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T14 | **E** | **Un vendeur modifie l'annonce d'un autre vendeur (IDOR / BOLA)** | **Propriété résolue en base, jamais depuis le corps de requête** | `8.2.2`, `8.3.1` | **Test d'abus, démo V5** |
| T15 | E | Un acheteur crée une annonce sans être vendeur | Contrôle d'accès au niveau de la fonction | `8.2.1` | Test d'abus |
| T16 | T | Affectation de masse : injection de `sellerId` ou `status` | Liste d'autorisation explicite des champs par action | `15.3.3` | Test d'abus |
| T17 | T | XSS stocké via la description d'annonce | Stockage brut, assainissement et encodage en restitution | `1.3.1`, `3.2.2` | Test d'abus |
| T18 | T | Prix négatif ou nul | Validation par schéma, bornes métier | `2.2.1` | Test d'abus |
| T19 | R | Suppression d'annonce non imputable | Journalisation des opérations de modification avec acteur | `16.3.3` | Revue des journaux |

> **T14 est la menace centrale du projet.** Le contrôle d'accès rompu est la
> catégorie de vulnérabilité la plus répandue en pratique, et l'ASVS indique
> explicitement que les outils automatisés ne peuvent pas la vérifier
> pleinement. C'est la raison d'être de la pratique **P3** et de la
> démonstration V5.

---

## DF4 — Téléversement d'image

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T20 | E | Téléversement d'un exécutable déguisé en image | Vérification des octets magiques, correspondance extension/contenu, ré-encodage de l'image | `5.2.2` | Test d'abus |
| T21 | E | Exécution côté serveur d'un fichier téléversé | Stockage hors racine web, jamais interprété comme code | `5.3.1` | Test d'abus, DAST |
| T22 | T | Traversée de chemin par le nom de fichier fourni | Nom interne généré, nom utilisateur jamais utilisé comme chemin | `5.3.2` | Test d'abus |
| T23 | D | Épuisement du stockage par volume ou nombre | Plafond de taille, quota par utilisateur | `5.2.1`, `5.2.4` | Test d'abus |
| T24 | D | Image à très grande dimension en pixels | Rejet au-delà d'une dimension maximale | `5.2.6` | Test d'abus |
| T25 | T | SVG porteur de script | Rejet du SVG, ou assainissement strict | `1.3.4` | Test d'abus |
| T26 | E | Téléversement sur l'annonce d'un autre vendeur | Contrôle de propriété de l'annonce cible | `8.2.2` | Test d'abus |
| T27 | I | Métadonnées EXIF révélant la géolocalisation du vendeur | Suppression des métadonnées au ré-encodage | `14.2.8` | Revue de code |

---

## DF5 — Passation de commande

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T28 | **T** | **Double vente d'un article unique par requêtes concurrentes** | **Verrou transactionnel `SELECT ... FOR UPDATE`, transaction atomique** | `2.3.4`, `2.3.3` | **Test de concurrence** |
| T29 | E | Un acheteur consulte les commandes d'un autre (BOLA) | Filtrage par propriétaire résolu en base | `8.2.2` | Test d'abus |
| T30 | T | Altération du prix dans la requête de commande | Prix lu en base, jamais accepté du client | `2.2.1`, `15.3.3` | Test d'abus |
| T31 | T | Commande d'un article déjà vendu ou retiré | Vérification d'état dans la transaction | `2.3.1` | Test d'abus |
| T32 | I | Divulgation de l'adresse de livraison à un tiers | Contrôle d'accès au niveau du champ | `8.2.3` | Test d'abus |
| T33 | R | Commande contestée sans trace | Journalisation horodatée UTC avec acteur | `16.2.1`, `16.2.2` | Revue des journaux |
| T34 | D | Création massive de commandes | Limitation de débit par compte | `2.4.1` | Test d'abus |

> **T28 est la signature de sécurité de ce projet.** Les articles vintage sont
> uniques : contrairement à un commerce de biens en stock, une double vente
> n'est pas un écart d'inventaire mais une défaillance fonctionnelle
> irréparable. Elle est vérifiée par un test de concurrence réel, non par deux
> requêtes séquentielles.

---

## DF6 — Dépôt d'avis

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T35 | T | XSS stocké via le corps de l'avis | Assainissement et encodage en restitution | `1.3.1` | Test d'abus |
| T36 | E | Avis déposé sans achat préalable | Vérification de l'existence d'une commande aboutie | `2.3.1` | Test d'abus |
| T37 | T | Avis multiples sur une même commande | Contrainte d'unicité, vérification métier | `2.3.2` | Test d'abus |
| T38 | T | Note hors bornes | Validation par schéma | `2.2.1` | Test d'abus |

---

## DF7 — Modération

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T39 | E | Un acheteur ou vendeur accède aux fonctions de modération | Contrôle d'accès au niveau de la fonction | `8.2.1` | Test d'abus |
| T40 | E | Élévation par injection du champ `role` à l'inscription | Liste d'autorisation des champs, rôle jamais acceptable du client | `15.3.3` | Test d'abus |
| T41 | R | Action de modération non imputable | Journalisation de toutes les décisions d'autorisation sensibles | `16.3.2` | Revue des journaux |

---

## DF8 / DF9 — Génération de description par IA

| Id. | STRIDE | Menace | Atténuation | ASVS / OWASP | Vérifié par |
|---|---|---|---|---|---|
| T42 | **T** | **Injection d'invite via le titre de l'annonce** | **Invite structurée, séparation système/utilisateur, neutralisation des motifs d'instruction, longueur bornée** | **LLM01** | **Test d'abus, démo V7** |
| T43 | T | Traitement non sûr de la sortie du modèle | Sortie traitée comme non fiable : assainie avant stockage, encodée en restitution, jamais rendue en HTML brut | LLM02, `1.3.1` | Test d'abus |
| T44 | I | Fuite de secret ou de donnée personnelle vers le tiers | Exclusion explicite : aucun secret, aucune donnée d'un autre utilisateur dans l'invite | LLM06 | Revue de code |
| T45 | **D** | **Épuisement du quota gratuit / abus de coût** | **Limitation de débit par utilisateur, plafond quotidien global sous le quota, plafond de jetons en sortie** | **LLM10**, `2.4.1` | Test d'abus, supervision |
| T46 | I | Divulgation de l'invite système | Invite système non renvoyée, sortie filtrée | LLM01 | Test d'intrusion |
| T47 | D | Indisponibilité du tiers propageant une panne | Délai d'expiration court, dégradation progressive | `16.5.2` | Test d'abus |

> **T45 mérite d'être souligné.** Le quota de l'offre gratuite Gemini rend le
> risque d'abus de consommation **concret et mesurable**, là où il reste
> souvent théorique. Cela en fait un contrôle réellement démontrable.

---

## Menaces transverses

| Id. | STRIDE | Menace | Atténuation | ASVS | Vérifié par |
|---|---|---|---|---|---|
| T48 | T | CSRF sur les opérations d'écriture | `SameSite`, jeton anti-falsification ou validation `Sec-Fetch-*` | `3.5.1`, `3.3.2` | DAST, test d'abus |
| T49 | I | Absence d'en-têtes de sécurité du navigateur | HSTS, CSP, `nosniff`, `Referrer-Policy`, `frame-ancestors` | `3.4.1`–`3.4.6` | **DAST, démo V4** |
| T50 | I | Interception du trafic en clair | TLS obligatoire, HSTS | `12.1.1`, `3.4.1` | DAST |
| T51 | I | Message d'erreur révélant la pile d'exécution | Message générique au client, détail en journal uniquement | `16.5.1` | DAST, test d'abus |
| T52 | E | Dépendance tierce vulnérable | SCA, analyse de dépendances, délais de correction documentés | `15.2.1`, `15.1.1` | **SCA, démo V3** |
| T53 | E | Image de conteneur vulnérable | Analyse d'image, image de base minimale épinglée | `15.2.1` | **Trivy, démo V6** |
| T54 | I | **Secret versionné dans le dépôt** | **Crochets locaux + analyse d'historique complet en CI** | `13.3.1` | **Gitleaks, démo V2** |
| T55 | E | Compromission de la chaîne d'approvisionnement CI/CD | Permissions de moindre privilège, actions épinglées, secrets en coffre | `13.3.1` | Revue de configuration |
| T56 | I | Exposition de points d'accès de supervision | Réseau interne uniquement | `13.4.5` | Test d'intrusion |
| T57 | T | Confusion de type ou pollution de prototype (JavaScript) | Comparaisons strictes, `Map`/`Set` plutôt que littéraux d'objet | `15.3.5`, `15.3.6` | SAST, revue de code |

---

## Synthèse : couverture STRIDE

| Catégorie | Menaces identifiées |
|---|---|
| **S** Spoofing | T01, T02, T07 |
| **T** Tampering | T05, T06, T10, T16, T17, T18, T22, T25, T28, T30, T31, T35, T37, T38, T42, T43, T48, T57 |
| **R** Repudiation | T19, T33, T41 |
| **I** Information disclosure | T03, T04, T08, T11, T12, T27, T32, T44, T46, T49, T50, T51, T54, T56 |
| **D** Denial of service | T09, T13, T23, T24, T34, T45, T47 |
| **E** Elevation of privilege | T14, T15, T20, T21, T26, T29, T36, T39, T40, T52, T53, T55 |

**57 menaces identifiées** sur 9 flux de données et 1 groupe transverse.

---

## Menaces alimentant les démonstrations de la phase 9

| Démo | Menace | Contrôle qui doit détecter | Contrôles qui ne détecteront pas |
|---|---|---|---|
| V1 | T10 injection SQL | SAST | — |
| V2 | T54 secret versionné | Gitleaks | — |
| V3 | T52 dépendance vulnérable | SCA / Retire.js | SAST, DAST |
| V4 | T49 en-têtes absents | DAST | **SAST** (propriété d'exécution) |
| V5 | **T14 IDOR** | **Suite de tests d'abus** | **SAST et DAST** |
| V6 | T53 image vulnérable | Trivy | SAST, DAST, SCA |
| V7 | T42 injection d'invite | Test d'abus dédié | SAST, DAST |

> La colonne de droite est la plus instructive du rapport. Elle documente les
> **limites de couverture** de chaque famille d'outils, ce qui est un résultat
> d'analyse et non un aveu de faiblesse.

---

## Menaces explicitement acceptées

| Id. | Menace | Motif d'acceptation |
|---|---|---|
| — | Absence d'authentification multifacteur | L'ASVS exige la MFA à partir du niveau 2 (`6.3.3`). Le périmètre retenu est niveau 1 complet + niveau 2 ciblé, et V6 n'est retenu au niveau 2 que partiellement. Décision consignée dans ADR 0005. |
| — | Absence de RASP | Pratique Tier 2 (`P25`) non retenue ; aucune option libre mature pour Node.js dans le temps imparti |
| — | Absence d'IAST | Pratique Tier 2 (`P19`) non retenue ; pas d'option libre pour l'écosystème JavaScript |
| — | Environnement de préproduction uniquement | Projet académique ; aucun déploiement en production |

Ces acceptations sont documentées ici afin d'être **revendiquées plutôt que
découvertes** lors de la soutenance.
