import { ClaimForm } from '../components/claim/ClaimForm'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody } from '../components/ui/Card'

export function SubmitPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Post a rumour"
        title="Share what’s spreading"
        description="User uploads enter the same risk analysis, fingerprint, and verdict pipeline. AI never issues the official verdict."
      />
      <Card>
        <CardBody className="p-4 sm:p-6">
          <ClaimForm />
        </CardBody>
      </Card>
      <p className="mt-4 text-xs text-faint">
        Original claim text is not rewritten after intake. Reviewers append a verdict, note, and
        evidence.
      </p>
    </div>
  )
}
