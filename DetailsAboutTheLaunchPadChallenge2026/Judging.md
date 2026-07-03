---
title: The LaunchPad Challenge - Judging Criteria
source_snapshot: 2026-07-03
primary_source: https://boardingpass.work/experience/challenges/the-launchpad-challenge
purpose: AI-readable judging rubric and scoring strategy.
---

# The LaunchPad Challenge - Judging Criteria

## AI Quick Summary

Judges reward clear thinking, domain understanding, evidence, trade-off measurement, and honest self-assessment. Demo polish matters less than whether the team can justify what they built, prove claims, and explain failure modes. The strongest submissions read like disciplined engineering or research work, not like marketing.

## How Judging Works

Every submission is algorithmically matched to judges whose expertise fits the work.

Examples:

- Robotics projects go to robotics people.
- Research projects go to researchers.
- Product/application projects go to operators or builders who ship.

Each judge reviews in this order:

1. Write-up.
2. Demo video.
3. Repository spot-checks.

Each judge then:

1. Scores five pillars from 1 to 5.
2. Gives a holistic interview verdict: `Yes`, `Lean yes`, or `No`.

The interview verdict is independent of the numeric score. A mid-ranked project with honest, rigorous thinking can still earn a `Yes`. A polished demo with weak reasoning can earn a `No`.

## Golden Rule

Evidence must be appropriate to the claim.

| Claim type | What judges expect |
|---|---|
| "Production-ready" | Production-level evidence: reliability, cost, latency, edge cases, operational limits |
| "Proof of concept" | Evidence that the core idea works and that the team understands its limits |
| "Novel insight" | Clear comparison with existing work and evidence that the insight matters |
| "Better than X" | A fair baseline or alternative comparison |

Strong rule of thumb: a modest claim, proven, beats a grand claim, asserted.

## The Five Pillars

| Pillar | Judge question | What strong work shows |
|---|---|---|
| 1. Problem | Why does this matter, and what would success look like? | Specific problem, clear user/domain pain, gaps in current approaches, success criteria defined before building |
| 2. Approach | Why this solution, and what did you rule out? | Reasoned technical decisions, credible alternatives, deliberate simplicity, clear trade-offs |
| 3. Evidence | How do you know it works? | Measurements, comparisons, demos tied to claims, reproducible checks, baseline comparisons |
| 4. Constraints | Does it work under real-world limits? | Cost, latency, compute, reliability, safety, scaling, or other relevant limits measured |
| 5. Honesty and Trajectory | Where does it break, and what is next? | Known failure modes, negative results, concrete next steps, honest limitations |

## Pillar 1: Problem

Judge question: Why does this matter, and what would success look like?

Strong submissions show:

- A precise problem statement.
- Why existing approaches are insufficient.
- Success criteria defined before the build.
- Domain-specific understanding.
- A non-obvious insight that shaped the design.

Score anchors:

| Score | Meaning |
|---|---|
| 1 | No clear problem; project exists because the technology exists |
| 2 | Generic problem; little or no examination of existing approaches |
| 3 | Plausible problem; vague or retrofitted success criteria |
| 4 | Clear problem and success criteria; existing approaches and gaps examined |
| 5 | Score 4 plus a non-obvious domain insight that visibly shaped the design |

Track-specific guidance:

- Applications: identify real user pain and why current tools fail.
- Agentic systems: explain why the task needs an agent instead of one prompted model call.
- Embodied AI: identify the physical constraint or capability gap.
- Research: position the gap against actual literature.
- Infrastructure/tooling: explain the workflow bottleneck and who suffers from it.

## Pillar 2: Approach

Judge question: Why this solution, and what did you rule out?

Strong submissions show:

- Major design decisions are justified.
- Alternatives are named.
- Simpler approaches are considered before complex ones.
- The team can explain what was deliberately left out.

Score anchors:

| Score | Meaning |
|---|---|
| 1 | Design decisions unexplained; complexity without purpose |
| 2 | Approach described but not justified; no alternatives |
| 3 | Main decisions justified, but few alternatives considered |
| 4 | Major decisions reasoned; credible alternatives named and rejected with reasons |
| 5 | Score 4 plus deliberate simplicity and design taste; a judge could defend the choices |

Track-specific guidance:

- Applications: architecture, scope, and build-vs-use choices.
- Agentic systems: orchestration, model size, tools, and why a simpler pipeline is insufficient.
- Embodied AI: sensor, control, and sim-vs-real decisions.
- Research: method design, baselines, and ablation plan.
- Infrastructure/tooling: interface, abstraction, and deliberately unsupported features.

## Pillar 3: Evidence

Judge question: How do you know it works?

Strong submissions show:

- Every important claim traces to a measurement, comparison, or demonstration.
- Evidence is matched to a baseline or alternative.
- Evaluation is not just cherry-picked demos.
- Scripts, logs, or examples make results reproducible.

Score anchors:

| Score | Meaning |
|---|---|
| 1 | Claims asserted, not demonstrated |
| 2 | Some measurements exist but are disconnected from claims |
| 3 | Claims measured but without baseline or with small/cherry-picked samples |
| 4 | Claims trace to evidence and compare against a sensible baseline |
| 5 | Score 4 plus statistical honesty: sample sizes, variance, edge cases, reproducibility |

Track-specific guidance:

- Applications: task success rates, user tests, realistic inputs, error rates.
- Agentic systems: held-out task completion, trajectory analysis, single-call baseline.
- Embodied AI: simulation and real-world trials, perturbation tests, success rates.
- Research: benchmarks, published baselines, ablations, reproducible scripts.
- Infrastructure/tooling: before-and-after measurements on the workflow being improved.

## Pillar 4: Constraints

Judge question: Does it work under real-world limits?

Strong submissions show:

- Cost, latency, compute, reliability, safety, or domain-specific constraints are measured.
- Trade-offs are explicit.
- Resource choices are justified with data.
- The team can show a curve, not just the single point they selected.

Score anchors:

| Score | Meaning |
|---|---|
| 1 | No discussion of real-world limits |
| 2 | Constraints named but not measured or designed for |
| 3 | Constraints acknowledged with rough or partial measurement |
| 4 | Key trade-offs measured, such as cost-performance or latency-quality |
| 5 | Score 4 plus data-backed resource choices and clear trade-off curves |

Track-specific guidance:

- Applications: unit economics, latency budgets, reliability under load.
- Agentic systems: price-to-performance and latency-to-performance.
- Embodied AI: real-time constraints, hardware limits, safety margins.
- Research: compute budget, sample efficiency, scaling behavior.
- Infrastructure/tooling: overhead, failure behavior, operational cost.

## Pillar 5: Honesty And Trajectory

Judge question: Where does it break, and what is next?

Strong submissions show:

- Specific known failure modes.
- Examples of where the approach degrades.
- Negative results.
- A concrete plan for two more weeks of work.
- The team understands the edge of its own work better than the judge does.

Score anchors:

| Score | Meaning |
|---|---|
| 1 | No limitations discussed |
| 2 | Token limitations line with no specifics |
| 3 | Generic limitations and vague next steps |
| 4 | Specific failure modes and degradation examples |
| 5 | Score 4 plus negative results and a credible two-week next plan |

This pillar applies equally across tracks. Honest self-assessment is valuable whether the artifact is a robot, paper, product, tool, or agent.

## Green Flags

Judges are explicitly told to notice:

- Reported negative results.
- Honest limitations.
- Beating a simple baseline before building a complex system.
- Ablations.
- Trade-off curves.
- Cost and latency measurements.
- Cheaper or simpler approaches chosen with data.
- Clear explanation of what the team would do with two more weeks.

## Red Flags

Judges are explicitly told to distrust:

- "We used the most capable model, so it is accurate."
- Five cherry-picked demo runs presented as an evaluation.
- No baseline.
- No alternatives considered.
- No cost discussion.
- Complexity for its own sake.
- "It works" without defining what working means.
- Blanket statements with no evidence.

## Fairness Across Tracks

Scores are intended to be comparable because:

- The five pillars are questions, not one-size-fits-all checklists.
- Judges are matched by domain.
- Score anchors define what each score means.
- Pillars are scored independently.
- A strong Approach does not excuse missing Evidence.

## Practical Advice For Scoring Well

Use this checklist while building:

- Define success criteria in week one.
- Keep a decision log.
- Run the simplest baseline early.
- Measure cost and latency from the start.
- Save failed experiments and negative results.
- Keep the 1,000-word write-up tight.
- Put charts, logs, and long evidence in appendices.
- Make every sentence state a claim, justify a decision, or point to evidence.

## Recommended Write-Up Structure

Use the five judging pillars as section headings:

1. Problem
2. Approach
3. Evidence
4. Constraints
5. Honesty and Trajectory

For each section, use this pattern:

- Claim: what we believe or built.
- Reason: why this matters or why we chose it.
- Evidence: measurement, comparison, demo, or artifact.
- Limit: what is not yet proven.
