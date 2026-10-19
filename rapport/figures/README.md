# Figures — captures d'écran à fournir

Les emplacements manquants apparaissent dans le PDF compilé sous forme
d'**encadrés rouges bien visibles** indiquant le nom de fichier attendu.

## Procédure

1. Prendre la capture
2. L'enregistrer dans ce dossier sous **le nom exact** indiqué
3. Dans le fichier `.tex` concerné, remplacer
   `\captureaplacer{figures/nom.png}{description}`
   par
   `\captureprete{figures/nom.png}{Légende de la figure}`

---

## Liste des captures attendues

### Phase 0 — déjà fournie

| Fichier | État | Contenu |
|---|---|---|
| `p06-pipeline-run.png` | **À DÉPOSER** | Exécution de la pipeline, 3 tâches vertes. Capture déjà prise, reste à enregistrer sous ce nom. |

### Phase 0 — manquantes

| Fichier | Contenu | Où |
|---|---|---|
| `p11-branch-protection-reviews.png` | Exigence de PR, 1 revue approbatrice, invalidation des revues obsolètes, revue des Code Owners, approbation du dernier envoi | Settings → Branches → Edit (règle `main`) |
| `p11-branch-protection-status-checks.png` | Les 3 contrôles d'état requis, exigence de branche à jour, envois forcés et suppressions interdits | Même page, plus bas |
| `p09-collaborators.png` | Les 4 membres avec accès en écriture — **attendre l'acceptation des invitations** | Settings → Collaborators |

> La première tentative de capture de la protection de branche a été écartée :
> elle montrait seulement une infobulle indiquant que la branche est protégée,
> sans montrer **quelles** protections sont actives. Or c'est précisément le
> contenu des réglages qui constitue la preuve de la pratique P11.

### Diagrammes à produire (phase 1 et phase 5)

| Fichier | Contenu | Quand |
|---|---|---|
| `architecture-composants.png` | Diagramme de composants : front-end, mobile (phase 2), API, base, stockage, LLM en frontière de confiance | Phase 1 |
| `architecture-pipeline.png` | Schéma de la pipeline : étages, déclencheurs, points de blocage, superposés aux phases du cycle | Phase 5 |

### Phases ultérieures

Les captures des phases 1 à 10 seront ajoutées à cette liste à mesure que les
chapitres correspondants seront rédigés. Elles proviendront pour l'essentiel du
dossier `evidence/` à la racine du dépôt, qui est la source de vérité des
preuves.

---

## Format recommandé

- **PNG** pour les captures d'interface (texte net)
- Largeur utile ≥ 1200 px pour rester lisible à l'impression
- Pas de recadrage destructif : garder visible le contexte (URL, nom de branche,
  identifiant d'exécution) qui rattache la capture à un fait vérifiable
- **Vérifier l'absence de secret, de jeton ou de cookie de session** avant de
  déposer une image dans un dépôt public
