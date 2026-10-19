<!--
  Practice: P11 Code review (Tier 1, 33 mentions)
            P9  Collaboration (Tier 1, 36 mentions)

  This template is itself evidence: it shows security review is a structural
  part of the development process, not an afterthought. Completed PRs are
  captured for the report under evidence/P11-code-review/.
-->

## What this change does

<!-- One or two sentences. -->

## Related

- Phase: <!-- e.g. Phase 2 — Backend & REST API -->
- DevSecOps practice(s): <!-- e.g. P20 Secure coding -->
- ASVS requirement(s): <!-- e.g. v5.0.0-8.2.2 -->
- Issue: <!-- #n, or "none" -->

---

## Security review checklist

Tick what applies. **Write "N/A — reason" rather than leaving a box blank** —
an unexplained blank is treated as unreviewed.

### Input and output
- [ ] All new input is validated at the trusted service layer, not only client-side (ASVS 2.2.2)
- [ ] Database access uses parameterised queries or the ORM — no string concatenation (ASVS 1.2.4)
- [ ] Untrusted content is encoded or sanitised for its output context (ASVS 1.2.1, 1.3.1)
- [ ] Response returns only the fields required — no whole ORM entities (ASVS 15.3.1)
- [ ] Writable fields are explicitly allow-listed — no mass assignment (ASVS 15.3.3)

### Access control
- [ ] Every new route has an explicit authorization check
- [ ] Ownership is resolved server-side from the database, never from the request body (ASVS 8.2.2, 8.3.1)
- [ ] An abuse-case test exists proving the check works (wrong user receives 403)

### Secrets and configuration
- [ ] No secrets, keys, tokens or credentials added to the repository (ASVS 13.3.1)
- [ ] New configuration documented in `.env.example` with placeholder values
- [ ] Gitleaks passes

### Dependencies
- [ ] No new dependency, **or** each one is justified below
- [ ] Package names verified as genuine and actively maintained (typosquatting check)
- [ ] Versions pinned

<!-- Justify new dependencies here:
     package@version — why needed, why this one, maintenance status
-->

### Logging and errors
- [ ] Security-relevant events are logged (ASVS 16.3.x)
- [ ] No credentials, tokens or personal data written to logs (ASVS 16.2.5)
- [ ] Errors return a generic message to the client; detail goes to logs only (ASVS 16.5.1)

### AI-assisted code
- [ ] No AI assistance used in this change, **or** all of the following hold:
  - [ ] Every AI-generated line has been read and is understood
  - [ ] I can explain and justify how it works
  - [ ] No secrets or personal data were sent to an AI tool
  - [ ] Any libraries it suggested were verified to exist and be maintained
  - [ ] It is covered by tests and passes all pipeline gates

---

## How this was verified

<!-- Not "it looks right". State what you ran and what you observed.
     e.g. "npm test — 24 passing, including 3 new authz abuse cases"
          "manual: logged in as seller B, PUT /api/listings/<A's id> -> 403"
-->

## Evidence captured

<!-- Which artefacts were saved to evidence/, and where. "none" is valid
     for changes that are not themselves a practice demonstration. -->

---

## Reviewer notes

- [ ] I reviewed the security checklist above, not just the code style
- [ ] I pulled the branch and ran the tests locally, **or** I verified the CI run
- [ ] Any unchecked box carries an acceptable written justification

> Demonstration branches (`demo/*`) intentionally contain vulnerabilities and
> **must never be merged to `main`**. If this is a `demo/*` PR, it exists only
> to capture the pipeline's detection as evidence — close it, do not merge.
