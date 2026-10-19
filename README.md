# Vintage Marketplace — AI-Augmented DevSecOps Pipeline

Academic project for the module **Sécurité des applications et des services**
(Cycle ingénieur IRISI 3, Faculté des Sciences et Techniques Marrakech, 2026/2027).

**Projet 3** — Design and implementation of an AI-augmented DevSecOps pipeline for
applications in the JavaScript ecosystem (Express.js).

---

## What this project is

A deliberately small **vintage marketplace** web application — sellers list
one-of-a-kind second-hand items, buyers purchase them — wrapped in a complete
DevSecOps pipeline.

The application is intentionally minimal. The pipeline is the deliverable. Every
feature exists because it creates a security surface we then defend, automate a
control for, and demonstrate.

## Project structure

```
backend/            Express.js + TypeScript REST API
frontend/           Web front-end
docs/
  adr/              Architecture Decision Records
  threat-model/     Threat model source and diagrams
  *.txt             Planning documents
evidence/           Proof captured per DevSecOps practice (P1..P11, tier2)
tasks/              Self-contained task briefs for team members
.github/workflows/  CI/CD pipeline definitions
```

## Security standards applied

| Standard | Role in this project |
|---|---|
| Prates & Pereira (2025), *DevSecOps practices and tools* | Source of the practice taxonomy (Tier 1 / Tier 2 / Tier 3) |
| OWASP ASVS 5.0.0 | Application security requirements and verification level |
| OWASP Top 10:2025 | Web application risk catalogue |
| OWASP API Security Top 10 | API risk catalogue |
| OWASP Top 10 for LLM Applications | Risk catalogue for the AI features |
| OWASP Mobile Top 10 | Reserved for the deferred mobile phase |

**ASVS target:** full Level 1, plus targeted Level 2 on chapters V2, V4, V5, V6,
V8, V13 and V16. Scoping rationale is recorded in `docs/adr/`.

## DevSecOps practices implemented

All **11 Tier 1 (Core)** practices are mandatory for this project. Tier 2
practices are implemented selectively. See `docs/tier1-tier2-practices.txt` for
the full reference list with mention counts and definitions.

## Documentation

| Document | Contents |
|---|---|
| `docs/tier1-tier2-practices.txt` | Tier 1 / Tier 2 / Tier 3 practice reference |
| `docs/web-app-attack-plan.txt` | Phased implementation plan (web application) |
| `PROGRESS.md` | Current state, next actions, blockers, decision log index |
| `SECURITY.md` | Security policy and vulnerability reporting |
| `docs/adr/` | Architecture Decision Records |

## Getting started

> The application scaffold is not yet built. This section is completed in Phase 2.

Prerequisites: Node.js, Docker, Git, Python (for pre-commit hooks).

```bash
git clone <repo-url>
cd <repo>
pip install pre-commit
pre-commit install
```

## Status

See `PROGRESS.md` for the authoritative current state.

## Licence and attribution

Coursework submission. Third-party standards referenced above remain the property
of their respective authors; see `docs/` for full citation and licence details.
