# ADR 0002 — Use GitHub Actions as the CI/CD platform

**Status:** Accepted
**Date:** Phase 0

## Context

The project requires a CI/CD pipeline that implements the Tier 1 practices
**P6 Continuous integration** and **P10 Continuous deployment**, and hosts the
automated security stages (P1 SAST, P2 DAST, P3 automated security testing,
P4 vulnerability scanning) plus Tier 2 additions.

Prates & Pereira list five CI tools found in the literature — Jenkins (15
mentions), GitLab CI (8), GitHub Actions (6), Travis CI (3) and Circle CI (2) —
so several options are citable to the source paper.

Constraints specific to this project:

- The repository is hosted on GitHub and collaborators are already configured
  there.
- No budget. Everything must work on free tiers.
- No persistent infrastructure to maintain; the team's time belongs to security
  work, not to running a build server.

## Decision

**GitHub Actions**, with workflow definitions in `.github/workflows/`.

## Consequences

**Positive**
- Native to where the code and the collaborators already live. Pull request
  checks, branch protection and required status checks integrate directly,
  which is what makes P11 Code review enforceable rather than advisory.
- Zero infrastructure to maintain.
- Dependabot is available for free, which contributes Tier 2 **P27 Patch
  management** at almost no cost.
- Cited in the source paper's tool table, so the choice is defensible.

**Negative**
- Vendor lock-in: workflow syntax is not portable. Accepted — this is coursework
  with no migration horizon.
- **Minute quota.** Private repositories get a free monthly allowance; public
  repositories are unmetered. ZAP and SonarQube are the expensive stages. If the
  quota becomes a constraint the mitigation is to move the full DAST scan and
  deep SCA analysis to a nightly schedule and keep only fast checks on pull
  requests — which is the recommended design regardless, for pipeline
  performance reasons (see the performance analysis in Phase 10).
- GitHub's own secret-scanning push protection can interfere with the Phase 9
  V2 demonstration, which deliberately commits a fake key. Noted in
  `PROGRESS.md`; the repository visibility decision accounts for it.

## Alternatives considered

**Jenkins** — most-cited CI tool in the paper (15 mentions). Rejected: requires
hosting, maintaining and securing a server. That is a project in itself and
would consume time budgeted for security engineering. Its plugin surface is also
a security liability we would then have to justify.

**GitLab CI** — second most-cited (8 mentions), with strong built-in security
scanning. Rejected: the repository and collaborators are on GitHub, and the most
attractive security features (SAST/DAST/dependency scanning dashboards) sit in
paid tiers. We would end up re-implementing them with the same open-source tools
we are using anyway, having moved platform for nothing.

**Travis CI / Circle CI** — fewer mentions, and neither offers an advantage over
Actions for a GitHub-hosted repository.
