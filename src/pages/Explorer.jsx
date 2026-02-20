import { useState, useMemo } from 'react'
import { useFirms } from '../hooks/useFirms'
import FirmModal from '../components/FirmModal'

const TEAL = '#1f514c'

const STATE_NAMES = {
  AL: 'Alabama', FL: 'Florida', GA: 'Georgia', LA: 'Louisiana',
  MS: 'Mississippi', NC: 'North Carolina', SC: 'South Carolina',
  TN: 'Tennessee', TX: 'Texas',
}

const TIER_COLORS = {
  A: { bg: '#dcfce7', text: '#15803d' },
  B: { bg: '#dbeafe', text: '#1d4ed8' },
  C: { bg: '#fef9c3', text: '#a16207' },
  D: { bg: '#fee2e2', text: '#b91c1c' },
}

const SEGMENT_LABELS = {
  hnw_individuals: 'HNW Individuals',
  professionals: 'Professionals',
  mixed: 'Mixed',
  small_business: 'Small Business',
  tax_only: 'Tax Only',
  unknown: 'Unknown',
}

function Badge({ text, colors }) {
  if (!text) return null
  const c = colors || { bg: '#f0f0f0', text: '#555' }
  return (
    <span
      style={{
        display: 'inline-block',
        background: c.bg,
        color: c.text,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </span>
  )
}

function ScoreBar({ score }) {
  if (score == null) return <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#2563eb' : '#d97706'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#eee', borderRadius: 2 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 24 }}>{Math.round(score)}</span>
    </div>
  )
}

export default function Explorer() {
  const [filters, setFilters] = useState({
    states: [],
    tiers: [],
    segments: [],
    sources: [],
    scoreMin: 0,
    scoreMax: 100,
    forSaleOnly: false,
    search: '',
  })
  const [selectedFirm, setSelectedFirm] = useState(null)
  const [searchInput, setSearchInput] = useState('')

  const { firms, total, loading, error, page, goToPage, pageSize } = useFirms(filters)

  const totalPages = Math.ceil(total / pageSize)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setFilters(f => ({ ...f, search: searchInput }))
  }

  const toggleFilter = (key, value) => {
    setFilters(f => {
      const arr = f[key] || []
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      }
    })
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Sidebar filters */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Search */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search firm name, city…"
              style={{
                width: '100%',
                height: 40,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '0 12px',
                fontSize: 13,
                fontFamily: '"Inter", sans-serif',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                height: 36,
                background: TEAL,
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 8,
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Search
            </button>
          </form>
        </div>

        {/* State filter */}
        <FilterSection title="State">
          {Object.entries(STATE_NAMES).map(([abbr, name]) => (
            <FilterCheckbox
              key={abbr}
              label={`${abbr} — ${name}`}
              checked={filters.states.includes(abbr)}
              onChange={() => toggleFilter('states', abbr)}
            />
          ))}
        </FilterSection>

        {/* Tier filter */}
        <FilterSection title="Acquisition Tier">
          {['A', 'B', 'C', 'D'].map(tier => (
            <FilterCheckbox
              key={tier}
              label={`Tier ${tier}`}
              checked={filters.tiers.includes(tier)}
              onChange={() => toggleFilter('tiers', tier)}
              color={TIER_COLORS[tier]?.text}
            />
          ))}
        </FilterSection>

        {/* Segment filter */}
        <FilterSection title="Client Segment">
          {Object.entries(SEGMENT_LABELS).map(([val, label]) => (
            <FilterCheckbox
              key={val}
              label={label}
              checked={filters.segments.includes(val)}
              onChange={() => toggleFilter('segments', val)}
            />
          ))}
        </FilterSection>

        {/* Score range */}
        <FilterSection title="Min. Acq. Score">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.scoreMin}
            onChange={e => setFilters(f => ({ ...f, scoreMin: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: TEAL }}
          />
          <div style={{ fontSize: 12, color: '#636363', textAlign: 'center' }}>
            ≥ {filters.scoreMin}
          </div>
        </FilterSection>

        {/* For sale */}
        <FilterSection title="Status">
          <FilterCheckbox
            label="For Sale Only"
            checked={filters.forSaleOnly}
            onChange={() => setFilters(f => ({ ...f, forSaleOnly: !f.forSaleOnly }))}
          />
        </FilterSection>

        {/* Reset */}
        <button
          onClick={() => {
            setFilters({ states: [], tiers: [], segments: [], sources: [], scoreMin: 0, scoreMax: 100, forSaleOnly: false, search: '' })
            setSearchInput('')
          }}
          style={{
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13,
            color: '#636363',
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          Reset filters
        </button>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: TEAL, letterSpacing: '-0.02em' }}>
              Firm Directory
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#636363' }}>
              {loading ? 'Loading…' : `${total.toLocaleString()} firms found`}
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', borderRadius: 12, padding: '12px 16px', color: '#b91c1c', fontSize: 13 }}>
            Error loading data: {error}
          </div>
        )}

        {/* Table */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Firm', 'Location', 'Tier', 'Score', 'Segment', 'Revenue', 'Phone', 'For Sale', 'Sources'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#636363',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#636363' }}>
                      Loading firms…
                    </td>
                  </tr>
                ) : firms.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#636363' }}>
                      No firms match your filters.
                    </td>
                  </tr>
                ) : (
                  firms.map((firm, i) => (
                    <tr
                      key={firm.firm_id || i}
                      onClick={() => setSelectedFirm(firm)}
                      style={{
                        borderBottom: '1px solid #f5f5f5',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafa' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '' }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#141414', maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {firm.firm_name || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#636363', whiteSpace: 'nowrap' }}>
                        {[firm.city, firm.state].filter(Boolean).join(', ')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          text={firm.acquisition_tier ? `Tier ${firm.acquisition_tier}` : '—'}
                          colors={TIER_COLORS[firm.acquisition_tier]}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: 100 }}>
                        <ScoreBar score={firm.acquisition_score} />
                      </td>
                      <td style={{ padding: '12px 16px', color: '#636363' }}>
                        {SEGMENT_LABELS[firm.client_segment] || firm.client_segment || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#141414', whiteSpace: 'nowrap' }}>
                        {firm.estimated_revenue
                          ? `$${(firm.estimated_revenue / 1000).toFixed(0)}K`
                          : firm.annual_revenue
                          ? `$${(firm.annual_revenue / 1000).toFixed(0)}K`
                          : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#636363' }}>
                        {firm.phone || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {firm.for_sale
                          ? <Badge text="For Sale" colors={{ bg: '#dcfce7', text: '#15803d' }} />
                          : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#636363', fontSize: 11, maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {firm.sources || '—'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 8 }}>
            <button
              onClick={() => goToPage(Math.max(0, page - 1))}
              disabled={page === 0}
              style={paginationBtn(page === 0)}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: '#636363' }}>
              Page {page + 1} of {totalPages.toLocaleString()}
            </span>
            <button
              onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              style={paginationBtn(page >= totalPages - 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Firm detail modal */}
      {selectedFirm && (
        <FirmModal firm={selectedFirm} onClose={() => setSelectedFirm(null)} />
      )}
    </div>
  )
}

function FilterSection({ title, children }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#636363', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function FilterCheckbox({ label, checked, onChange, color }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: color || '#141414' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: '#1f514c', width: 14, height: 14 }}
      />
      {label}
    </label>
  )
}

function paginationBtn(disabled) {
  return {
    background: disabled ? '#f5f5f5' : 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    color: disabled ? '#ccc' : '#141414',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: '"Inter", sans-serif',
  }
}
