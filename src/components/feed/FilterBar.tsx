import { useState, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  CATEGORIES,
  PLATFORMS,
  RISK_LEVELS,
  SORT_OPTIONS,
  VERDICTS,
  type Category,
  type ClaimFilters,
  type Platform,
  type RiskLevel,
  type SortOption,
  type Verdict,
} from '../../types'
import { SORT_LABELS } from '../../utils/filters'
import { Button } from '../ui/Button'
import { SearchBar } from './SearchBar'

interface FilterBarProps {
  filters: ClaimFilters
  onChange: (filters: ClaimFilters) => void
  onReset: () => void
  resetEnabled: boolean
}

const selectClass =
  'h-10 w-full rounded-xl border border-line bg-panel px-3 text-base text-ink'

export function FilterBar({ filters, onChange, onReset, resetEnabled }: FilterBarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchBar
            value={filters.search}
            onChange={(search) => onChange({ ...filters, search })}
            placeholder="Search text, status, category, or platform"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filters
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} disabled={!resetEnabled}>
            Reset filters
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5',
          !open && 'max-md:hidden',
        )}
      >
        <FilterSelect
          label="Status"
          value={filters.verdict}
          onChange={(verdict) => onChange({ ...filters, verdict: verdict as Verdict | 'All' })}
        >
          <option value="All">All</option>
          {VERDICTS.map((verdict) => (
            <option key={verdict} value={verdict}>
              {verdict}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Category"
          value={filters.category}
          onChange={(category) => onChange({ ...filters, category: category as Category | 'All' })}
        >
          <option value="All">All</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Risk"
          value={filters.risk}
          onChange={(risk) => onChange({ ...filters, risk: risk as RiskLevel | 'All' })}
        >
          <option value="All">All</option>
          {RISK_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Platform"
          value={filters.platform}
          onChange={(platform) => onChange({ ...filters, platform: platform as Platform | 'All' })}
        >
          <option value="All">All</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Sort"
          value={filters.sort}
          onChange={(sort) => onChange({ ...filters, sort: sort as SortOption })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </FilterSelect>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-mute">{label}</span>
      <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}
