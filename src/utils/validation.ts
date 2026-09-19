import type { ClaimFormErrors, CreateClaimInput } from '../types'

export function validateClaimForm(input: CreateClaimInput): ClaimFormErrors {
  const errors: ClaimFormErrors = {}
  const text = input.text.trim()

  if (!text) {
    errors.text = 'Claim text is required.'
  } else if (text.length < 20) {
    errors.text = 'Enter at least 20 characters so the claim can be assessed.'
  } else if (text.length > 2000) {
    errors.text = 'Claim text must be 2000 characters or fewer.'
  }

  if (!input.platform) {
    errors.platform = 'Select a source platform.'
  }

  if (!input.category) {
    errors.category = 'Select a category.'
  }

  const url = input.sourceUrl.trim()
  if (url) {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.sourceUrl = 'URL must start with http:// or https://'
      }
    } catch {
      errors.sourceUrl = 'Enter a valid URL, or leave this blank if none is available.'
    }
  }

  return errors
}

export function hasFormErrors(errors: ClaimFormErrors): boolean {
  return Object.keys(errors).length > 0
}
