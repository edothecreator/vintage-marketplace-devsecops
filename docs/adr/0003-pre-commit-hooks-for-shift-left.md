# ADR 0003 — Use the pre-commit framework for shift-left security hooks

**Status:** Accepted
**Date:** Phase 0

## Context

**P8 Shift left security** is a Tier 1 practice (36 mentions). The paper defines
it as integrating security considerations as early as possible in the
development lifecycle.

The earliest technically possible gate is the developer's own machine, before a
commit exists. This matters most for secrets: once a credential is pushed it
must be treated as compromised and rotated, because removing it from history
does not un-leak it. A hook that blocks the commit prevents the incident
outright, whereas a CI check only reports it after the fact.

We therefore need a local hook mechanism, and it must be trivial for three
teammates to install.

## Decision

Use the **`pre-commit` framework** (`.pre-commit-config.yaml`), with
**Gitleaks** as the primary security hook, supported by file-hygiene hooks and
one local hook that refuses real `.env` files.

Installation, once per clone:

```bash
pip install pre-commit
pre-commit install
```

Hooks are kept deliberately fast. Slow analysis — SAST, SCA, DAST — stays in CI.

## Consequences

**Positive**
- `pre-commit` downloads and version-pins the Gitleaks binary itself, so nobody
  has to install Gitleaks manually. One command for the whole team.
- The same hooks run in CI through `pre-commit/action`, so `--no-verify` cannot
  be used to bypass them permanently — the push still fails. The local hook is
  the fast feedback; CI is the backstop.
- Language-agnostic: the same configuration covers the TypeScript backend, the
  front-end, YAML workflows and Terraform.
- Gitleaks is cited in the source paper's tool table.

**Negative**
- Introduces a Python dependency into an otherwise JavaScript project. Accepted:
  Python is already present on the development machine, and the alternative
  (Husky) has a worse trade-off, below.
- Hooks can be bypassed locally with `--no-verify`. This is unavoidable for any
  client-side hook and is why the CI duplicate exists.
- Hook versions need occasional bumping (`pre-commit autoupdate`), which is
  itself Tier 2 **P27 Patch management** applied to our own tooling.

## Deliberate omission

ESLint, Prettier and TypeScript hooks are **not** configured yet. On an empty
project they would fail immediately, which would mean the team's first
experience of the security tooling is a broken commit path — the fastest way to
teach people to use `--no-verify`. They are added in Phase 2 once
`backend/package.json` exists.

## Alternatives considered

**Husky + lint-staged.** The idiomatic Node choice, installed via npm which the
project needs anyway. Rejected for now because Gitleaks is not an npm package:
we would have to either require every teammate to install the Gitleaks binary
manually, or shell out to Docker on every commit (slow, and fails for anyone
without Docker running). `pre-commit` solves binary management for us. Husky may
be added later for JS-specific hooks if the team prefers it.

**Server-side hooks only (CI).** Rejected: this is not shifting left. A secret
would already be in history by the time it is detected, which converts a
prevented problem into an incident requiring credential rotation.

**No hooks; rely on discipline.** Rejected: unenforceable, and produces no
evidence for P8.
