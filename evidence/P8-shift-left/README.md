# Preuves — P8 Shift left security (Tier 1)

Le contrôle le plus précoce possible : sur le poste du développeur, avant même
la création du commit. Un secret bloqué ici n'entre jamais dans l'historique
Git.

## Configuration

| Fichier | Rôle |
|---|---|
| `.pre-commit-config.yaml` | Crochets locaux : Gitleaks + hygiène de fichiers |
| `.gitleaks.toml` | Règles de détection de secrets propres au projet |

## Vérifications effectuées en phase 0

Les règles de détection ne sont pas supposées fonctionner : elles ont été
testées contre des secrets synthétiques fabriqués pour l'occasion.

| Format testé | Règle | Résultat |
|---|---|---|
| `AIza...` (clé Google historique) | `gemini-api-key` | détecté |
| `AQ....` (clé AI Studio récente) | `gemini-api-key-v2` | détecté |
| `GOCSPX-...` (secret OAuth Google) | `google-oauth-client-secret` | détecté |
| `jwtSecret: "..."` | `generic-jwt-secret-assignment` | détecté |

> **Constat important à verser au rapport.** La règle `gemini-api-key-v2` a été
> ajoutée *après coup* : la règle initiale ne couvrait que le format historique
> `AIza`, et ne détectait donc pas une clé réelle au format `AQ.`. Sur un dépôt
> public, une clé de cette forme aurait franchi le contrôle silencieusement.
> C'est une illustration concrète de la limite des contrôles par signature :
> une règle écrite d'après un format documenté peut manquer un format que le
> fournisseur a entre-temps modifié. Cela justifie la position de l'ASVS selon
> laquelle exécuter un outil ne vaut pas vérifier une exigence.

## Artefacts à capturer

| Fichier | Contenu attendu |
|---|---|
| `01-hook-blocks-secret.png` *(à fournir)* | Sortie terminal d'un commit bloqué par le crochet Gitleaks |

Pour produire cette capture (après rotation de la clé Gemini) :

```bash
# creer un fichier contenant une fausse valeur au format AQ.
# tenter un commit : le crochet pre-commit doit le bloquer
git add . && git commit -m "test"
# capturer la sortie, puis supprimer le fichier de test
```

## Lien avec le rapport

Chapitre « Phase 0 », section P8 (et section « Difficultés rencontrées » pour
le constat sur le format de clé).
