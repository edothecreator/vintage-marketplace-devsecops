# Security Policy

This document is part of the project's DevSecOps deliverables. It supports
practices **P9 (Collaboration)**, **P20 (Secure coding)** and **P28 (Security
incident management)**.

---

## Scope

This policy covers the vintage marketplace web application, its REST API, its
CI/CD pipeline, and the infrastructure definitions in this repository.

## Reporting a vulnerability

This is an academic project and is not deployed for public use. For coursework
purposes, vulnerabilities are reported as follows:

| Source | Channel |
|---|---|
| Automated pipeline finding | Pipeline failure on the pull request; triaged by the PR author |
| Team member discovery | GitHub issue using the `security` label; never a public description of an exploitable live flaw |
| External reviewer / evaluator | Contact the repository owner directly |

Do **not** open a pull request that contains a working exploit against a
deployed environment.

## Supported versions

Only the `main` branch is maintained. Demonstration branches under `demo/*`
contain **deliberately introduced vulnerabilities** for evidence purposes and
must never be merged.

---

## Secure development requirements

All contributors must observe the following. These are enforced by the pipeline
where automation is possible.

### Secrets
- **Never** commit secrets, API keys, tokens, private keys or credentials.
- Local configuration goes in `.env`, which is git-ignored. Commit only
  `.env.example` with placeholder values.
- Pre-commit hooks run Gitleaks on every commit. Do not bypass with
  `--no-verify`.
- If a secret is committed: **rotate it first**, then remove it from history.
  Removal alone is not remediation — assume anything pushed is compromised.
- ASVS v5.0.0-13.3.1

### Input handling
- Validate all input at the trusted service layer, not only client-side.
  ASVS v5.0.0-2.2.2
- Use parameterised queries or the ORM. Never concatenate user input into a
  query. ASVS v5.0.0-1.2.4
- Sanitise untrusted HTML with a vetted library before rendering.
  ASVS v5.0.0-1.3.1

### Authorization
- Resolve ownership from the database, never from a value supplied in the
  request body. ASVS v5.0.0-8.2.2, v5.0.0-8.3.1
- Every route that touches a user-owned resource requires an explicit
  authorization check and a corresponding abuse-case test.

### Dependencies
- New dependencies require justification in the pull request description.
- Prefer actively maintained packages. Pin versions.
- Check the package name carefully before installing — typosquatting is a real
  supply-chain vector.
- ASVS v5.0.0-15.1.1, v5.0.0-15.2.1

### AI-assisted code
Generative AI may be used to assist development, but **all AI-generated code
must be reviewed, understood and tested before integration**, in line with the
module requirements. Specifically:
- Never send real secrets, credentials, private keys or personal data to an AI
  tool.
- Verify every library an AI tool recommends actually exists and is maintained.
- Be able to explain and justify how any AI-generated code works.
- AI-generated code is subject to the same SAST, SCA, secret scanning and DAST
  gates as hand-written code.

### Logging
- Log security events: authentication outcomes, authorization denials, control
  bypass attempts. ASVS v5.0.0-16.3.1, v5.0.0-16.3.2
- Never log credentials, tokens or payment data. Mask or hash where a value must
  be correlated. ASVS v5.0.0-16.2.5

---

## Pipeline security gates

| Gate | Tool | Fails the build on |
|---|---|---|
| SAST | SonarQube, ESLint-security | New blocker or critical issue |
| Secret scanning | Gitleaks | Any detection |
| SCA | OWASP Dependency-Check, npm audit | High/critical with a fix available |
| Dependency scanning | Retire.js | Known-vulnerable library |
| Container scanning | Trivy | High/critical in the image |
| Abuse-case tests | Jest + Supertest | Any failing test |
| DAST | OWASP ZAP | New medium-or-above alert |

Rationale for this gating policy is recorded in `docs/adr/`.

---

## Incident response (P28)

1. **Detect** — pipeline failure, monitoring alert, or manual report.
2. **Contain** — revert the offending commit; revoke affected credentials.
3. **Assess** — determine exposure; check whether anything reached a deployed
   environment.
4. **Remediate** — fix, add a regression test that fails without the fix.
5. **Review** — record cause and corrective action; add a pipeline control if
   the class of issue was not detectable automatically.

Every incident handled during this project is documented as evidence under
`evidence/tier2/`.
