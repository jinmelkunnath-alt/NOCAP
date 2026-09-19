# NO CAP

### A neutral AI-assisted platform for investigating, discussing, and triaging questionable claims.

**NO CAP** is a civic-tech misinformation triage platform designed to help people pause before believing or sharing questionable information.

Instead of simply labeling something as "true" or "false", NO CAP combines **AI-assisted analysis, deterministic risk signals, claim similarity, human verification, and community feedback** into one transparent workflow.

> **NO CAP checks information — not ideologies.**

---

## ✦ The Problem

Misinformation spreads at the speed of social media.

A questionable message can move through WhatsApp, Instagram, X, Reddit, and other platforms long before a human fact-checker has time to investigate it.

The problem isn't only identifying misinformation.

It's also:

- knowing which claims deserve attention first
- recognizing suspicious patterns
- finding previously investigated claims
- separating AI analysis from human verification
- allowing disagreement without presenting popularity as truth
- giving people context before they share
- maintaining a transparent history of verification

NO CAP is designed around that workflow.

---

# 🚀 What is NO CAP?

NO CAP is a social verification layer for questionable claims.

A user can:

1. Enter something they're unsure about.
2. Receive an AI-assisted assessment.
3. See observable risk signals.
4. Discover related or previously investigated claims.
5. Review evidence and uncertainty.
6. Ask the community.
7. Submit the claim for human verification.
8. Follow the verification history.

The platform is designed to keep **AI assessment, community opinion, and human verification clearly separated**.

---

# 🧠 Core Philosophy

### AI is an assistant, not the authority.

NO CAP does not treat an AI response as absolute truth.

AI can:

- analyze language
- identify risk patterns
- compare claims
- summarize available evidence
- highlight uncertainty
- assist with triage

AI cannot:

- fabricate evidence
- fabricate sources
- determine truth solely from popularity
- replace human verification
- decide political preferences
- expose hidden reasoning as if it were factual evidence

When evidence is insufficient, NO CAP can return:

> **INCONCLUSIVE**

That is a feature, not a failure.

---

# ✨ Core Features

## 1. AI-First Claim Checking

The homepage starts with the question:

> **What rumour are you unsure about?**

Users can submit a claim directly to the NO CAP AI checker.

The system analyzes the claim and returns an advisory assessment containing information such as:

- Classification
- AI confidence
- Verification status
- Summary
- Reason
- Evidence
- Counter-evidence
- Uncertainties
- Recommended action

Possible AI classifications:

- **REAL**
- **FAKE**
- **INCONCLUSIVE**

AI confidence represents the model's confidence in its assessment.

It is **not presented as a probability that a claim is true**.

---

## 2. Risk-Based Triage

Before or alongside AI analysis, NO CAP evaluates observable risk signals.

Current deterministic signals include:

### Sensational language

Examples include phrases such as:

- "breaking"
- "shocking"
- "share before deleted"

### Shouting

Claims containing more than 50% uppercase alphabetic characters are flagged.

### Unsourced

Claims without a valid HTTP/HTTPS source URL are flagged.

### Risk Levels

| Flags | Risk |
|---|---|
| 0 | Low |
| 1 | Medium |
| 2+ | High |

Risk scoring is a **triage mechanism**, not a prediction that a claim is false.

---

# 🔎 Claim Fingerprinting

Misinformation is often reposted with slightly different wording.

NO CAP uses deterministic claim normalization and similarity matching to identify potentially related submissions.

A new claim can be compared against previously stored claims to identify:

- potential duplicates
- strongly similar claims
- previously reviewed claims
- existing verification history

This helps prevent repeated work and makes it easier to recognize the same rumour as it spreads through different wording.

---

# 👥 Community Verification Layer

NO CAP separates community opinion from official verification.

Users can respond to claims using:

- **REAL**
- **FAKE**
- **NOT SURE**

Community responses represent **community sentiment**.

They do not automatically determine the official verdict.

This distinction is important:

> **A claim being popular does not make it true.**

Community interaction exists to surface disagreement, uncertainty, and additional perspectives.

---

# 🛡️ Human Verification

AI analysis is advisory.

Human verification remains the authoritative layer within the platform.

Reviewers can examine an unverified claim and move it through the verification workflow:

- Verified True
- Verified False
- Misleading

Reviewers can also attach concise review notes and supporting context.

The system is designed around transparent verification history rather than a single opaque prediction.

---

# 🌐 Public Claim Feed

NO CAP provides a public social-style feed where claims can be discovered and discussed.

The feed can surface:

- user-submitted claims
- AI-discovered claims
- verification status
- risk indicators
- community responses
- related claims
- timestamps
- categories

Users can explore claims without needing to know the original submitter.

---

# 📄 Claim Detail

Each claim has a dedicated detail view containing relevant context such as:

- Full claim
- Source platform
- Category
- Timestamp
- Risk flags
- Risk level
- AI assessment
- Verification status
- Reviewer notes
- Community responses
- Related claims
- Verification history

The goal is to make the journey from:

**"I saw this"**

to:

**"I understand what is known about this"**

transparent.

---

# 🤖 AI Architecture

NO CAP uses OpenRouter as the server-side AI gateway.

The current architecture uses two models:

### Primary

```text
Nemotron 3 Super
nvidia/nemotron-3-super-120b-a12b:free
