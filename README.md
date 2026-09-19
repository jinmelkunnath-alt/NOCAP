# TruthLens — Rumours, Reviewed.

Social rumour network with an accountable verification desk.

See what’s being said. Check what’s verified.

Home is an AI Checker. Guests are anonymous (`Guest_7F3A`). Official verification stays human.

Community opinion is never the official TruthLens verdict.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Lucide React
- React Router

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

SPA routes (`/claim/:id`, `/courtroom/:claimId`, `/profile/:username`) rewrite to `index.html` via `vercel.json` and `netlify.toml`.

## Verification engine

1. Risk flagging (existing Phase 3 rules)
2. Fingerprint match against verified claims
3. Routing:
   - strong verified match → **Fingerprint reuse** (instant)
   - low/medium novel → **Fast single review**
   - high-risk novel → **Bridging verification** (Perspective A + B must agree)

A/B tags are independent review roles, not political identities.

Disagreement does not pick a winner. The claim stays Unverified.

The review ledger is append-only.

## Demo desk

Switch reviewers on `/review`. Default: Reviewer Atlas (Perspective A).

Seeded high-risk novel claim: `clm_016` (free laptops).

Seeded fingerprint reuse: `clm_017` (RBI variant of `clm_003`).

## Courtroom (advisory)

`/courtroom/:claimId` runs a demo AI hearing from stored claim fields, Phase 3 forensics, votes, and the review ledger.

The AI Judge may lean true, false, misleading, or insufficient evidence. That leaning is never an official TruthLens verdict.

Hearings are append-only. User-submitted evidence stays `needs-human-review`.

## Verification shield

Every social post shows a TruthLens Verification Shield: Unverified, Verified True, Verified False, or Misleading.

Community votes and AI courtroom leanings stay visible and separate from the official status.

Honor Score is a contribution metric, not a personal truthfulness score.

## Incident reporting

Official incident reports are snapshots of **Verified False** claims only. They require demo desk-reviewer confirmation and never contact an authority.

Community reports on `/moderation` are separate from verification.
