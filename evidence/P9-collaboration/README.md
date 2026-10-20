# Preuves — P9 Collaboration (Tier 1)

La collaboration est rendue **structurelle** par l'attribution de la propriété
du code et par l'exigence de revue croisée, et non laissée à la bonne volonté.

## Artefacts

| Fichier | Ce qu'il prouve |
|---|---|
| `01-collaborators.png` | Les quatre membres de l'équipe disposent d'un accès en écriture au dépôt, avec le statut **Collaborator** (invitations acceptées, non en attente) |

> Fichier correspondant : `rapport/figures/p09-collaborators.png`.

## Équipe

| Utilisateur | Membre | Domaine (CODEOWNERS) |
|---|---|---|
| `@edothecreator` | Mohamed ELKHANFAF | Pipeline et sécurité |
| `@erraguibiabdelilah` | Abdelilah ERRAGUIBI | Back-end et API |
| `@Hanane-ELFADIL` | Hanane ELFADIL | Front-end et tests d'abus |
| `@anasIRISI` | Anas HALLOUMI | Infrastructure, supervision, documentation |

## Attribution de la propriété du code

Le fichier `.github/CODEOWNERS` associe chaque chemin à un ou plusieurs
propriétaires. Combiné à l'option « Require review from Code Owners » de la
protection de branche (voir P11), il impose qu'une modification soit revue par
une personne autre que son auteur.

## Vérification indépendante

Le fichier CODEOWNERS ne comporte aucune erreur — les quatre identifiants
existent et disposent d'un accès en écriture :

```bash
gh api repos/edothecreator/vintage-marketplace-devsecops/codeowners/errors
# -> { "errors": [] }
```

> Point de méthode : GitHub **ignore silencieusement** tout propriétaire de code
> inexistant ou non collaborateur. Un fichier CODEOWNERS peut donc sembler
> fonctionnel sans rien imposer. L'absence d'erreur ci-dessus atteste que le
> contrôle est réellement actif.

## Preuves à venir

Les fils de discussion de *pull request* montrant une revue croisée effective
(par exemple la *pull request* de la tâche T01 — saisie du modèle de menaces)
viendront compléter ce dossier au fil du projet.

## Lien avec le rapport

Chapitre « Phase 0 », section P9.
