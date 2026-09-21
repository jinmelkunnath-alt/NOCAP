# NO CAP (TruthLens) — Rumours, Reviewed.

Social rumour network with an accountable verification desk and live AI assessment.

See what’s being said. Check what’s verified.

Home is an AI Checker. Guests are anonymous (`Guest_7F3A`). Official verification stays human.

Community opinion is never the official NO CAP verdict.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Lucide React
- React Router
- **AI Engine**: NVIDIA NIM API (`google/gemma-4-31b-it`)

## AI Architecture

NO CAP uses a clean, single-provider server-side AI architecture powered by NVIDIA NIM:

```text
NO CAP Frontend
      ↓
POST /api/ai/check
      ↓
NO CAP server-side AI service (api/_lib/nvidiaGemma.ts)
      ↓
NVIDIA NIM Chat Completions API
      ↓
google/gemma-4-31b-it
      ↓
Structured NO CAP Assessment Validation
      ↓
Frontend Result UI
```

- **Provider**: NVIDIA NIM API
- **Endpoint**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Model**: `google/gemma-4-31b-it`
- **Secret**: `NVIDIA_API_KEY` (Server-Side Only via `process.env.NVIDIA_API_KEY`; never exposed to browser or client code)
- **Integrity Guarantee**: Never fabricates synthetic AI confidence or fallback verdicts when the model cannot be reached. Returns an explicit truthful error state (`Live AI Verification Unavailable`).

## Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variable:
   Create a `.env.local` file in the project root:
   ```bash
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build or preview:
   ```bash
   npm run build
   npm run preview
   ```

## Production & Vercel Deployment

In Vercel Project Settings -> Environment Variables, add:
- `NVIDIA_API_KEY`: Your NVIDIA NIM API key secret

Do NOT prefix with `VITE_`. The key is read exclusively on the server side via `process.env.NVIDIA_API_KEY`.

## Verification Engine

1. **Risk flagging**: Forensic linguistic triage (Sensational phrasing, Shouting, Unsourced assertions).
2. **Fingerprint match**: Instant cross-referencing against verified claim records.
3. **Routing**:
   - Strong verified match → **Fingerprint reuse** (instant)
   - Low/medium novel → **Fast single review**
   - High-risk novel → **Bridging verification** (Perspective A + B must agree)

A/B tags are independent review roles, not political identities.
Disagreement does not pick a winner. The claim stays Unverified.
The review ledger is append-only.

## Courtroom (Advisory)

`/courtroom/:claimId` runs a demo AI hearing from stored claim fields, forensics, votes, and the review ledger.
The AI Judge may lean true, false, misleading, or insufficient evidence. That leaning is never an official NO CAP verdict.
Hearings are append-only. User-submitted evidence stays `needs-human-review`.

## Incident Reporting & Escalation

Official incident reports are snapshots of **Verified False** claims only.
When high-risk cybercrime escalation thresholds are met, NO CAP provides deterministic direct links to official reporting portals (e.g. `https://cybercrime.gov.in/Webform/Accept.aspx`).
