# Project Progress

> **This file is the authoritative current state of the project.**
> If context is lost, read this first. Updated at the end of every phase.

**Last updated:** Phase 0 in progress

---

## Confirmed decisions

| Decision | Choice | Recorded in |
|---|---|---|
| Ecosystem | JavaScript — Express.js + TypeScript | Subject assignment (Projet 3) |
| CI/CD platform | **GitHub Actions** | `docs/adr/0002` |
| Application domain | Vintage marketplace (unique second-hand items) | `docs/web-app-attack-plan.txt` §2 |
| Practice taxonomy | Prates & Pereira (2025), Tier 1 + selected Tier 2 | `docs/tier1-tier2-practices.txt` |
| ASVS target level | Full L1 + targeted L2 (V2, V4, V5, V6, V8, V13, V16) | `docs/adr/0004` *(pending)* |
| LLM provider | Google Gemini, free tier (Flash-Lite) | `docs/adr/0005` *(pending)* |
| Mobile application | **Deferred** to a second phase, after web is complete | `docs/web-app-attack-plan.txt` §11 |
| Repository strategy | Fresh repository (not a reset of the old one) | this file |

## Open decisions

| Decision | Options | Blocking |
|---|---|---|
| Repository visibility | Private (clean secret demo) vs Public (unlimited Actions minutes) | Repo creation |
| Repository name | Proposed: `vintage-marketplace-devsecops` | Repo creation |
| Team task split | 4 members — see `docs/web-app-attack-plan.txt` §13 | Task brief authoring |

---

## Phase status

| # | Phase | Status | Practices |
|---|---|---|---|
| 0 | Foundations & repository governance | **IN PROGRESS** | P6 P9 P11 P15 P8 |
| 1 | Design, threat model, ASVS scoping | not started | P7 P23 P24 |
| 2 | Backend & REST API | not started | P20 |
| 3 | Automated security test suite | not started | P3 |
| 4 | Web front-end | not started | P20 |
| 5 | Pipeline security stages | not started | P1 P2 P4 P13 P30 P17 |
| 6 | Containerisation & deployment | not started | P10 P12 P22 |
| 7 | Monitoring, logging, incident response | not started | P5 P18 P28 |
| 8 | AI augmentation (app + pipeline) | not started | LLM Top 10 |
| 9 | Deliberate vulnerability demonstrations | not started | evidence for all |
| 10 | Penetration test & performance analysis | not started | P16 |
| 11 | Report, documentation, defence | not started | P14 P31 |

---

## Phase 0 — detailed checklist

### Done
- [x] Local git repository initialised (`main` branch)
- [x] Folder structure created (`backend/`, `frontend/`, `docs/`, `evidence/`, `tasks/`, `.github/`)
- [x] `.gitignore` — Node, secrets, Docker, Terraform, tooling caches
- [x] `README.md`
- [x] `PROGRESS.md` (this file)

- [x] `SECURITY.md` — security policy, pipeline gates, incident response
- [x] `.gitleaks.toml` — secret scanning, custom Gemini/JWT/DB-URL rules
- [x] `.pre-commit-config.yaml` — pre-commit hooks (P8 shift-left)
- [x] `.github/workflows/ci.yml` — CI skeleton (P6), passes on empty project
- [x] `.github/pull_request_template.md` — security checklist in every PR (P11)
- [x] ADR 0001 — record architecture decisions
- [x] ADR 0002 — GitHub Actions as CI platform
- [x] ADR 0003 — pre-commit framework for shift-left hooks
- [x] `evidence/README.md` — evidence capture conventions
- [x] `.editorconfig`
- [x] **Verified locally:** all pre-commit hooks pass on a clean tree
- [x] **Verified locally:** Gitleaks detects a planted Gemini API key and a
      hardcoded JWT secret — pre-validates the Phase 9 V2 demonstration
- [x] Initial commit `03a404d` (hooks executed automatically on commit)

### In progress
- [ ] `CODEOWNERS` — written, but contains **placeholder usernames**.
      Must be replaced before enabling "Require review from Code Owners",
      otherwise GitHub silently ignores the file and the control is fake.
      Verify with: `gh api repos/<owner>/<repo>/codeowners/errors`

### Blocked on Mohamed
- [ ] `gh auth login` — authenticate GitHub CLI
- [ ] Decide repository visibility (private recommended)
- [ ] Confirm repository name
- [ ] Provide 3 collaborator GitHub usernames
- [ ] Create repository and push
- [ ] Enable branch protection on `main`:
      require PR, require status checks, require 1 approving review,
      no direct pushes, no force pushes
- [ ] **Screenshot branch protection settings** → `evidence/P11-code-review/`
- [ ] Obtain Gemini API key, record actual rate limits

---

## Evidence captured so far

| Practice | Artefact | Location |
|---|---|---|
| — | none yet | — |

---

## Notes and gotchas

- **GitHub push protection vs Phase 9 (V2 secret demo).** On public repositories
  GitHub may block a push containing a recognised secret pattern, which would
  pre-empt the Gitleaks demo. Private repository avoids this. If public is chosen,
  the V2 demo must use a pattern Gitleaks detects but GitHub's scanner does not.
- **Branch protection vs initial push.** Protection must be enabled *after* the
  first push, otherwise the initial commit is rejected.
- **Gemini free tier quotas are per project, not per API key**, and reset at
  midnight Pacific. Flash-Lite has the highest daily allowance. Verify actual
  limits in AI Studio — published figures changed several times during 2025–26.
- **Commit chronology is evidence.** The threat model must be committed before
  implementation commits. Do not back-date or reorder.
