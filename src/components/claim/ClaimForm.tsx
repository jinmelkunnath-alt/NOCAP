import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { claimService } from '../../services/claimService'
import { riskService } from '../../services/riskService'
import { CATEGORIES, PLATFORMS, type Category, type ClaimFormErrors, type Platform } from '../../types'
import { hasFormErrors, validateClaimForm } from '../../utils/validation'
import { LiveAnalysis } from '../risk/LiveAnalysis'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

const INITIAL = {
  text: '',
  sourceUrl: '',
  platform: '' as Platform | '',
  category: '' as Category | '',
}

export function ClaimForm() {
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState<ClaimFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const previewActive = values.text.trim().length > 0
  const liveAnalysis = useMemo(
    () => (previewActive ? riskService.analyzeClaimSync(values.text, values.sourceUrl) : null),
    [previewActive, values.text, values.sourceUrl],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSuccess(false)

    if (!values.platform || !values.category) {
      const nextErrors: ClaimFormErrors = {}
      if (!values.text.trim()) nextErrors.text = 'Claim text is required.'
      if (!values.platform) nextErrors.platform = 'Select a source platform.'
      if (!values.category) nextErrors.category = 'Select a category.'
      setErrors(nextErrors)
      return
    }

    const input = {
      text: values.text,
      sourceUrl: values.sourceUrl,
      platform: values.platform,
      category: values.category,
    }

    const nextErrors = validateClaimForm(input)
    setErrors(nextErrors)
    if (hasFormErrors(nextErrors)) return

    setSubmitting(true)
    try {
      const claim = await claimService.createClaim(input)
      setValues(INITIAL)
      setErrors({})
      setSuccess(true)
      navigate(`/claim/${claim.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to create claim.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Textarea
          id="claim-text"
          name="text"
          label="Claim text"
          hint="Paste the viral claim exactly as it is circulating."
          error={errors.text}
          value={values.text}
          onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))}
          placeholder="What is being claimed?"
          rows={6}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="claim-platform"
            name="platform"
            label="Source platform"
            error={errors.platform}
            value={values.platform}
            placeholder="Select platform"
            onChange={(event) =>
              setValues((current) => ({ ...current, platform: event.target.value as Platform }))
            }
            required
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </Select>

          <Select
            id="claim-category"
            name="category"
            label="Category"
            error={errors.category}
            value={values.category}
            placeholder="Select category"
            onChange={(event) =>
              setValues((current) => ({ ...current, category: event.target.value as Category }))
            }
            required
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>

        <Input
          id="claim-source-url"
          name="sourceUrl"
          type="url"
          label="Source URL"
          hint="Optional. Leave blank if the claim circulated without a link (this raises an Unsourced flag)."
          error={errors.sourceUrl}
          value={values.sourceUrl}
          onChange={(event) => setValues((current) => ({ ...current, sourceUrl: event.target.value }))}
          placeholder="https://"
        />

        {submitError && (
          <p className="rounded-xl border border-red/40 bg-red-dim px-3 py-2 text-sm text-red" role="alert">
            {submitError}
          </p>
        )}

        {success && (
          <p className="analysis-flash rounded-xl border border-green/40 bg-green-dim px-3 py-2 text-sm text-green" role="status">
            Claim created. Opening the detail record…
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
            className={submitting ? 'ring-pulse' : undefined}
          >
            {submitting ? 'Analyzing claim' : 'Analyze Claim'}
          </Button>
          <p className="text-xs text-faint">
            Submit runs risk analysis, fingerprint matching, stores the claim, and opens the detail page.
          </p>
        </div>
      </form>

      <LiveAnalysis analysis={liveAnalysis} active={previewActive} />
    </div>
  )
}
