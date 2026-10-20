# ADR 0007 — Périmètre de l'augmentation par intelligence artificielle

**Status:** Accepted
**Date:** Phase 1

## Context

L'intitulé du sujet est « pipeline DevSecOps **augmentée par IA** ». Sans
composante IA, le projet livrerait une pipeline DevSecOps conventionnelle, hors
sujet sur ce point précis.

Par ailleurs, la section 5.d du sujet impose que, lorsque le projet utilise des
fonctionnalités fondées sur l'IA ou un LLM, les risques associés soient pris en
compte à partir du Top 10 OWASP pour les applications LLM.

Deux décisions sont donc nécessaires : *où* placer l'IA, et *quels risques* cela
introduit.

Une troisième contrainte existe : aucun budget. Le fournisseur doit être
utilisable gratuitement.

## Decision

### Deux intégrations distinctes, pour deux motifs distincts

**1. Dans l'application — générateur de description d'annonce.**

Un vendeur saisit le titre, la catégorie et l'état de l'objet ; le modèle
propose une description qu'il peut éditer avant publication.

*Motif :* cette fonctionnalité fait entrer le Top 10 OWASP pour les
applications LLM dans le périmètre, ce que le sujet exige. Elle est par ailleurs
plausible pour une place de marché d'objets d'occasion, où la rédaction d'une
description est la principale friction à la mise en vente.

**2. Dans la pipeline — triage assisté par IA des résultats de sécurité.**

Un script consomme les rapports produits par les étages de sécurité (SARIF du
SAST, JSON de ZAP, de Trivy et de Dependency-Check) et sollicite le modèle pour
expliquer chaque résultat en langage clair, signaler les faux positifs
probables, proposer une remédiation et dédupliquer les résultats que plusieurs
outils rapportent. La synthèse est publiée en commentaire de *pull request*.

*Motif :* c'est littéralement l'objet du sujet. C'est aussi l'artefact le plus
distinctif du projet.

### Fournisseur

**Google Gemini, offre gratuite**, modèle `gemini-2.5-flash-lite`.

| Critère | Valeur observée |
|---|---|
| Coût | Nul, aucune carte bancaire requise |
| Modèle retenu | `gemini-2.5-flash-lite` — allocation quotidienne la plus élevée de l'offre gratuite |
| Quota | Compté **par projet** et non par clé ; réinitialisé à minuit heure du Pacifique |

> **Quota confirmé suffisant pour le projet.** L'équipe a vérifié dans la
> console AI Studio que les limites de l'offre gratuite couvrent largement les
> besoins du projet : le plafond applicatif global de 200 appels par jour
> (ADR 0006) est fixé délibérément sous le quota gratuit, et les besoins de
> démonstration et de développement restent bien en deçà. Aucune montée vers
> l'offre payante n'est nécessaire.
>
> Les valeurs de quota publiées ayant évolué à plusieurs reprises durant
> 2025–2026, c'est le quota effectivement observé dans la console qui fait foi.

### Limite de conception non négociable

**L'IA ne décide jamais.**

| L'IA peut | L'IA ne peut pas |
|---|---|
| Proposer une description, éditable par le vendeur | Publier directement |
| Expliquer un résultat de sécurité | Rejeter un résultat |
| Proposer une correction | Appliquer une correction |
| Signaler un faux positif probable | Fusionner une *pull request* |

Le triage est **consultatif**. Il ne conditionne jamais la réussite de la
construction : une panne du fournisseur ou un quota épuisé ne doit pas faire
échouer la pipeline, sans quoi un service tiers gratuit deviendrait une
dépendance de livraison.

## Risques LLM et contrôles associés

| Risque OWASP | Menace | Contrôle |
|---|---|---|
| **LLM01** Injection d'invite | T42 | Invite structurée, séparation système/utilisateur, neutralisation des motifs d'instruction, longueur bornée. Vérifié par test d'abus et par la démonstration V7. |
| **LLM02** Traitement non sûr de la sortie | T43 | Sortie traitée comme entrée non fiable : assainie avant stockage, encodée en restitution, jamais rendue en HTML brut, jamais injectée dans une requête, un shell ou `eval`. |
| **LLM06** Divulgation d'informations sensibles | T44 | Aucun secret, aucune donnée d'un autre utilisateur, aucune donnée personnelle dans l'invite. Invites journalisées sans leur contenu sensible. Le fournisseur est identifié comme frontière de confiance TB3 dans le modèle de menaces. |
| **LLM10** Consommation non bornée | T45 | Limitation par utilisateur (20/jour), plafond global (200/jour) fixé **sous** le quota gratuit, plafond de jetons en sortie, supervision de l'usage, alerte avant épuisement. |

> **LLM10 est ici un risque concret et non théorique.** Le quota gratuit rend
> l'abus de consommation observable et démontrable : c'est l'un des rares
> contextes où ce risque peut être prouvé plutôt que décrit.

### Risques écartés comme non applicables

| Risque | Motif |
|---|---|
| Empoisonnement des données d'entraînement | Modèle tiers préentraîné, non réentraîné par nous |
| Vulnérabilités de la chaîne d'approvisionnement du modèle | Aucun modèle, aucun poids, aucun greffon téléchargé |
| Vol de modèle | Aucun modèle propriétaire |
| Agentivité excessive | Décision de conception ci-dessus : l'IA n'agit jamais de façon autonome |

## Gouvernance du code produit avec assistance IA

La section 7 du sujet autorise et encourage l'usage d'outils d'IA générative,
tout en exigeant que le code produit soit systématiquement vérifié, testé et
sécurisé.

Règles retenues, reprises dans `SECURITY.md` et dans le modèle de *pull
request* :

1. Aucun secret, identifiant, clé privée ni donnée personnelle n'est transmis à
   un outil d'IA.
2. Toute bibliothèque suggérée par un outil d'IA est vérifiée : existence réelle,
   maintenance active, absence de typosquatting.
3. Le code assisté par IA subit **exactement les mêmes** contrôles que le code
   écrit à la main : SAST, SCA, analyse de secrets, DAST, tests d'abus.
4. Chaque membre doit pouvoir expliquer et justifier le fonctionnement du code
   qu'il livre, quelle qu'en soit l'origine. C'est une exigence explicite du
   sujet et une question probable en soutenance.
5. Le modèle de *pull request* comporte une section dédiée, à renseigner
   obligatoirement.

## Consequences

**Positive**
- Le projet traite effectivement son intitulé.
- Le Top 10 OWASP pour les applications LLM entre dans le périmètre avec une
  fonctionnalité réellement utilisée, et non un prétexte.
- Le commentaire de triage sur *pull request* est l'artefact le plus distinctif
  du projet.
- Coût nul.
- Le quota contraint transforme `LLM10` en contrôle démontrable.

**Negative**
- Dépendance à un service tiers dont les quotas et les modèles évoluent
  rapidement. Atténué par le caractère consultatif du triage et par la
  dégradation progressive côté application.
- Une frontière de confiance supplémentaire (TB3) : ce qui est envoyé au
  fournisseur quitte notre contrôle. Traité explicitement dans le modèle de
  menaces.
- Le triage peut se tromper, voire inventer une correction. C'est précisément
  pourquoi il reste consultatif et pourquoi la revue humaine demeure
  obligatoire. Cette limite doit être énoncée franchement dans le rapport
  plutôt que dissimulée : elle constitue une réponse directe à l'exigence du
  sujet de considérer les risques liés à l'usage de modèles LLM.

## Alternatives considered

**Modèle local via Ollama.** Écarté : coût matériel et temps d'exécution en CI
incompatibles avec une pipeline rapide ; qualité moindre sur une tâche de
synthèse de résultats de sécurité. Resterait l'option de repli si le quota
gratuit devenait insuffisant.

**IA uniquement dans la pipeline, sans fonctionnalité applicative.** Écarté :
le Top 10 OWASP pour les applications LLM ne serait alors que partiellement
applicable, alors que le sujet demande explicitement de le prendre en compte.

**IA uniquement dans l'application, sans triage.** Écarté : la pipeline ne
serait pas « augmentée par IA », ce qui est l'objet du sujet.

**Triage IA bloquant la construction.** Écarté fermement. Cela ferait dépendre
la livraison d'un service tiers gratuit et non déterministe, et conférerait à un
modèle un pouvoir de décision que la limite de conception énoncée plus haut lui
refuse explicitement.
