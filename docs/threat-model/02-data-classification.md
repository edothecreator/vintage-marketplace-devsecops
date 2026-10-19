# Classification des données et exigences de protection

> **Phase 1 — Conception.**
> Satisfait les exigences documentaires ASVS `14.1.1` et `14.1.2`, qui demandent
> que les données sensibles soient identifiées et classées, et que chaque niveau
> de protection soit assorti d'un ensemble documenté d'exigences.
>
> Pratiques : **P24** Security requirement gathering, **P23** Risk assessment.

---

## 1. Niveaux de protection définis

| Niveau | Nom | Définition |
|---|---|---|
| **N3** | Critique | Compromission entraînant une usurpation de compte ou un accès généralisé |
| **N2** | Sensible | Donnée personnelle ou commerciale dont la divulgation nuit à un utilisateur identifié |
| **N1** | Interne | Donnée non publique mais sans préjudice direct en cas de divulgation |
| **N0** | Publique | Donnée destinée à être publiée |

---

## 2. Inventaire des données

| Donnée | Niveau | Justification |
|---|---|---|
| Mot de passe (en clair, en transit) | **N3** | Permet l'usurpation ; réutilisé sur d'autres services par les utilisateurs |
| Empreinte de mot de passe | **N3** | Attaquable hors ligne si divulguée |
| Clé de signature des jetons | **N3** | Permet la forge de jetons pour tout compte |
| Clé API Gemini | **N3** | Usage frauduleux, épuisement de quota, coût |
| Identifiants de base de données | **N3** | Accès intégral aux données |
| Jeton de session / rafraîchissement | **N3** | Détournement de session |
| Adresse e-mail | **N2** | Donnée personnelle ; permet l'énumération de comptes |
| Adresse de livraison | **N2** | Donnée personnelle ; localisation d'une personne |
| Historique de commandes | **N2** | Révèle les habitudes d'achat d'une personne identifiée |
| Association acheteur ↔ annonce | **N2** | Lien entre une personne et un achat |
| Rôle de l'utilisateur | **N1** | Utile à un attaquant pour cibler ses tentatives |
| Journaux de sécurité | **N1** | Révèlent le comportement interne de l'application |
| Contenu d'annonce (titre, description, prix) | **N0** | Destiné à la publication |
| Images d'annonce | **N0** | Destinées à la publication |
| Avis déposés | **N0** | Destinés à la publication |

---

## 3. Exigences de protection par niveau

### Niveau N3 — Critique

| Exigence | Mise en œuvre | ASVS |
|---|---|---|
| Jamais stocké en clair | Argon2id pour les mots de passe | `11.4.2` |
| Jamais dans le code source | Coffre de secrets, analyse Gitleaks | `13.3.1` |
| Jamais journalisé, même masqué partiellement, pour les mots de passe | Liste d'exclusion de journalisation | `16.2.5` |
| Jamais transmis à un tiers | Exclusion explicite des invites LLM | — |
| Rotation définie | Calendrier documenté | `13.1.4` |
| Jamais dans une URL ni une chaîne de requête | Corps ou en-tête HTTP uniquement | `14.2.1` |
| Jamais dans le stockage du navigateur, hors jeton de session en cookie | Cookie `__Host-`, `HttpOnly` | `14.3.3`, `3.3.1` |

### Niveau N2 — Sensible

| Exigence | Mise en œuvre | ASVS |
|---|---|---|
| Accès restreint au propriétaire de la donnée | Autorisation au niveau de la donnée | `8.2.2` |
| Accès restreint au niveau du champ | Projection par DTO selon le rôle | `8.2.3`, `15.3.1` |
| Non divulgué à un tiers non fiable | Aucun traceur externe | `14.2.3` |
| Refus de mise en cache côté client | `Cache-Control: no-store` | `14.3.2` |
| Journalisation du seul identifiant technique, jamais du contenu | Identifiants plutôt que valeurs | `16.2.5` |
| Chiffrement en transit | TLS 1.2 minimum, 1.3 préféré | `12.1.1` |

### Niveau N1 — Interne

| Exigence | Mise en œuvre | ASVS |
|---|---|---|
| Journaux protégés contre la modification | Expédition hors hôte applicatif | `16.4.2`, `16.4.3` |
| Points d'accès de supervision non exposés | Réseau interne uniquement | `13.4.5` |
| Pas de divulgation de version des composants | Suppression des bannières | `13.4.6` |

### Niveau N0 — Publique

| Exigence | Mise en œuvre | ASVS |
|---|---|---|
| Assainissement avant restitution | Pas de rendu HTML brut | `1.3.1`, `3.2.2` |
| Protection contre le moissonnage massif | Limitation de débit | `2.4.1` |

> Le niveau N0 n'est pas exempt d'exigences. Une donnée publique reste une
> **entrée non fiable** si elle provient d'un utilisateur : une description
> d'annonce est destinée à être publiée, mais elle doit être assainie avant
> restitution sous peine de XSS stocké.

---

## 4. Décision sur la minimisation

| Donnée | Décision |
|---|---|
| Adresse de livraison | Collectée à la commande uniquement, jamais exposée au-delà des deux parties |
| Numéro de téléphone | **Non collecté** — non nécessaire au périmètre fonctionnel |
| Données bancaires réelles | **Jamais collectées** — paiement simulé |
| Historique de navigation | **Non collecté** |

> La façon la plus fiable de protéger une donnée est de ne pas la collecter.
> Les lignes « non collecté » ci-dessus sont des contrôles de sécurité à part
> entière, pas des lacunes fonctionnelles.

---

## 5. Conservation

| Donnée | Conservation | Motif |
|---|---|---|
| Compte utilisateur | Jusqu'à suppression du compte | Fonctionnel |
| Jeton de rafraîchissement | Jusqu'à expiration ou révocation | Fin de session (`ASVS 7.4.1`) |
| Journaux de sécurité | 90 jours (projet académique) | Investigation (`ASVS 16.1.1`) |
| Commandes | Durée de vie du compte | Historique et support des avis |

> Projet académique : aucune donnée réelle d'utilisateur n'est traitée. Les
> durées ci-dessus documentent la décision de conception, non une obligation
> réglementaire applicable.
