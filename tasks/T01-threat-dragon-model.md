# Tâche T01 — Construire le modèle dans OWASP Threat Dragon

**Phase :** 1
**Pratique :** P7 Threat modelling (Tier 1)
**Assignée à :** _(à définir — @anasIRISI ou @Hanane-ELFADIL)_
**Effort estimé :** 2 à 3 heures
**Prérequis :** aucun

---

## Contexte

La substance du modèle de menaces est **déjà rédigée**. Il ne s'agit pas de
refaire l'analyse, mais de la saisir dans l'outil afin de produire l'artefact
exploitable et la preuve pour la pratique P7.

L'outil retenu est **OWASP Threat Dragon**, cité dans le tableau 8 de
Prates et Pereira (6 mentions). Ce choix est donc justifiable par la source
scientifique du module, ce qui compte pour le rapport.

## Documents à lire d'abord

| Fichier | Ce qu'il contient |
|---|---|
| `docs/threat-model/01-architecture.md` | Les composants, les 4 frontières de confiance, les 9 flux de données |
| `docs/threat-model/03-threat-model.md` | **Les 57 menaces**, avec catégorie STRIDE, atténuation et exigence ASVS |
| `docs/threat-model/04-risk-assessment.md` | La cotation de chaque menace (vraisemblance, impact, score) |

## Travail à réaliser

### 1. Installer l'outil

Deux possibilités :
- Version web : [threatdragon.github.io](https://www.threatdragon.com/) —
  aucune installation
- Application de bureau : disponible sur la page du projet OWASP

### 2. Créer le modèle

Métadonnées :

| Champ | Valeur |
|---|---|
| Titre | Place de marché vintage — Projet 3 IRISI 3 |
| Propriétaire | Équipe Projet 3 |
| Description | Modèle de menaces STRIDE de l'application web. Phase 1. |

### 3. Dessiner le diagramme de flux de données

Reproduire le diagramme de la section 2 de `01-architecture.md`.

Éléments à placer :

| Type Threat Dragon | Éléments |
|---|---|
| **Actor** | Utilisateur (navigateur), Acteur malveillant |
| **Process** | API REST, Intergiciel d'autorisation, Limitation de débit |
| **Store** | PostgreSQL, Stockage d'objets, Collecteur de journaux |
| **Actor** (externe) | Google Gemini |
| **Trust boundary** | TB1 Client↔API, TB2 API↔Données, TB3 API↔Gemini |
| **Data flow** | les 9 flux DF1 à DF9 du tableau « Inventaire des flux » |

> Le client mobile peut être ajouté en élément, annoté « phase 2 — différé ».
> Cela montre que l'architecture l'a prévu.

### 4. Saisir les menaces

Pour **chacune des 57 menaces** de `03-threat-model.md`, créer une menace
attachée à l'élément ou au flux concerné, avec :

| Champ Threat Dragon | Source |
|---|---|
| Title | l'identifiant et le libellé, ex. « T14 — Un vendeur modifie l'annonce d'un autre (IDOR) » |
| Type | la catégorie STRIDE de la colonne « STRIDE » |
| Status | `Open` si non encore implémenté, `Mitigated` quand le contrôle sera en place |
| Severity | `High` si score ≥ 9, `Medium` si 6–8, `Low` sinon (voir `04-risk-assessment.md`) |
| Description | le libellé de la menace |
| Mitigation | la colonne « Atténuation », **en citant l'exigence ASVS** |

> **Important :** reporter l'exigence ASVS dans le champ Mitigation. C'est ce
> qui relie le modèle de menaces aux tests de la phase 3 et aux preuves du
> rapport. Un modèle sans cette traçabilité perd l'essentiel de sa valeur.

### 5. Exporter

| Fichier | Emplacement |
|---|---|
| Modèle JSON | `docs/threat-model/threat-dragon-model.json` |
| Diagramme PNG | `rapport/figures/threat-model-dfd.png` |
| Rapport HTML ou PDF généré par l'outil | `evidence/P7-threat-modelling/` |

### 6. Ouvrir une *pull request*

- Branche : `feat/threat-dragon-model`
- Remplir le modèle de *pull request*, y compris la liste de contrôle sécurité
  (répondre « N/A — saisie de modèle, aucun code » là où c'est pertinent)
- Demander la revue de `@edothecreator`

---

## Critères d'acceptation

- [ ] Le fichier JSON s'ouvre correctement dans Threat Dragon
- [ ] Les 9 flux de données figurent au diagramme
- [ ] Les 3 frontières de confiance sont tracées
- [ ] **Les 57 menaces sont saisies**, aucune omission
- [ ] Chaque menace porte sa catégorie STRIDE correcte
- [ ] Chaque menace porte sa sévérité conforme à `04-risk-assessment.md`
- [ ] Chaque champ Mitigation cite l'exigence ASVS correspondante
- [ ] PNG exporté et déposé dans `rapport/figures/`
- [ ] Rapport de l'outil déposé dans `evidence/P7-threat-modelling/`
- [ ] *Pull request* ouverte avec la liste de contrôle remplie

## Pourquoi cette tâche compte

P7 Threat modelling est une pratique de **niveau Tier 1** (40 mentions), donc
obligatoire. Elle appartient à la phase *Plan* du cycle de vie : elle doit être
produite **avant** l'implémentation, et la chronologie des commits en fait foi.

La *pull request* correspondante constitue par ailleurs une preuve pour les
pratiques **P9** Collaboration et **P11** Code review, puisqu'elle sera revue
par un autre membre de l'équipe.
