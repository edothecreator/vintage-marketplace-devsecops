# Preuves — P6 Continuous integration (Tier 1)

La pipeline d'intégration continue existe et réussit **avant** tout code
applicatif, de sorte que chaque contribution ultérieure soit contrôlée dès le
premier envoi.

## Artefacts

| Fichier | Ce qu'il prouve |
|---|---|
| `01-first-pipeline-run.png` | Exécution de la pipeline sur `main` : les trois tâches aboutissent (`Secret scan`, `Repository hygiene`, `Build and test`) |

> Fichier correspondant : `rapport/figures/p06-pipeline-run.png`.

## Ce que l'exécution démontre en outre

La tâche `Build and test` réussit sur un projet encore dépourvu de code
applicatif : elle détecte l'absence de `backend/package.json` et ignore les
étapes Node.js. Cela valide la logique conditionnelle décrite dans
`.github/workflows/ci.yml`, dont l'objet est de fournir à la protection de
branche un nom de contrôle stable dès la phase 0.

## Définition de la pipeline

`.github/workflows/ci.yml` — trois tâches, permissions de moindre privilège
(`contents: read`), contrôle de concurrence annulant les exécutions superseded
hors `main`.

## Vérification indépendante

```bash
gh run list --repo edothecreator/vintage-marketplace-devsecops
```

## Preuves à venir

Les relevés de durée d'exécution (analyse de performance de la phase 10) seront
déposés ici au fur et à mesure de l'ajout des étages de sécurité.

## Lien avec le rapport

Chapitre « Phase 0 », section P6.
