<div align="center">

![Civic Tech](https://img.shields.io/badge/Civic%20Tech-misinformation%20triage-0a0a0a)
![AI: advisory only](https://img.shields.io/badge/AI-advisory%20only-d92626)
![Human: verification layer](https://img.shields.io/badge/Human-verification%20layer-0a0a0a)
![Community: signals](https://img.shields.io/badge/Community-signals-404040)
![Stage: hackathon project](https://img.shields.io/badge/Stage-hackathon%20project-d92626)
![Docs: spec--based draft](https://img.shields.io/badge/Docs-spec--based%20draft-737373)

# NO CAP

**Check the information. Not the ideology.**

A civic-tech platform for misinformation triage: AI-assisted claim assessment, deterministic risk analysis, claim fingerprinting & matching, community signals, and human verification — in one transparent pipeline.

</div>

---

> [!IMPORTANT]
> **About the status markers in this document.**
> This README documents the complete NO CAP product vision **and** separates it rigorously from what actually exists today. Because this draft was authored from the product specification, every status marker below is labeled **(per brief)** — meaning it reflects the latest product brief and has **not yet been cross-verified line-by-line against the codebase**. Maintainers: please re-verify each row of the [Implementation Status Matrix](#6-implementation-status-matrix) against the repository and update the markers before a public release. Nothing in this document is intended to claim a feature works that hasn't been verified in code.

---

## Table of Contents

1. [What NO CAP Is (and Is Not)](#1-what-no-cap-is-and-is-not)
2. [The Problem](#2-the-problem)
3. [Core Principles](#3-core-principles)
4. [How It Works — Pipeline & User Journey](#4-how-it-works--pipeline--user-journey)
5. [Feature Documentation](#5-feature-documentation)
   - [AI-First Home](#51-ai-first-home)
   - [Claim Submission & the Claim Model](#52-claim-submission--the-claim-model)
   - [Anonymous Guest Identity](#53-anonymous-guest-identity)
   - [Risk Triage Engine](#54-risk-triage-engine)
   - [AI Assessment](#55-ai-assessment)
   - [Claim Fingerprinting & Matching](#56-claim-fingerprinting--matching)
   - [Community Responses](#57-community-responses)
   - [Human Review & Verification](#58-human-review--verification)
   - [Evidence, Confidence & Transparency](#59-evidence-confidence--transparency)
   - [High-Risk Escalation](#510-high-risk-escalation)
   - [Virality Tracking](#511-virality-tracking)
6. [Implementation Status Matrix](#6-implementation-status-matrix)
7. [Roadmap](#7-roadmap)
8. [Getting Started & Configuration](#8-getting-started--configuration)
9. [Visual Identity & Design Language](#9-visual-identity--design-language)
10. [Responsible Use](#10-responsible-use)
11. [Glossary](#11-glossary)
12. [Appendix A — Relationship to the Original Specification](#appendix-a--relationship-to-the-original-specification)
13. [Appendix B — Maintaining This README](#appendix-b--maintaining-this-readme)

**Status legend**

| Marker | Meaning |
|:---:|---|
| ✅ | **Implemented** — working today (per brief; verify in code) |
| 🚧 | **Partially implemented / designed** — present in the product in some form, full behavior incomplete or unverified (per brief) |
| 🗺️ | **Planned / Roadmap** — part of the NO CAP vision, not yet built |

---

## 1. What NO CAP Is (and Is Not)

**NO CAP** is a civic-tech platform that helps people investigate questionable claims, rumours, and viral information — the forwarded WhatsApp message, the alarming X post, the screenshot going around Instagram.

The platform combines:

- **AI-assisted claim assessment** — advisory, not authoritative
- **Deterministic risk analysis** — rule-based flags on the wording and structure of a claim
- **Claim fingerprinting** — recognizing when a claim has been seen before
- **Semantic similarity** — finding claims that are worded differently but say the same thing
- **Stored claim matching** — checking a new submission against previously recorded claims
- **Community responses** — people reacting to and discussing checked claims
- **Human verification** — the formal verification layer of the platform
- **Reviewer credibility, evidence, confidence, transparency** — the trust scaffolding around every verdict
- **High-risk escalation** — routing the most dangerous claims toward human attention
- **Virality tracking (optional)** — observing how far and how fast a claim is spreading

> [!NOTE]
> **What NO CAP is *not*.**
> NO CAP is **not** an authority that automatically knows the truth. It is a transparent pipeline in which three different layers do three different jobs:
>
> | Layer | Produces | Weight |
> |---|---|---|
> | AI | An **advisory assessment** | Informative, never final |
> | Human reviewers | **Formal platform verification** | The official verdict |
> | Community | **Community signals** | Context and disagreement, surfaced honestly |

---

## 2. The Problem

Misinformation spreads faster than traditional fact-checking workflows can react. People encounter questionable claims everywhere — on **WhatsApp, X, Instagram, Reddit**, and other platforms — through social posts, forwarded messages, and informal conversations.

Faced with a suspicious claim, a person typically has no way to answer the basic questions:

- Is this **true**, **false**, or **misleading**?
- **Has someone already checked it?**
- Is this claim **spreading**?
- Is the **wording itself** suspicious?
- **Does a source exist?**
- Has anyone else **submitted the same rumour**?
- Has a **human reviewer** checked it?
- **How confident** is the assessment?
- Or is the claim still **unverified**?

NO CAP exists to build a transparent pipeline that answers those questions, step by step:

```
QUESTION → RISK TRIAGE → CLAIM MATCHING → AI ASSESSMENT → COMMUNITY → HUMAN REVIEW → VERIFICATION
```

---

## 3. Core Principles

These principles are normative for the entire product. Every feature is judged against them.

### 3.1 Check information, not ideology

NO CAP is designed to be **politically neutral**. It evaluates claims and available evidence. It does not attempt to persuade users toward any political party, candidate, ideology, political position, or policy preference.

### 3.2 AI is advisory

AI output is an **assessment**, not an official fact-check. It informs; it does not decide.

### 3.3 Human verification matters

Human reviewers provide the **formal verification layer**. A claim becomes officially verified on NO CAP through human review — never through AI output alone.

### 3.4 Community disagreement is allowed

Users can disagree. **Disagreement is not automatically misinformation.** Community responses surface signals and perspectives; they do not silence them.

### 3.5 Honest uncertainty

If the system does not know, **it says so.** "Unverified" is a valid and respected state.

### 3.6 Never fabricate certainty

If the AI is unavailable, NO CAP **must not manufacture a fake AI result.** A failed or missing assessment is surfaced as such — an absent answer is always preferable to an invented one.

---

## 4. How It Works — Pipeline & User Journey

The primary user journey:

```
User has a doubt
      ↓
Opens NO CAP
      ↓
Enters claim
      ↓
Selects metadata if required  (source platform, category, optional source URL)
      ↓
Risk analysis                  (deterministic flags: sensational, shouting, unsourced)
      ↓
Claim matching                 (fingerprint & similarity against stored claims)
      ↓
AI assessment                  (advisory, via OpenRouter)
      ↓
Result
      ↓
User can post to community
      ↓
Community responds
      ↓
Human review
      ↓
Verification
```

Each stage produces a distinct, inspectable artifact (flags, matches, assessment, responses, verdict), so the pipeline is auditable end to end.

---

## 5. Feature Documentation

### 5.1 AI-First Home

**Status:** ✅ Implemented (per brief)

The Home page is **AI-first**. The central question the product asks is:

> **“What rumour are you unsure about?”**

The primary interaction on the page is entering a claim and checking it. Everything else stays out of the way.

The UI is intentionally:

- **minimal** and **clean**
- **premium** and **text-first**
- **responsive** and **distraction-free**

The AI checker *is* the product surface. Nothing competes with it.

---

### 5.2 Claim Submission & the Claim Model

**Status:** ✅ Implemented (per brief)

A **claim** is the core unit of data in NO CAP. A claim record contains:

| Field | Description |
|---|---|
| Claim text | The questionable statement, rumour, or forwarded message being checked |
| Source platform | Where the user encountered it: **WhatsApp · X · Instagram · Reddit · Other** |
| Category | **Politics · Health · Finance · Other** |
| Source URL *(optional)* | A link to the original source, if one exists |
| Timestamp | When the claim was submitted |
| Anonymous user identity | The `Guest_XXXX` handle of the submitter (see [5.3](#53-anonymous-guest-identity)) |
| Risk analysis | Deterministic flags and risk level produced by the triage engine |
| AI assessment | The advisory AI output, if one was produced |
| Matching information | Fingerprint/similarity matches against stored claims |
| Community information | Community responses and signals |
| Verification information | Human-review state and outcome |

> [!NOTE]
> The fields above are those defined in the product specification. The actual data model in the repository may contain additional fields; verify against the code before relying on this list as exhaustive.

---

### 5.3 Anonymous Guest Identity

**Status:** ✅ Implemented (per brief)

NO CAP **does not require traditional signup/sign-in** for the core experience. Instead, every user receives an **anonymous guest identity** in the format:

```
Guest_XXXX
```

Key properties:

- The guest identity is the user's public-facing handle for submissions and interactions.
- The **raw IP address is never presented as the user's public identity.**
- The identity supports **independence** (distinguishing one participant from another) and **deduplication** reasoning (e.g., recognizing repeat submissions).

> [!NOTE]
> The exact mechanics — how the identity is generated, how it is persisted (e.g., browser storage), and where it is stored server-side — are implementation details that must be documented from the actual code. They are deliberately not asserted here until verified.

---

### 5.4 Risk Triage Engine

**Status:** ✅ Implemented (per brief)

Before any AI is involved, every claim passes through a **deterministic risk triage engine** — plain rules, no model, fully explainable.

#### Risk signals

| Flag | Trigger | What it indicates |
|---|---|---|
| **SENSATIONAL** | Presence of phrases such as *"breaking"*, *"shocking"*, *"share before deleted"* | Language engineered for urgency and virality |
| **SHOUTING** | More than **50%** of the relevant text is uppercase | ALL-CAPS styling typical of forwarded alarm messages |
| **UNSOURCED** | No source link is attached to the claim | Nothing cited that could be checked |

#### Risk levels

| Level | Condition |
|---|---|
| **Low risk** | No flags raised |
| **Medium risk** | One flag raised |
| **High risk** | **Two or more flags** raised |

> [!WARNING]
> **Flags are indicators — not proof.**
> A risk flag means the *presentation* of a claim has properties commonly associated with misinformation. It is **not** evidence that the claim is false. A true claim can be shouted, unsourced, and breaking. A false claim can read calmly and cite a link. Triage decides *what deserves attention*; it never decides *what is true*.

---

### 5.5 AI Assessment

**Status:** ✅ Implemented (per brief)

NO CAP's AI layer runs on **[OpenRouter](https://openrouter.ai)** with a dual-model configuration: a primary model for quality, and a fast/backup model.

| Role | Model | Selected via |
|---|---|---|
| **Primary** | `nvidia/nemotron-3-super-120b-a12b:free` | `OPENROUTER_MAIN_MODEL` |
| **Fast / backup** | `nvidia/nemotron-3.5-lightning:free` | `OPENROUTER_FAST_MODEL` |

#### Environment variables

```env
OPENROUTER_API_KEY=
OPENROUTER_MAIN_MODEL=
OPENROUTER_FAST_API_KEY=
OPENROUTER_FAST_MODEL=
```

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | API key used for the primary model |
| `OPENROUTER_MAIN_MODEL` | Model identifier for the primary assessment model |
| `OPENROUTER_FAST_API_KEY` | API key used for the fast/backup model |
| `OPENROUTER_FAST_MODEL` | Model identifier for the fast/backup model |

#### Governing behaviors

1. **Advisory only.** The AI output is an assessment attached to the claim. It is never, by itself, a platform verification.
2. **Honest failure (Principle 3.6).** If the AI provider is unreachable, errors out, or the assessment cannot be produced, NO CAP reports the absence of an assessment. It **never fabricates a fake AI result** to fill the gap.
3. **Labeled as AI.** Anything produced by this layer is distinguishable from human verification and community signals throughout the UI.

> [!NOTE]
> Exact behavior details — fallback ordering between the two models, request/response schema, timeout handling — should be documented from the code once verified. They are not asserted here.

---

### 5.6 Claim Fingerprinting & Matching

**Status:** 🚧 Partially implemented / designed (per brief)

The same rumour usually arrives many times, worded slightly differently each time. NO CAP addresses this with three complementary mechanisms:

- **Claim fingerprinting** — producing a normalized identity for a claim so near-duplicates can be recognized.
- **Semantic similarity** — finding claims that are phrased differently but carry the same content.
- **Stored claim matching** — checking a new submission against previously stored claims, so a user can be told *"this has been checked before"* instead of starting from zero.

Claim matching sits between Risk Triage and AI Assessment in the pipeline, answering the user questions *"Has someone already checked it?"* and *"Has anyone else submitted the same rumour?"*

> [!NOTE]
> Matching thresholds, fingerprint algorithm, and similarity method are implementation details to be documented from the verified code.

---

### 5.7 Community Responses

**Status:** 🚧 Partially implemented / designed (per brief)

After receiving a result, a user can **post the claim to the community**, where other users respond. Community responses provide **community signals** — reactions, context, counterpoints, and discussion.

Ground rules (from Principle 3.4):

- Disagreement is allowed and is **not** automatically treated as misinformation.
- Community signals are displayed as *community signals* — a distinct layer from AI assessment and human verification.

---

### 5.8 Human Review & Verification

**Status:** 🚧 Partially implemented / designed (per brief)

Human reviewers provide the **formal verification layer** of the platform (Principle 3.3):

- The AI assessment informs the reviewer; it does not bind them.
- A human verdict is what makes a claim **officially verified** on NO CAP.
- The review workflow — queueing, assignment, verdict states, and reviewer tooling — is part of the designed system; its full scope is tracked in the [Implementation Status Matrix](#6-implementation-status-matrix) and the [Roadmap](#7-roadmap).

---

### 5.9 Evidence, Confidence & Transparency

**Status:** 🚧 Partially implemented / designed (per brief)

Every assessment in NO CAP is meant to be inspectable:

- **Evidence** — what supports or challenges a claim.
- **Confidence** — how certain the assessment is (and honest uncertainty when it isn't, per Principle 3.5).
- **Transparency** — which layer produced which statement: AI advisory, community signal, or human verification.

Richer forms of these — formal **confidence intervals**, structured **counter-evidence**, and **community consensus** views — are on the roadmap (see [§7](#7-roadmap)).

---

### 5.10 High-Risk Escalation

**Status:** 🚧 Partially implemented / designed (per brief)

Claims that triage as **High Risk** (two or more flags, see [§5.4](#54-risk-triage-engine)) are candidates for **escalation toward human attention**, so that the most potentially harmful claims are prioritized for review rather than waiting passively in a queue.

---

### 5.11 Virality Tracking

**Status:** 🗺️ Planned (optional in the vision)

An optional capability in the NO CAP vision: tracking how a claim spreads over time — **temporal decay** and virality signals — answering *"Is this claim spreading?"* and helping prioritize what to verify next. Not built yet.

---

## 6. Implementation Status Matrix

The complete feature inventory, including everything from the original feature vision. **Status column reflects the product brief; verify each row against the repository.**

| Feature | Status (per brief) | Notes |
|---|:---:|---|
| AI-first home with claim checker | ✅ | Central question: *"What rumour are you unsure about?"* |
| Claim submission (text, platform, category, optional source URL, timestamp) | ✅ | Platforms: WhatsApp · X · Instagram · Reddit · Other; Categories: Politics · Health · Finance · Other |
| Anonymous guest identity (`Guest_XXXX`) | ✅ | No signup required; raw IP never used as public identity |
| Risk triage — SENSATIONAL flag | ✅ | Deterministic phrase-based trigger |
| Risk triage — SHOUTING flag | ✅ | > 50% uppercase heuristic |
| Risk triage — UNSOURCED flag | ✅ | No source link attached |
| Risk levels (Low / Medium / High) | ✅ | High = 2+ flags; Low/Medium thresholds to confirm in code |
| AI assessment via OpenRouter (primary + fast/backup models) | ✅ | Advisory only; honest failure, never fabricated |
| Claim result view | ✅ | Result stage of the primary user journey |
| Claim fingerprinting | 🚧 | Part of the pipeline; implementation depth to verify |
| Semantic similarity | 🚧 | Part of the platform design; details to verify |
| Stored claim matching | 🚧 | "Has this been checked before?" surface; details to verify |
| Community posting & responses | 🚧 | Community signals layer; disagreement is permitted |
| Human review workflow | 🚧 | Formal verification layer; full workflow completion to verify |
| High-risk escalation | 🚧 | Prioritization path for 2+ flag claims |
| Evidence & transparency surfaces | 🚧 | Layer attribution (AI / community / human) is designed in |
| Confidence display | 🚧 | Honest uncertainty; formal intervals are roadmap |
| Full claim detail view (evidence, counter-evidence, history) | 🗺️ | Beyond the current result view |
| Public feed | 🗺️ | Including **feed-order decisions** |
| Visibility decisions | 🗺️ | What gets shown where, and why |
| Editing decisions | 🗺️ | Edit semantics for claims/reviews |
| Auto-source verification | 🗺️ | Checking whether a cited source exists / says what's claimed |
| Reviewer credibility scoring | 🗺️ | Trust weighting for reviewers |
| Formal confidence intervals | 🗺️ | Statistical framing of assessment certainty |
| Counter-evidence | 🗺️ | Structured opposing evidence on a claim |
| Community consensus | 🗺️ | Aggregate view of community signals |
| Temporal decay / virality tracker | 🗺️ | Optional by design |
| Category-specific risk scoring | 🗺️ | Risk tuning per category (Politics / Health / Finance / Other) |
| Reviewer dashboard | 🗺️ | Dedicated tooling for human reviewers |
| Social-platform API | 🗺️ | Programmatic access concept for external platforms |

---

## 7. Roadmap

Unordered, grouped by theme. Items here are part of the NO CAP vision and are **not yet implemented**.

**Review workflow & reviewer experience**
- Complete review workflow (queue → assignment → verdict)
- Reviewer dashboard
- Reviewer credibility scoring
- Editing decisions
- Visibility decisions

**Claim intelligence**
- Auto-source verification
- Formal confidence intervals
- Structured counter-evidence
- Community consensus views
- Category-specific risk scoring

**Distribution & reach**
- Public feed with explicit feed-order decisions
- Full claim detail view (evidence, counter-evidence, history)
- Temporal decay / virality tracking (optional)
- Social-platform API concept

---

## 8. Getting Started & Configuration

> [!WARNING]
> This README was authored from the product specification without access to the repository. To avoid inventing anything, **no runtime stack, install command, or run command is asserted here.** Maintain this section from the actual repository.

### 8.1 Environment configuration (verified part)

NO CAP's AI layer requires OpenRouter credentials and model selection:

```env
OPENROUTER_API_KEY=       # API key for the primary model
OPENROUTER_MAIN_MODEL=    # e.g. nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_FAST_API_KEY=  # API key for the fast/backup model
OPENROUTER_FAST_MODEL=    # e.g. nvidia/nemotron-3.5-lightning:free
```

Obtain API keys from [OpenRouter](https://openrouter.ai). Never commit real keys to the repository.

### 8.2 Running the project

<!-- TODO(maintainer): replace this block with the verified setup/run instructions from the repository (prerequisites, install, run, and any non-AI environment variables). -->

_Run instructions pending verification against the repository._

---

## 9. Visual Identity & Design Language

| Element | Specification |
|---|---|
| **NO** | Dark / black |
| **CAP** | Red |
| Tagline | *Check the information. Not the ideology.* |

The interface is **minimal, clean, premium, text-first, responsive, and distraction-free**. The claim checker is the hero of the product; the design keeps every other element subordinate to it.

---

## 10. Responsible Use

NO CAP is built around epistemic humility, and asks the same of its users:

- **Flags are not verdicts.** Risk signals describe how a claim is written, not whether it is true.
- **AI output is an assessment, not a fact-check.** Treat it as an informed starting point.
- **Only human review produces platform verification.**
- **"Unverified" is an answer.** Absence of verification is information, and it is shown honestly.
- **Disagreement is not misinformation.** Community responses can conflict; that conflict is surfaced, not suppressed.
- **NO CAP is politically neutral by design.** It checks information, never ideology.

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **Claim** | A questionable statement, rumour, or forwarded message submitted for checking |
| **Risk flag** | A deterministic signal (SENSATIONAL, SHOUTING, UNSOURCED) about how a claim is presented |
| **Risk level** | Low / Medium / High; High = 2+ flags |
| **Assessment** | The AI's advisory analysis of a claim |
| **Verification** | The formal verdict produced by human review |
| **Community signal** | Reactions and responses from users, shown as community input |
| **Guest identity** | The anonymous `Guest_XXXX` handle assigned to each user |
| **Fingerprint** | A normalized representation of a claim used for duplicate detection |
| **Escalation** | Routing high-risk claims toward prioritized human attention |
| **Honest failure** | The rule that an unavailable AI must yield "no assessment," never a fabricated one |

---

## Appendix A — Relationship to the Original Specification

NO CAP's feature vision originates from an earlier specification developed under a working codename. The project has since been renamed, and all current product references use **NO CAP**. The current implementation has evolved beyond the original concept, adding new product decisions and AI-first workflows; the original feature inventory is fully preserved in the [Implementation Status Matrix](#6-implementation-status-matrix) and the [Roadmap](#7-roadmap).

---

## Appendix B — Maintaining This README

1. After any change to the codebase, re-walk the [Implementation Status Matrix](#6-implementation-status-matrix) row by row against the code.
2. Promote 🚧 → ✅ only when the behavior is demonstrably implemented; move unfinished items back to 🗺️ rather than overstating them.
3. Keep the "per brief" caveat until the full matrix has been code-verified; then remove it and date the verification.
4. Never document a feature as working that is not in the code. When in doubt, mark it 🚧 or 🗺️.

---

<div align="center">

**NO CAP** — *Check the information. Not the ideology.*

</div>
