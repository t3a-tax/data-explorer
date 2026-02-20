import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TEAL = '#1f514c'

// Known field completeness from pipeline analysis (pre-computed from parquet)
// These are the actual values from the firms_master.parquet dataset
const KNOWN_COMPLETENESS = [
  { field: 'firm_name', label: 'Firm Name', pct: 100, category: 'Core' },
  { field: 'city', label: 'City', pct: 100, category: 'Core' },
  { field: 'state', label: 'State', pct: 100, category: 'Core' },
  { field: 'acquisition_score', label: 'Acquisition Score', pct: 100, category: 'Scoring' },
  { field: 'acquisition_tier', label: 'Acquisition Tier', pct: 100, category: 'Scoring' },
  { field: 'client_segment', label: 'Client Segment', pct: 100, category: 'Scoring' },
  { field: 'estimated_revenue', label: 'Est. Revenue', pct: 100, category: 'Financial' },
  { field: 'estimated_employee_count', label: 'Est. Employees', pct: 100, category: 'Financial' },
  { field: 'wealth_mgmt_potential', label: 'Wealth Mgmt Potential', pct: 100, category: 'Scoring' },
  { field: 'revenue_confidence', label: 'Revenue Confidence', pct: 100, category: 'Financial' },
  { field: 'employee_count_confidence', label: 'Employee Confidence', pct: 100, category: 'Financial' },
  { field: 'sources', label: 'Data Sources', pct: 100, category: 'Core' },
  { field: 'credentials', label: 'Credentials', pct: 33.8, category: 'Professional' },
  { field: 'full_address', label: 'Full Address', pct: 30.1, category: 'Contact' },
  { field: 'listing_notes', label: 'Listing Notes', pct: 34.0, category: 'M&A' },
  { field: 'zip_code', label: 'Zip Code', pct: 39.2, category: 'Contact' },
  { field: 'google_rating', label: 'Google Rating', pct: 2.8, category: 'Social Proof' },
  { field: 'google_review_count', label: 'Google Reviews Count', pct: 2.8, category: 'Social Proof' },
  { field: 'phone', label: 'Phone Number', pct: 3.3, category: 'Contact' },
  { field: 'website', label: 'Website', pct: 2.6, category: 'Contact' },
  { field: 'annual_revenue', label: 'Actual Annual Revenue', pct: 0.2, category: 'Financial' },
  { field: 'for_sale', label: 'For Sale Flag', pct: 0.2, category: 'M&A' },
  { field: 'sale_status', label: 'Sale Status', pct: 0.2, category: 'M&A' },
  { field: 'broker_name', label: 'Broker Name', pct: 0.2, category: 'M&A' },
  { field: 'asking_price', label: 'Asking Price', pct: 0.0, category: 'M&A' },
  { field: 'email', label: 'Email Address', pct: 0.0, category: 'Contact' },
  { field: 'latitude', label: 'Latitude', pct: 0.0, category: 'Geographic' },
  { field: 'longitude', label: 'Longitude', pct: 0.0, category: 'Geographic' },
  { field: 'year_established', label: 'Year Established', pct: 0.0, category: 'Business' },
  { field: 'employee_count', label: 'Actual Employee Count', pct: 0.0, category: 'Financial' },
  { field: 'software', label: 'Accounting Software', pct: 0.1, category: 'Business' },
  { field: 'primary_service', label: 'Primary Service', pct: 0.1, category: 'Business' },
]

// Source coverage analysis
const SOURCE_COVERAGE = [
  {
    name: 'CPA Directory',
    key: 'cpadirectory',
    firms: 83488,
    states: ['AL', 'FL', 'GA', 'LA', 'MS', 'NC', 'SC', 'TN', 'TX'],
    fields: ['firm_name', 'city', 'state', 'credentials'],
    missing: ['phone', 'website', 'address', 'revenue'],
    status: 'complete',
    color: '#16a34a',
  },
  {
    name: 'State CPA Boards',
    key: 'state_cpa_boards',
    firms: 45628,
    states: ['AL', 'FL', 'TN'],
    fields: ['firm_name', 'city', 'state', 'credentials', 'license_status'],
    missing: ['phone', 'website', 'revenue', 'GA', 'LA', 'MS', 'NC', 'SC', 'TX'],
    status: 'partial',
    color: '#d97706',
  },
  {
    name: 'Google Maps',
    key: 'google_maps',
    firms: 7525,
    states: ['AL', 'FL', 'GA', 'LA', 'MS', 'NC', 'SC', 'TN', 'TX'],
    fields: ['firm_name', 'address', 'phone', 'website', 'rating', 'reviews'],
    missing: ['revenue', 'employees', 'owner_info'],
    status: 'complete',
    color: '#16a34a',
  },
  {
    name: 'Google Maps Detail',
    key: 'google_maps_detail',
    firms: 7525,
    states: ['AL', 'FL', 'GA', 'MS', 'NC', 'SC', 'TN'],
    fields: ['extended business details', 'hours', 'website'],
    missing: ['LA', 'TX', 'revenue'],
    status: 'partial',
    color: '#d97706',
  },
  {
    name: 'Accounting Practice Exchange',
    key: 'accounting_practice_exchange',
    firms: 285,
    states: ['AL', 'FL', 'GA', 'LA', 'MS', 'NC', 'SC', 'TN', 'TX'],
    fields: ['firm_name', 'city', 'annual_revenue', 'asking_price', 'broker', 'sale_status', 'listing_notes'],
    missing: ['phone', 'website'],
    status: 'complete',
    color: '#16a34a',
  },
  {
    name: 'Secretary of State',
    key: 'secretary_of_state',
    firms: 3,
    states: ['SC'],
    fields: ['business_entity', 'registration_date', 'status'],
    missing: ['AL', 'FL', 'GA', 'LA', 'MS', 'NC', 'TN', 'TX', 'revenue', 'contact'],
    status: 'early',
    color: '#dc2626',
  },
]

const NEXT_STEPS = [
  {
    priority: 'High',
    category: 'Data Expansion',
    title: 'Expand State CPA Board Scraping',
    description: 'Only AL, FL, and TN have been scraped from state boards. Adding GA, LA, MS, NC, SC, and TX would add ~40K more licensed CPA records with credential data.',
    impact: 'Adds license verification for 6 missing states. Improves credibility scoring.',
    effort: 'Medium',
    color: '#dc2626',
  },
  {
    priority: 'High',
    category: 'Data Quality',
    title: 'Run Geocoding Pipeline',
    description: 'The geocoding step (geocode.py) has not been run on the current master dataset. 0% of firms have lat/lng coordinates, blocking map-level analysis.',
    impact: 'Enables geographic filtering, proximity analysis, and map visualization.',
    effort: 'Low (run existing pipeline)',
    color: '#dc2626',
  },
  {
    priority: 'High',
    category: 'Contact Data',
    title: 'Expand Google Maps Detail to LA and TX',
    description: 'Google Maps Detail scraping is missing Louisiana and Texas — the 4th and 2nd largest states by firm count. These states have 33,554 firms but no detail-level phone/website data.',
    impact: 'Improves phone coverage from 3.3% → ~10%. Adds website data for 33K firms.',
    effort: 'Low (run existing scraper for LA, TX)',
    color: '#dc2626',
  },
  {
    priority: 'Medium',
    category: 'New Data Source',
    title: 'Implement Xero Advisors Scraper',
    description: 'Xero Advisors directory is configured but the scraper directory is empty. Xero advisor data includes cloud accounting firms, which are higher-value targets.',
    impact: 'Adds new segment of tech-forward firms not well-represented in current sources.',
    effort: 'Medium (new scraper)',
    color: '#d97706',
  },
  {
    priority: 'Medium',
    category: 'New Data Source',
    title: 'Add IRS PTIN Registry',
    description: 'Logs show an IRS PTIN scraper was attempted (irs_ptin.log: 106KB of activity) but data is not in the pipeline. The IRS Preparer Tax Identification Number database is a public federal registry.',
    impact: 'Adds federal-level credentialing data. Cross-references existing firms.',
    effort: 'Medium (integrate existing work)',
    color: '#d97706',
  },
  {
    priority: 'Medium',
    category: 'New Data Source',
    title: 'Expand Secretary of State Coverage',
    description: 'Only 3 firms from SC via Secretary of State. All 9 states have public business entity registries that could provide incorporation dates, registered agents, and legal entity status.',
    impact: 'Adds business age data (year_established = 0%), legal structure, ownership indicators.',
    effort: 'High (8 new state implementations)',
    color: '#d97706',
  },
  {
    priority: 'Medium',
    category: 'Data Quality',
    title: 'Add Phone/Email Enrichment via People Data Labs or Hunter.io',
    description: 'Phone coverage is only 3.3% and email is 0%. A commercial data enrichment API could fill these gaps using firm name + address matching.',
    impact: 'Dramatically improves outreach capability. Enables direct contact workflows.',
    effort: 'Medium (API integration + budget)',
    color: '#d97706',
  },
  {
    priority: 'Low',
    category: 'New Data Source',
    title: 'Scrape BBB, Yelp, and Yellow Pages',
    description: 'Logs show scraper attempts for BBB (82KB), Yelp (348KB), Yellow Pages (348KB), and Manta (293KB). These appear to have been halted, likely due to anti-scraping measures. Could provide additional contact/review data.',
    impact: 'Adds social proof signals. May provide owner names from Yelp business profiles.',
    effort: 'High (anti-scraping obstacles)',
    color: '#16a34a',
  },
  {
    priority: 'Low',
    category: 'Scoring',
    title: 'Integrate Actual Revenue Data for More Firms',
    description: 'Only 0.2% of firms have actual annual revenue data (from Practice Exchange). Estimated revenue is used for scoring but has low confidence for most firms.',
    impact: 'Improves acquisition scoring accuracy for 99.8% of the dataset.',
    effort: 'High (requires commercial data or manual research)',
    color: '#16a34a',
  },
]

function getPctColor(pct) {
  if (pct >= 80) return '#16a34a'
  if (pct >= 40) return '#d97706'
  if (pct >= 10) return '#f97316'
  return '#dc2626'
}

const CATEGORIES = ['All', 'Core', 'Contact', 'Financial', 'Scoring', 'M&A', 'Professional', 'Social Proof', 'Geographic', 'Business']

export default function DataCompleteness() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [liveStats, setLiveStats] = useState(null)

  useEffect(() => {
    loadLiveStats()
  }, [])

  async function loadLiveStats() {
    try {
      const { count: total } = await supabase
        .from('firms')
        .select('*', { count: 'exact', head: true })
      setLiveStats({ total })
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = selectedCategory === 'All'
    ? KNOWN_COMPLETENESS
    : KNOWN_COMPLETENESS.filter(f => f.category === selectedCategory)

  const avgCompleteness = Math.round(
    KNOWN_COMPLETENESS.reduce((sum, f) => sum + f.pct, 0) / KNOWN_COMPLETENESS.length
  )

  const criticalGaps = KNOWN_COMPLETENESS.filter(f => f.pct < 10).length
  const goodFields = KNOWN_COMPLETENESS.filter(f => f.pct >= 80).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: '"Hedvig Letters Serif", Georgia, serif',
            fontSize: 32,
            fontWeight: 400,
            color: TEAL,
            margin: 0,
            letterSpacing: '-0.03em',
          }}
        >
          Data Completeness Analysis
        </h1>
        <p style={{ color: '#636363', marginTop: 8, marginBottom: 0, fontSize: 15 }}>
          Field-level completeness across {liveStats?.total?.toLocaleString() || '135,156'} firms in the master dataset
        </p>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Firms', value: liveStats?.total?.toLocaleString() || '135,156', color: TEAL },
          { label: 'Avg Field Completeness', value: `${avgCompleteness}%`, color: '#d97706' },
          { label: 'Fields 100% Complete', value: goodFields, color: '#16a34a' },
          { label: 'Critical Gaps (<10%)', value: criticalGaps, color: '#dc2626' },
          { label: 'Active Data Sources', value: '6', color: TEAL },
          { label: 'States Covered', value: '9 / 50', color: '#636363' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 16, padding: '20px 20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, color: '#636363', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Field completeness table */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#141414' }}>Field Completeness</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? TEAL : '#f5f5f5',
                  color: selectedCategory === cat ? 'white' : '#636363',
                  border: 'none',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {filtered.map(({ field, label, pct, category }) => {
            const color = getPctColor(pct)
            return (
              <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid #f8f8f8' }}>
                <div style={{ width: 180, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#141414' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{field}</div>
                </div>
                <span style={{ fontSize: 10, color: '#aaa', background: '#f5f5f5', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                  {category}
                </span>
                <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <div style={{ width: 48, textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Source coverage */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', padding: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#141414' }}>Data Source Coverage</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SOURCE_COVERAGE.map(src => (
            <div key={src.key} style={{ border: '1px solid #f0f0f0', borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: src.color }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{src.name}</span>
                  <span style={{ fontSize: 12, color: '#636363' }}>{src.firms.toLocaleString()} firms</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                  background: src.status === 'complete' ? '#dcfce7' : src.status === 'partial' ? '#fef9c3' : '#fee2e2',
                  color: src.status === 'complete' ? '#15803d' : src.status === 'partial' ? '#a16207' : '#b91c1c',
                }}>
                  {src.status === 'complete' ? 'Complete' : src.status === 'partial' ? 'Partial' : 'Early Stage'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#636363', fontWeight: 600, marginBottom: 4 }}>STATES COVERED</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {src.states.map(s => (
                      <span key={s} style={{ fontSize: 11, background: '#f0f8f0', color: '#1f514c', borderRadius: 4, padding: '2px 6px', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#636363', fontWeight: 600, marginBottom: 4 }}>KEY FIELDS</div>
                  <div style={{ fontSize: 12, color: '#141414' }}>{src.fields.slice(0, 4).join(', ')}{src.fields.length > 4 ? '…' : ''}</div>
                </div>
              </div>
              {src.missing.length > 0 && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef9f0', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: '#a16207', fontWeight: 600 }}>GAPS: </span>
                  <span style={{ fontSize: 11, color: '#92400e' }}>{src.missing.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended next steps */}
      <div>
        <h2
          style={{
            fontFamily: '"Hedvig Letters Serif", Georgia, serif',
            fontSize: 26,
            fontWeight: 400,
            color: TEAL,
            margin: '0 0 20px',
            letterSpacing: '-0.02em',
          }}
        >
          Recommended Next Steps
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {NEXT_STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '20px 24px',
                border: '1px solid rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${step.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: step.priority === 'High' ? '#fee2e2' : step.priority === 'Medium' ? '#fef9c3' : '#f0fdf4',
                      color: step.priority === 'High' ? '#b91c1c' : step.priority === 'Medium' ? '#a16207' : '#15803d',
                    }}>
                      {step.priority.toUpperCase()} PRIORITY
                    </span>
                    <span style={{ fontSize: 10, color: '#636363', background: '#f5f5f5', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                      {step.category}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#141414' }}>{step.title}</h4>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#636363' }}>Effort</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#141414' }}>{step.effort}</div>
                </div>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#636363', lineHeight: 1.6 }}>{step.description}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, flexShrink: 0, marginTop: 1 }}>IMPACT:</span>
                <span style={{ fontSize: 12, color: '#141414' }}>{step.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
