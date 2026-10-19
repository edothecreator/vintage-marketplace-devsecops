# Evidence

This directory holds the proof that each DevSecOps practice is genuinely
implemented, not merely installed.

The project brief is explicit: it is not enough to present a list of tools. Each
mechanism must be demonstrated and justified along the chain

> **Security practice → Tool → Pipeline integration → Detection → Result → Corrective action**

and backed by tool reports, screenshots, pipeline logs and test results.

---

## Why capture evidence as we go

Pipeline run logs expire. Branches get deleted. Dashboards reset. Free-tier
retention is short. Evidence that is not captured at the moment it is produced
usually cannot be recreated later — and reconstructing it under deadline
pressure is exactly when mistakes and gaps appear.

**Capturing evidence is part of the definition of done for every task**, not a
task for the final week.

---

## Directory layout

One directory per Tier 1 practice, plus a shared directory for Tier 2.

```
evidence/
  P1-sast/                            SAST reports, failing builds, fixes
  P2-dast/                            ZAP reports before/after
  P3-automated-security-testing/      abuse-case test output
  P4-vulnerability-scanning/          dependency + container CVE reports
  P5-continuous-monitoring/           dashboards, triggered alerts
  P6-continuous-integration/          pipeline configs, run history, timings
  P7-threat-modelling/                threat model exports, diagrams
  P8-shift-left/                      blocked commits, hook output
  P9-collaboration/                   PR discussions, CODEOWNERS enforcement
  P10-continuous-deployment/          deployment logs, rollback demo
  P11-code-review/                    branch protection, PR approvals
  tier2/                              one subdirectory per Tier 2 practice
```

## Naming convention

```
<NN>-<short-description>.<ext>
```

Numbered so the sequence of a demonstration is self-evident. Example for the
Phase 9 V1 demonstration (SQL injection caught by SAST):

```
evidence/P1-sast/
  01-injected-commit-diff.png
  02-pipeline-run-failed.png
  03-sonarqube-finding.png
  04-sonarqube-report.json
  05-fix-commit-diff.png
  06-pipeline-run-passed.png
  README.md
```

Every practice directory carries a short `README.md` stating what the artefacts
show and which report section they support. A folder of unexplained screenshots
is not evidence.

## What counts as evidence

| Type | Good | Not good enough |
|---|---|---|
| Tool output | Saved report file (SARIF, JSON, HTML) | A screenshot of a summary count |
| Pipeline | Full run log plus the failing step | "the build went red" |
| Fix | Commit diff showing before and after | "we fixed it" |
| Process practice | Branch protection settings, PR thread, signed-off checklist | A claim in the report |
| Test | Test runner output naming the ASVS requirement | Passing test count only |

## Process practices need a different kind of proof

Four Tier 1 practices are not tool-driven: **P7 Threat modelling**,
**P8 Shift left security**, **P9 Collaboration** and **P11 Code review**.

For these, the evidence is the artefact or the configuration itself:

- P7 — the threat model file, its diagrams, and mitigations traced to ASVS IDs
- P8 — pre-commit configuration plus a terminal capture of a commit being blocked
- P9 — `CODEOWNERS`, plus pull request threads where findings were triaged jointly
- P11 — branch protection settings screenshot, plus PR approvals on real changes

**Screenshots of GitHub settings must be taken by a repository administrator.**
They cannot be generated from the command line and are the only proof that the
control is actually switched on.

## Redaction

Before committing any artefact, check it for:

- real API keys, tokens or credentials (including in URLs and request headers)
- session cookies in captured HTTP traffic
- personal data

Gitleaks runs over `evidence/` paths in CI with a narrower allowlist than the
rest of the repository. Redact in the image or file itself — not by cropping,
which often leaves the data recoverable in the original.
