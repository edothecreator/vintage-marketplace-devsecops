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

## Repository

- **URL:** https://github.com/edothecreator/vintage-marketplace-devsecops
- **Visibility:** public — see `docs/adr/0004` for why (branch protection and
  unmetered Actions minutes are unavailable on free private repositories)
- **Owner:** `@edothecreator` — Mohamed ELKHANFAF
- **Collaborators (push):** `@erraguibiabdelilah`, `@Hanane-ELFADIL`, `@anasIRISI`

## Open decisions

| Decision | Options | Blocking |
|---|---|---|
| Enforce protection for admins | Currently `false` — owner can bypass. Stronger evidence if `true`, but risks lock-out | Nothing; can flip any time |
| Team task split | 4 members — proposal in `.github/CODEOWNERS` | Task brief authoring |
| GitHub Student Pack | Applied / not applied — would allow private + protection | Nothing |

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

- [x] `gh auth login` — authenticated as `@edothecreator`
- [x] `gh auth setup-git` — required; Git Credential Manager was hanging on a
      non-displayable dialog. **Teammates will hit this too — put it in setup docs.**
- [x] Repository created: `edothecreator/vintage-marketplace-devsecops`
- [x] Pushed `main` (3 commits)
- [x] 3 collaborators invited with push permission
- [x] `CODEOWNERS` populated with verified real usernames (all 4 confirmed via API)
- [x] Repository made public (ADR 0004)
- [x] **Branch protection applied and verified live on `main`:**
      1 approving review, code-owner review required, stale reviews dismissed,
      last-push approval required, 3 required status checks (strict),
      no force pushes, no deletions, conversation resolution required
- [x] CI run #1 green — all 3 job names match the required check contexts exactly
- [x] ADR 0004 — public visibility decision + Phase 9 V2 mitigation
- [x] `.gitleaks.toml` updated: V2 demo must use the JWT-secret pattern,
      **not** a Google API key (GitHub push protection would block the push)

### Blocked on Mohamed — to close Phase 0
- [ ] **Chase the three collaborators to ACCEPT their invitations.**
      Until they do, `CODEOWNERS` reports 10 errors and code-owner review does
      not function. Verify clean with:
      `gh api repos/edothecreator/vintage-marketplace-devsecops/codeowners/errors`
- [ ] **Screenshot branch protection settings page** → `evidence/P11-code-review/01-branch-protection.png`
      (Settings → Branches → main. Only an admin can capture this; it is the
      sole proof the control is actually switched on.)
- [ ] **Screenshot the green CI run** → `evidence/P6-continuous-integration/01-first-pipeline-run.png`
- [ ] **Screenshot the collaborators page** → `evidence/P9-collaboration/01-collaborators.png`
- [ ] Obtain Gemini API key, record actual observed rate limits
- [ ] Decide whether to set `enforce_admins = true`

---

## Evidence captured so far

| Practice | Artefact | Location | Status |
|---|---|---|---|
| P6 | CI workflow definition | `.github/workflows/ci.yml` | in repo |
| P6 | First green pipeline run | GitHub Actions run #1 | **screenshot needed** |
| P8 | Pre-commit configuration | `.pre-commit-config.yaml` | in repo |
| P8 | Gitleaks rules verified against planted secrets | Phase 0 verification | **re-capture as terminal output** |
| P9 | CODEOWNERS with real usernames | `.github/CODEOWNERS` | in repo |
| P9 | Collaborators configured | GitHub settings | **screenshot needed** |
| P11 | PR template with security checklist | `.github/pull_request_template.md` | in repo |
| P11 | Branch protection active on `main` | GitHub settings + `.github/branch-protection.json` | **screenshot needed** |
| P30 | Gitleaks configuration | `.gitleaks.toml` | in repo |

> Settings screenshots cannot be produced from the command line. They are the
> only proof that a platform control is switched on, and must be captured by a
> repository administrator.

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
