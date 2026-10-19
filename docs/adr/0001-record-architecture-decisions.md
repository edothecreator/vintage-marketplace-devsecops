# ADR 0001 — Record architecture decisions

**Status:** Accepted
**Date:** Phase 0

## Context

The project brief requires the report to explain how security was integrated
across the whole DevOps cycle, including the tools used and their role, the
results obtained, and the limits of the work.

Those explanations are decisions, and decisions are far cheaper to record when
they are made than to reconstruct weeks later from memory and commit diffs.

OWASP ASVS 5.0 reinforces this independently: it introduces explicit
requirements for **documented security decisions**, on the basis that some
controls are too application-specific to be prescribed generically, and that
without written decisions the corresponding implementation requirements cannot
be verified at all.

## Decision

We record every significant architecture and security decision as a numbered
Architecture Decision Record in `docs/adr/`, using this format:

```
# ADR NNNN — Title

**Status:** Proposed | Accepted | Superseded by ADR NNNN
**Date:** Phase N

## Context     — what forced a decision
## Decision    — what we chose
## Consequences — what this costs us, what it buys us, what it rules out
## Alternatives considered — and why they were rejected
```

A decision qualifies for an ADR if it meets any of:

- it affects the security posture of the application or pipeline;
- it would be hard to reverse later;
- a reader of the report would reasonably ask "why did you do it that way?";
- it was a genuine choice between defensible options.

ADRs are immutable once accepted. A changed decision gets a new ADR that
supersedes the old one; the original stays in place so the reasoning history
survives.

## Consequences

**Positive**
- The report's design-rationale sections are assembled from existing material
  rather than written from scratch under deadline pressure.
- Questions in the oral defence have written answers behind them.
- ASVS documentation requirements are satisfied as a by-product.
- New team members can read why things are the way they are.

**Negative**
- Small ongoing overhead per decision.
- Risk of drift if ADRs are written and then contradicted in code. Mitigated by
  routing `/docs/adr/` through CODEOWNERS review.

## Alternatives considered

**Document everything at the end.** Rejected — the reasoning is the part that
decays fastest, and it is exactly what the brief asks us to demonstrate.

**A single running design document.** Rejected — it invites silent edits, so the
history of *why a decision changed* is lost. Numbered immutable records keep
superseded reasoning visible.

**No formal record; rely on commit messages and PR descriptions.** Rejected —
those explain individual changes, not cross-cutting choices such as a gating
policy or an ASVS scope.
