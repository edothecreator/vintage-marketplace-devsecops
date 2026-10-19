# Analyse de risques

> **Phase 1 — Conception.**
> Pratique : **P23** Risk assessment (Tier 2, 15 mentions).
> Entrée : les 57 menaces de `03-threat-model.md`.
> Sortie : ordre de priorité de construction des contrôles.

---

## Méthode de cotation

**Vraisemblance** — probabilité qu'un attaquant tente et réussisse :

| Niveau | Critère |
|---|---|
| 3 — Élevée | Exploitable sans compte, sans outil spécialisé, ou automatisable à grande échelle |
| 2 — Moyenne | Nécessite un compte authentifié ou une connaissance du système |
| 1 — Faible | Nécessite un accès privilégié ou des conditions peu probables |

**Impact** — conséquence pour l'application et ses utilisateurs :

| Niveau | Critère |
|---|---|
| 3 — Élevé | Usurpation de compte, accès aux données d'autrui, perte d'intégrité métier irréparable |
| 2 — Moyen | Divulgation limitée, dégradation de service, atteinte à un utilisateur |
| 1 — Faible | Information technique, gêne sans préjudice |

**Risque = Vraisemblance × Impact.** Seuils retenus :
**Critique** ≥ 9, **Élevé** 6–8, **Moyen** 3–4, **Faible** ≤ 2.

---

## Risques critiques (score 9)

| Id. | Menace | V | I | Score | Priorité de construction |
|---|---|---|---|---|---|
| T14 | Un vendeur modifie l'annonce d'un autre (IDOR) | 3 | 3 | **9** | **1** |
| T10 | Injection SQL via la recherche | 3 | 3 | **9** | **2** |
| T54 | Secret versionné dans le dépôt | 3 | 3 | **9** | **3** |
| T20 | Exécutable déguisé en image | 3 | 3 | **9** | **4** |
| T21 | Exécution serveur d'un fichier téléversé | 3 | 3 | **9** | **5** |
| T40 | Élévation par injection du champ `role` | 3 | 3 | **9** | **6** |
| T29 | Un acheteur consulte les commandes d'autrui (BOLA) | 3 | 3 | **9** | **7** |
| T42 | Injection d'invite dans le LLM | 3 | 3 | **9** | **8** |

### Commentaire

Les deux premières lignes commandent l'ordre de réalisation de la phase 2.

**T14 et T29** relèvent du contrôle d'accès rompu. Ils sont cotés en
vraisemblance 3 car exploitables par n'importe quel utilisateur authentifié en
modifiant un identifiant dans une requête — aucune compétence particulière
requise. C'est pourquoi l'intergiciel d'autorisation est le premier composant
construit, avant les fonctionnalités qu'il protège.

**T54** est coté 9 bien qu'il s'agisse d'une erreur de développement et non
d'une attaque : le dépôt est public, et un secret versionné est scrapé en
quelques minutes. Le contrôle correspondant a donc été construit dès la
phase 0, avant tout code.

---

## Risques élevés (score 6)

| Id. | Menace | V | I | Score |
|---|---|---|---|---|
| T01 | Bourrage d'identifiants | 3 | 2 | 6 |
| T02 | Force brute sur un compte | 3 | 2 | 6 |
| T05 | Forge de jeton via `alg: none` | 2 | 3 | 6 |
| T07 | Réutilisation d'un jeton de rafraîchissement volé | 2 | 3 | 6 |
| T16 | Affectation de masse sur une annonce | 3 | 2 | 6 |
| T17 | XSS stocké via description | 3 | 2 | 6 |
| T22 | Traversée de chemin par nom de fichier | 2 | 3 | 6 |
| T26 | Téléversement sur l'annonce d'autrui | 2 | 3 | 6 |
| T28 | **Double vente d'un article unique** | 2 | 3 | **6** |
| T30 | Altération du prix à la commande | 2 | 3 | 6 |
| T32 | Divulgation de l'adresse de livraison | 2 | 3 | 6 |
| T35 | XSS stocké via avis | 3 | 2 | 6 |
| T39 | Accès acheteur aux fonctions de modération | 2 | 3 | 6 |
| T45 | Épuisement du quota IA / abus de coût | 3 | 2 | 6 |
| T49 | En-têtes de sécurité absents | 3 | 2 | 6 |
| T52 | Dépendance tierce vulnérable | 3 | 2 | 6 |
| T53 | Image de conteneur vulnérable | 3 | 2 | 6 |
| T55 | Compromission de la chaîne CI/CD | 2 | 3 | 6 |

### Commentaire sur T28

**T28** (double vente) est coté en vraisemblance 2 et non 3 : il faut deux
acheteurs agissant dans la même fenêtre de quelques millisecondes, ce qui
suppose soit une coïncidence, soit une tentative délibérée.

Son impact est néanmoins coté 3, car l'article étant **unique par nature**, la
défaillance est irréparable : on ne peut ni réapprovisionner, ni proposer un
article équivalent. C'est une perte d'intégrité métier définitive, et non un
simple écart d'inventaire.

---

## Risques moyens (score 3 à 4)

| Id. | Menace | V | I | Score |
|---|---|---|---|---|
| T03 | Énumération de comptes | 3 | 1 | 3 |
| T08 | Mot de passe faible accepté | 3 | 1 | 3 |
| T11 | Moissonnage du catalogue | 3 | 1 | 3 |
| T12 | Divulgation de champs non publics | 2 | 2 | 4 |
| T15 | Création d'annonce par un acheteur | 2 | 2 | 4 |
| T18 | Prix négatif ou nul | 2 | 2 | 4 |
| T23 | Épuisement du stockage | 2 | 2 | 4 |
| T25 | SVG porteur de script | 2 | 2 | 4 |
| T27 | Métadonnées EXIF de géolocalisation | 2 | 2 | 4 |
| T31 | Commande d'un article déjà vendu | 2 | 2 | 4 |
| T34 | Création massive de commandes | 2 | 2 | 4 |
| T36 | Avis sans achat préalable | 2 | 2 | 4 |
| T37 | Avis multiples sur une commande | 2 | 2 | 4 |
| T43 | Traitement non sûr de la sortie LLM | 2 | 2 | 4 |
| T44 | Fuite vers le fournisseur LLM | 2 | 2 | 4 |
| T48 | CSRF sur les écritures | 2 | 2 | 4 |
| T51 | Message d'erreur révélant la pile | 3 | 1 | 3 |
| T57 | Confusion de type / pollution de prototype | 2 | 2 | 4 |

---

## Risques faibles (score ≤ 2)

| Id. | Menace | V | I | Score |
|---|---|---|---|---|
| T04 | Divulgation d'empreintes en cas de fuite | 1 | 2 | 2 |
| T06 | Jeton signé par une clé non fiable | 1 | 2 | 2 |
| T09 | Déni de service par hachage répété | 2 | 1 | 2 |
| T13 | Requête de recherche coûteuse | 2 | 1 | 2 |
| T19 | Suppression d'annonce non imputable | 1 | 2 | 2 |
| T24 | Image à dimension excessive | 2 | 1 | 2 |
| T33 | Commande contestée sans trace | 1 | 2 | 2 |
| T38 | Note hors bornes | 2 | 1 | 2 |
| T41 | Modération non imputable | 1 | 2 | 2 |
| T46 | Divulgation de l'invite système | 2 | 1 | 2 |
| T47 | Panne du tiers LLM | 2 | 1 | 2 |
| T50 | Interception de trafic en clair | 1 | 2 | 2 |
| T56 | Exposition de points de supervision | 1 | 2 | 2 |

> Risque faible ne signifie pas « non traité ». Toutes ces menaces disposent
> d'une mesure d'atténuation dans le modèle de menaces. Le score détermine
> l'**ordre** de construction, pas l'inclusion.

---

## Répartition

| Niveau | Nombre | Part |
|---|---|---|
| Critique (≥ 9) | 8 | 14 % |
| Élevé (6–8) | 18 | 32 % |
| Moyen (3–4) | 18 | 32 % |
| Faible (≤ 2) | 13 | 23 % |
| **Total** | **57** | **100 %** |

---

## Conséquences sur l'ordre de réalisation

L'analyse de risques dicte directement la séquence de la phase 2.

| Ordre | Composant | Menaces couvertes |
|---|---|---|
| 1 | Intergiciel d'autorisation central | T14, T15, T26, T29, T39 |
| 2 | Accès aux données par ORM paramétré | T10 |
| 3 | Validation par schéma, listes d'autorisation de champs | T16, T18, T30, T38, T40 |
| 4 | Authentification, jetons, rotation | T01–T08 |
| 5 | Téléversement de fichiers | T20–T27 |
| 6 | Transaction de commande avec verrou | T28, T31 |
| 7 | Assainissement en restitution | T17, T35, T43 |
| 8 | Limitation de débit | T09, T11, T34, T45 |
| 9 | En-têtes, CSRF, gestion d'erreurs | T48, T49, T51 |
| 10 | Journalisation de sécurité | T19, T33, T41 |

> L'intergiciel d'autorisation est construit **avant** les fonctionnalités
> qu'il protège. Construire d'abord les routes puis y ajouter l'autorisation
> est le mécanisme par lequel les IDOR apparaissent : il subsiste toujours une
> route où l'ajout a été oublié.

---

## Risques projet (distincts des risques applicatifs)

| Risque | Impact | Atténuation |
|---|---|---|
| Dérive du périmètre vers les fonctionnalités | Élevé | Périmètre gelé ; toute addition doit en remplacer une autre |
| Preuves non capturées, à reconstituer en fin de projet | Élevé | Capture intégrée à la définition de « terminé » de chaque tâche |
| Quota gratuit Gemini épuisé pendant une démonstration | Moyen | Plafond applicatif sous le quota ; supervision ; modèle Flash-Lite |
| Phase mobile privée de temps | Moyen | Déjà différée et cadrée ; API indifférente au client |
| Pratique Tier 1 présente mais non démontrable | Élevé | Chaque pratique automatisable reçoit une démonstration en phase 9 |
