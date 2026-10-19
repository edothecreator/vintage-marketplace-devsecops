# Rapport technique — LaTeX

Rapport du Projet 3 (module *Sécurité des applications et des services*,
IRISI 3, FST Marrakech).

Rédigé **en parallèle du projet**, et non à la fin : chaque phase terminée est
documentée immédiatement, pendant que les décisions et les détails sont encore
frais.

---

## Compilation

### Overleaf (recommandé — aucune installation requise)

1. Compresser le dossier `rapport/` en `.zip`
2. Sur [overleaf.com](https://www.overleaf.com) : *New Project* → *Upload Project*
3. Vérifier que le document principal est `main.tex`
4. Compilateur : **pdfLaTeX** (Menu → Compiler → pdfLaTeX)
5. Compiler deux fois pour que la table des matières et les références se résolvent

### Local (si une distribution LaTeX est installée)

```bash
cd rapport
latexmk -pdf main.tex      # gère les passes multiples automatiquement
```

ou manuellement :

```bash
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

> Aucune distribution LaTeX n'est installée sur la machine de développement.
> Le document n'a donc **pas** été compilé localement. En cas d'erreur à la
> première compilation, voir la section « Dépannage » ci-dessous.

---

## Structure

```
rapport/
  main.tex                 document principal, inclut tous les chapitres
  preambule.tex            paquets, mise en page, commandes personnalisées
  bibliographie.bib        références (Prates & Pereira, OWASP, NIST...)
  chapitres/
    01-introduction.tex            REDIGE
    02-fondements.tex              REDIGE
    03-architecture-application.tex PARTIEL (conception)
    04-architecture-pipeline.tex   PARTIEL (conception)
    05-phase0-fondations.tex       REDIGE
    06-modelisation-menaces.tex    A VENIR (phase 01)
    07-developpement-securise.tex  A VENIR (phase 02)
    08-tests-securite.tex          A VENIR (phase 03)
    09-stages-pipeline.tex         A VENIR (phase 05)
    10-conteneurisation.tex        A VENIR (phase 06)
    11-supervision.tex             A VENIR (phase 07)
    12-ia.tex                      A VENIR (phase 08)
    13-vulnerabilites.tex          A VENIR (phase 09)
    14-performance.tex             A VENIR (phase 10)
    15-limites-perspectives.tex    A VENIR
    16-conclusion.tex              A VENIR
  figures/
    README.md              LISTE DES CAPTURES A FOURNIR
```

---

## Captures d'écran à ajouter

Les emplacements de captures manquantes apparaissent dans le PDF compilé sous
forme d'**encadrés visibles** indiquant le nom de fichier attendu, par exemple :

```
+----------------------------------------------+
|  CAPTURE A AJOUTER                           |
|  fichier : figures/p11-branch-protection.png |
|  contenu : page des regles de protection ... |
+----------------------------------------------+
```

Procédure :

1. Prendre la capture
2. L'enregistrer dans `figures/` sous le nom exact indiqué
3. Remplacer `\captureaplacer{...}{...}` par `\captureprete{...}{...}`
   dans le fichier `.tex` concerné

La liste complète est maintenue dans `figures/README.md`.

---

## Conventions de rédaction

| Élément | Commande | Rendu |
|---|---|---|
| Pratique DevSecOps | `\pratique{P1}{SAST}` | **P1 — SAST** |
| Exigence ASVS | `\asvs{8.2.2}` | ASVS v5.0.0-8.2.2 |
| Risque OWASP LLM | `\llm{01}` | LLM01 |
| Capture manquante | `\captureaplacer{fichier}{description}` | encadré visible |
| Capture fournie | `\captureprete{fichier}{légende}` | figure normale |
| Encadré « décision » | `\begin{decision}...\end{decision}` | bloc encadré |
| Encadré « constat » | `\begin{constat}...\end{constat}` | bloc encadré |

---

## Dépannage

**`! LaTeX Error: File 'xxx.sty' not found`**
Sur Overleaf, tous les paquets utilisés sont disponibles. En local avec MiKTeX,
autoriser l'installation automatique des paquets manquants.

**Table des matières vide ou références `??`**
Compiler deux fois (trois si la bibliographie a changé).

**Problèmes d'accents**
Le document utilise `inputenc` UTF-8. Vérifier que les fichiers `.tex` sont
bien enregistrés en UTF-8 (c'est le cas par défaut).

**Avertissements `Overfull \hbox`**
Non bloquants. Ils signalent des lignes légèrement trop longues, généralement
dans les tableaux ou les URL.
