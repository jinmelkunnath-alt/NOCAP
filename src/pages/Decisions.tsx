import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'

const DECISIONS = [
  {
    id: 'DP1',
    title: 'Feed Order Architecture',
    decision: 'Risk-weighted recency',
    detail:
      'The public feed defaults to Risk-Weighted Recency: High, then Medium, then Low, with newer claims first inside each tier. Other sort controls remain available.',
  },
  {
    id: 'DP2',
    title: 'Public Visibility & Labeling',
    decision: 'Public visibility with prominent Unverified warning',
    detail:
      'Every claim is visible in the public feed regardless of verdict. Unverified claims display a clear warning on both the feed card status and the detail page until a human reviewer certifies a verdict.',
  },
  {
    id: 'DP3',
    title: 'Tamper-Evident Integrity',
    decision: 'Claims locked after submission with append-only review/context',
    detail:
      'Original claim text, platform, category, and source URL cannot be rewritten after intake. Reviewers append a verdict, note, confidence, and evidence. The record is never silently overwritten.',
  },
] as const

export function DecisionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Architecture & Policy"
        title="Design Decisions"
        description="Core architecture constraints and trust policies that govern NO CAP verification."
      />
      <div className="flex flex-col gap-4">
        {DECISIONS.map((item) => (
          <Card key={item.id} className="rounded-[22px] bg-white border border-[#EAEAEA] shadow-xs">
            <CardHeader className="border-b border-[#F0F0F0]">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#EF3340]">
                  {item.id}
                </span>
                <h2 className="mt-1 text-base font-bold text-[#111111]">{item.title}</h2>
              </div>
            </CardHeader>
            <CardBody className="p-5">
              <p className="text-sm font-bold text-[#EF3340]">{item.decision}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#667085]">{item.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
