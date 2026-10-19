# ADR 0004 — Public repository visibility

**Status:** Accepted
**Date:** Phase 0

## Context

The repository was initially created **private**, which is the instinctively
safer default for coursework.

During Phase 0 we attempted to enable branch protection on `main`, which is the
enforcement mechanism behind two Tier 1 practices:

- **P11 Code review** (33 mentions) — without it, review is advisory
- **P9 Collaboration** (36 mentions) — `CODEOWNERS` is only honoured when
  "require code owner review" can be switched on

Both the classic branch protection API and the newer repository rulesets API
returned:

```
HTTP 403 — Upgrade to GitHub Pro or make this repository public
            to enable this feature.
```

GitHub Free does not permit protected branches or rulesets on private
repositories. This left three options:

1. Make the repository public.
2. Obtain GitHub Pro free via the GitHub Student Developer Pack.
3. Remain private with no branch protection.

Option 3 was rejected outright: it would reduce the evidence for two Tier 1
practices from "merges are technically blocked" to "we wrote a template", which
does not demonstrate an implemented control.

## Decision

Make the repository **public**.

The Student Developer Pack application (option 2) is pursued in parallel. If
Pro is granted, visibility may be reconsidered — but there is no need to change
back, as public brings an independent benefit (below).

## Consequences

**Positive**
- Branch protection and rulesets become available, so P9 and P11 are enforced
  by the platform rather than by convention.
- **GitHub Actions minutes are unmetered on public repositories.** This is a
  material benefit, not a side effect: ZAP full scans and SonarQube analysis are
  the most expensive stages, and Phase 9 alone triggers seven full pipeline runs
  across seven demonstration branches. On a private repository the free
  allowance is 2,000 minutes per month, which would have forced us to ration
  scans for reasons unrelated to security engineering.
- The evaluator can inspect the repository, its pipeline runs and its evidence
  without being added as a collaborator.

**Negative**
- Source code and pipeline configuration are world-readable. Accepted: this is
  coursework with no proprietary content, and the security of the design must
  not depend on the source being secret.
- **No real secret may ever enter the repository.** This was already policy
  (`SECURITY.md`), enforced by pre-commit hooks and a full-history Gitleaks scan
  in CI. Public visibility raises the cost of a mistake from "rotate a key" to
  "rotate a key that strangers may have already scraped", so the control matters
  more, but the control itself is unchanged.
- **GitHub secret-scanning push protection is active on public repositories.**
  This interacts with the Phase 9 V2 demonstration — see below.

## Impact on the Phase 9 V2 demonstration

Demonstration V2 deliberately commits a hardcoded secret so that Gitleaks
detects it and fails the build, producing the required
*Detection → Result → Corrective action* chain.

On a public repository GitHub's own push protection scans for
**provider-specific** secret patterns and can reject the push outright — which
would pre-empt our own control and break the demonstration.

**Mitigation.** V2 uses a secret pattern that our Gitleaks configuration detects
but GitHub's partner-pattern scanner does not:

| Pattern | Caught by our Gitleaks rule | Recognised by GitHub push protection |
|---|---|---|
| Google API key `AIza...` | `gemini-api-key` | **Yes** — would be blocked |
| `jwtSecret: "..."` assignment | `generic-jwt-secret-assignment` | No |
| `postgresql://user:pass@host` | `hardcoded-db-url` | No |

V2 therefore plants a **hardcoded JWT signing secret** rather than a Google API
key. Both rules were verified during Phase 0 against a planted test file: each
fired correctly with the secret redacted in the output.

This is a more honest demonstration in any case — a hardcoded signing secret is
a realistic developer mistake, and detecting it depends on *our* configuration
rather than on a third party's pattern list.

## Alternatives considered

**GitHub Student Developer Pack for free Pro.** Not rejected — being pursued in
parallel. Not chosen as the blocking path because verification can take from
hours to several days, and Phase 0 should not stall on an external approval
queue.

**Paying for GitHub Pro.** Rejected: no budget, and public visibility solves the
problem at zero cost while adding unmetered CI minutes.

**Remaining private without protection.** Rejected, as set out in Context.
