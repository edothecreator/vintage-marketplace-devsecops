# Preuves — P11 Code review (Tier 1)

Cette pratique est **mise en œuvre et appliquée par la plate-forme**, et non
simplement déclarée. La preuve en est la configuration de protection de branche,
que seul un administrateur du dépôt peut consulter : c'est le seul élément qui
atteste qu'un contrôle est effectivement activé.

## Artefacts

| Fichier | Ce qu'il prouve |
|---|---|
| `01-branch-protection-reviews.png` | Sur `main` : *pull request* obligatoire, 1 revue approbatrice requise, invalidation des revues obsolètes à chaque envoi, **revue des Code Owners requise**, approbation du dernier envoi par une autre personne que l'auteur |
| `02-branch-protection-status-checks.png` | 3 contrôles d'état requis en mode strict (`Secret scan`, `Repository hygiene`, `Build and test`), branche devant être à jour, résolution des discussions obligatoire |

> Fichiers correspondants dans le dépôt : `rapport/figures/p11-branch-protection-reviews.png`
> et `rapport/figures/p11-branch-protection-status-checks.png`. Les deux jeux
> d'images sont identiques ; ils sont référencés depuis les deux emplacements
> pour l'auto-suffisance du dossier de preuves comme du rapport.

## Configuration en tant que code

La protection est également versionnée sous forme déclarative dans
`.github/branch-protection.json`, ce qui permet de la reconstituer et de
l'auditer.

## Vérification indépendante

L'état réel de la protection est interrogeable par API :

```bash
gh api repos/edothecreator/vintage-marketplace-devsecops/branches/main/protection
```

## Lien avec le rapport

Chapitre « Phase 0 — Fondations et gouvernance de sécurité », section P11.
