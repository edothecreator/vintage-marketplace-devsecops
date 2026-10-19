# ADR 0005 — Niveau de vérification ASVS visé et périmètre retenu

**Status:** Accepted
**Date:** Phase 1
**Practice:** P24 Security requirement gathering (Tier 2)

## Context

Le sujet exige la prise en compte des risques du Top 10 OWASP et de l'API
Security Top 10. Ces catalogues énumèrent des *risques*, non des *exigences
vérifiables*. L'ASVS 5.0 fournit les exigences correspondantes, organisées en
trois niveaux de vérification sur environ 350 exigences réparties en 17
chapitres.

L'ASVS encourage explicitement les organisations à produire une version adaptée
à leur domaine, en écartant les chapitres non pertinents, **à condition que le
périmètre retenu soit énoncé et que les exclusions soient justifiées dans le
rapport de vérification**. Le référentiel précise par ailleurs que le rapport
doit indiquer ce qui a été *inclus* plutôt que ce qui a été omis.

Il faut donc décider, et écrire, trois choses : le niveau visé, les chapitres
retenus, et le motif de chaque exclusion.

## Decision

**Niveau 1 complet, plus niveau 2 ciblé** sur les chapitres où une place de
marché porte un risque réel.

### Périmètre par chapitre

| Chapitre | Objet | Niveau visé | Motif |
|---|---|---|---|
| V1 | Encodage et nettoyage | L1 + L2 | Injection et XSS : risques critiques T10, T17, T35 |
| V2 | Validation et logique métier | **L1 + L2** | Logique métier à valeur marchande ; double vente (T28) |
| V3 | Sécurité du frontend web | L1 + L2 partiel | Front-end présent ; L3 non pertinent (pas de politique CSP par réponse) |
| V4 | API et service web | **L1 + L2** | L'API est le cœur du système, exigence explicite du sujet |
| V5 | Gestion des fichiers | **L1 + L2** | Téléversement d'images : 8 menaces identifiées (T20–T27) |
| V6 | Authentification | **L1 + L2 sauf 6.3.3** | Voir l'exception documentée ci-dessous |
| V7 | Gestion des sessions | L1 + L2 partiel | Sessions par jeton ; L2 retenu pour l'expiration et la révocation |
| V8 | Autorisation | **L1 + L2** | **Risque le plus critique du projet (T14, T29, T39)** |
| V9 | Jetons autonomes | L1 + L2 | JWT utilisés ; forge de jeton (T05, T06) |
| V10 | OAuth et OIDC | **EXCLU** | Aucune authentification fédérée dans le périmètre |
| V11 | Cryptographie | L1 + L2 partiel | Hachage de mots de passe et aléa ; pas de cryptographie applicative avancée |
| V12 | Communication sécurisée | L1 | TLS en préproduction ; mTLS inter-services non applicable |
| V13 | Configuration | **L1 + L2** | Gestion des secrets, fuite d'information ; dépôt public |
| V14 | Protection des données | L1 + L2 partiel | Données personnelles limitées, paiement simulé |
| V15 | Développement et architecture sécurisés | L1 + L2 partiel | Gestion des dépendances (T52) ; concurrence sécurisée (T28) |
| V16 | Journalisation et gestion des erreurs | **L1 + L2** | Exigence de traçabilité ; menaces de répudiation T19, T33, T41 |
| V17 | WebRTC | **EXCLU** | Aucune communication temps réel dans le périmètre |

### Justification des exclusions

**V10 — OAuth et OIDC.** Le périmètre fonctionnel ne comporte aucune
authentification fédérée : l'authentification est locale, par e-mail et mot de
passe. L'ASVS indique que les chapitres non utilisés peuvent être ignorés, et
cite nommément OAuth parmi les exemples. Cette exclusion est le résultat direct
de la décision de périmètre consignée dans `01-architecture.md` : ne pas
intégrer de fournisseur d'identité externe permet d'écarter un chapitre entier
de manière défendable, plutôt que de l'implémenter superficiellement.

**V17 — WebRTC.** Aucune communication audio, vidéo ou temps réel. L'ASVS
précise que ce chapitre ne s'applique qu'aux systèmes hébergeant leurs propres
serveurs TURN, média ou de signalisation.

### Exception documentée : authentification multifacteur (ASVS 6.3.3)

L'exigence `6.3.3` impose l'authentification multifacteur à partir du
niveau 2. Nous revendiquons le niveau 2 sur le chapitre V6 **à l'exception de
cette exigence**.

L'ASVS est explicite sur ce point : toute tentative d'assouplissement des
exigences de MFA doit être accompagnée d'un plan clair sur la manière dont les
risques liés à l'authentification seront atténués. Voici ce plan.

| Risque d'authentification | Contrôle compensatoire | ASVS |
|---|---|---|
| Bourrage d'identifiants (T01) | Limitation de débit par IP et par compte | `6.3.1` |
| Force brute (T02) | Limitation progressive sans blocage exploitable | `6.3.1`, `6.1.1` |
| Mot de passe faible (T08) | Minimum 8 caractères, vérification contre un corpus de mots de passe fuités | `6.2.1`, `6.2.12` |
| Mot de passe réutilisé | Vérification contre les 3 000 mots de passe les plus courants | `6.2.4` |
| Énumération de comptes (T03) | Message d'erreur générique, temps de réponse homogène | `6.3.8` |
| Vol de jeton de session (T07) | Rotation à chaque usage, détection de réutilisation, révocation en cascade | `7.4.1` |
| Comptes par défaut | Aucun compte `admin` ou `root` préexistant | `6.3.2` |

**Motif de l'exception.** La MFA suppose un canal secondaire : TOTP exige la
gestion du cycle de vie du secret partagé, des codes de récupération et de la
procédure de perte de facteur (`6.4.4`, `6.5.x`). Implémentée partiellement,
elle produirait un contrôle affaibli — par exemple une récupération de compte
contournant la MFA, ce que l'ASVS interdit explicitement (`6.4.3`) — et serait
donc moins défendable qu'une absence assumée accompagnée de contrôles
compensatoires.

Cette exception est revendiquée dans le rapport de vérification, et non
dissimulée.

## Consequences

**Positive**
- Le périmètre est borné et vérifiable. Tenter les 350 exigences aurait produit
  une couverture superficielle et invérifiable.
- Les chapitres retenus au niveau 2 correspondent exactement aux menaces
  critiques du modèle de menaces, ce qui rend la priorisation traçable.
- Deux chapitres exclus pour un motif de conception, non par renoncement.
- La liste d'exigences retenues devient la base de la suite de tests d'abus de
  la phase 3 et du rapport de vérification de la phase 10.

**Negative**
- Nous ne pouvons pas revendiquer « conforme ASVS niveau 2 » sans qualification.
  La formulation exacte retenue est : *niveau 1 complet, niveau 2 sur les
  chapitres V2, V4, V5, V6 (hors 6.3.3), V8, V13 et V16*.
- L'absence de MFA est une faiblesse réelle, et non une subtilité de périmètre.
  Elle est assumée et compensée, mais elle reste une limite du travail, reprise
  à ce titre dans le chapitre « limites et perspectives ».
- Le niveau 2 partiel sur V3, V7, V11, V14 et V15 demande de documenter
  exigence par exigence ce qui est retenu, faute de quoi la revendication est
  invérifiable. Ce travail est fait en phase 10.

## Alternatives considered

**Niveau 1 seul.** Rejeté. L'ASVS décrit le niveau 1 comme la première couche
de défense et environ 20 % des exigences. Sur une application manipulant des
comptes, des commandes et des téléversements, s'y limiter n'aurait pas couvert
les menaces critiques du modèle de menaces, notamment l'autorisation au niveau
de la donnée (`8.2.2`, niveau 1 en réalité) et au niveau du champ
(`8.2.3`, niveau 2).

**Niveau 2 complet sur les 15 chapitres applicables.** Rejeté. Environ 70 % de
350 exigences, soit près de 250 exigences à implémenter *et* à prouver, pour un
projet dont le livrable principal est la pipeline et non l'exhaustivité
applicative. Le résultat prévisible aurait été une liste cochée sans preuve.

**Niveau 3.** Rejeté. L'ASVS le réserve aux applications visant la plus haute
assurance ; il exige notamment une authentification matérielle en environnement
d'exécution certifié (`6.3`), hors de portée et hors de propos ici.

**Implémenter la MFA pour revendiquer V6 au niveau 2 complet.** Non rejeté sur
le fond : c'est l'amélioration la plus évidente du projet si le temps le permet.
Écarté du périmètre initial pour la raison exposée plus haut — une MFA
partielle est moins sûre qu'une absence assumée. Repris dans les perspectives.
