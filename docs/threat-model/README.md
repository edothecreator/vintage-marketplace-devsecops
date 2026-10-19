# Modélisation des menaces — index

Livrables de la **phase 1**. Aucun code applicatif n'est écrit dans cette phase.

| Document | Contenu | Pratique |
|---|---|---|
| `01-architecture.md` | Composants, frontières de confiance, flux de données, acteurs, modèle de données | P7, P24 |
| `02-data-classification.md` | Classification des données et exigences de protection par niveau | P24, P23 |
| `03-threat-model.md` | **57 menaces STRIDE** tracées vers les exigences ASVS | **P7** |
| `04-risk-assessment.md` | Cotation vraisemblance × impact, ordre de construction | **P23** |

Décisions associées :

| Registre | Objet |
|---|---|
| `../adr/0005-asvs-target-level.md` | Niveau ASVS visé, chapitres retenus, exclusions justifiées |
| `../adr/0006-documented-security-decisions.md` | Décisions de sécurité documentées exigées par l'ASVS |
| `../adr/0007-ai-augmentation-scope.md` | Périmètre de l'IA, risques LLM, gouvernance du code assisté |

---

## Diagrammes

Les diagrammes sont écrits en **Mermaid**, directement dans
`01-architecture.md`. GitHub les rend nativement : ils sont donc consultables
dans le dépôt sans outil supplémentaire.

Pour le rapport LaTeX, ils doivent être exportés en PNG :

1. Ouvrir [mermaid.live](https://mermaid.live)
2. Coller le bloc Mermaid depuis `01-architecture.md`
3. Exporter en PNG
4. Enregistrer dans `rapport/figures/` sous le nom attendu
   (voir `rapport/figures/README.md`)

---

## OWASP Threat Dragon

L'outil retenu pour la pratique P7 est **OWASP Threat Dragon**, cité dans le
tableau 8 de Prates et Pereira (6 mentions), ce qui rend ce choix rattachable à
la source scientifique du module.

> **État : à produire.** Le modèle Threat Dragon n'a volontairement **pas** été
> généré automatiquement. Le format de fichier de l'outil encode la géométrie
> du diagramme, et un fichier produit sans validation dans l'outil risque de ne
> pas s'ouvrir — ce qui serait plus gênant qu'utile.
>
> La substance du modèle de menaces est déjà intégralement rédigée dans
> `03-threat-model.md`. La construction du diagramme dans l'outil est une
> tâche de saisie, confiée à un membre de l'équipe : voir
> `../../tasks/T01-threat-dragon-model.md`.

---

## Chiffres clés

| Indicateur | Valeur |
|---|---|
| Flux de données modélisés | 9 + 1 groupe transverse |
| Frontières de confiance | 4 |
| Menaces identifiées | **57** |
| dont risque critique (score ≥ 9) | 8 |
| dont risque élevé (score 6–8) | 18 |
| Menaces tracées vers une exigence ASVS | 57 / 57 |
| Menaces alimentant une démonstration de phase 9 | 7 |
| Risques explicitement acceptés | 4 |
