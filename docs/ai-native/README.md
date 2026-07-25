# AI-native execution roadmap

AI-native execution means closing a work loop from detection to verified
delivery. Agent count is not the target. The target is a high rate of useful
tasks completed without intervention, while unsafe or ambiguous work is routed
to a person.

The first workflow is deliberately narrow:

> A failed GitHub Actions check becomes a diagnosed, verified draft pull
> request.

This repository owns the portable policy and task contract. It does not own the
runtime control plane. The runner, queue, leases, retries, and audit log will
live in a separate `agent-ops` repository once the contract is proven.

## Operating principles

1. Close one loop before adding more task types or workers.
2. Require deterministic evidence before increasing autonomy.
3. Separate the worker that edits from the verifier that accepts.
4. Grant permissions by risk level and task type, not by agent identity.
5. Make external writes idempotent and auditable.
6. Route exceptions to people; do not hide uncertainty with retries.

## Phases

### Phase 0: contract and boundaries

Status: complete.

Artifacts:

- [`task-contract.schema.json`](task-contract.schema.json): machine-readable
  task, risk, permission, verification, and delivery contract.
- [`examples/ci-fix-task.json`](examples/ci-fix-task.json): the first workflow.
- `just validate-task`: reproducible schema validation.
- `just test-task-schema`: positive and negative policy tests.

Exit gate:

- The example validates.
- Red-risk work can only produce a report.
- Automatic merge can only be requested for green-risk work.
- Every pull-request or merge delivery requires independent verifier evidence.
- The contract states success, stop conditions, limits, and required evidence.

### Phase 1: local single-task runner

Build a small `agent-ops` CLI that:

1. accepts one validated task file;
2. creates an isolated git worktree;
3. runs one worker with the declared permissions and limits;
4. captures commands, exit codes, changed files, and the final diff;
5. runs an independent verifier;
6. emits an evidence bundle without writing to GitHub;
7. cleans up or preserves the worktree according to the result.

Exit gate:

- A second run of the same task does not duplicate side effects.
- Timeout, cancellation, and failed verification have explicit outcomes.
- Ten representative CI failures produce complete evidence bundles.

### Phase 2: draft pull-request pilot

Add GitHub read access and draft pull-request delivery. Poll for failed checks
before adding webhooks. Keep merge approval human-owned.

Exit gate:

- Twenty to thirty representative tasks have measured outcomes.
- Every pull request links to its source failure and evidence bundle.
- Intervention rate, acceptance rate, lead time, cost, and escaped defects are
  recorded.
- No high-severity defect escapes the verifier.

### Phase 3: scheduled queue

Add a durable queue, claim/lease semantics, bounded retries, reconciliation,
dead-letter handling, and per-repository budgets. Schedule known workflows such
as CI remediation and issue triage.

Exit gate:

- Crashed workers can be recovered without duplicate delivery.
- Queue age, retries, failures, and spend are observable.
- A global concurrency limit and repository-level limit are enforced.

### Phase 4: event-driven parallel execution

Replace polling with trusted event sources where it reduces latency. Add
parallel workers only for independent tasks, each in an isolated worktree.

Exit gate:

- Event replay is idempotent.
- Conflicting tasks are serialized or rejected.
- Backpressure works when incoming work exceeds capacity.

### Phase 5: risk-based autonomy

Allow green tasks to enter a protected merge queue after independent
verification. Yellow tasks remain draft pull requests. Red tasks remain
report-only until a person explicitly authorizes execution.

Exit gate:

- Branch protection cannot be bypassed by the worker.
- Rollback and kill-switch paths are tested.
- Autonomy is promoted per workflow using measured results, never globally.

## Risk policy

| Level | Typical work | Maximum default delivery |
| --- | --- | --- |
| Green | Documentation, formatting, deterministic generated output | Auto-merge through protected checks |
| Yellow | Source changes, dependency updates, UI changes | Draft pull request |
| Red | Authentication, billing, migrations, production data, signing | Report only |

Risk is determined by the effect of the change, not by the apparent simplicity
of the prompt.

## Promotion metrics

Track these per workflow:

- completion without intervention;
- verifier rejection;
- pull-request acceptance;
- escaped defects and rollbacks;
- median lead time;
- compute cost per accepted change;
- false-positive work created by the trigger.

Concurrency is a capacity setting, not a success metric.
