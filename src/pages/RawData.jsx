import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const TEAL = '#1f514c'
const PAGE_SIZE = 100

const SOURCES = [
  {
    key: 'cpadirectory',
    label: 'CPA Directory',
    description: '83,488 firms — name & location from CPAdirectory.com',
    columns: ['firm_name', 'city', 'state', 'zip_code', 'credentials', 'acquisition_tier', 'acquisition_score'],
  },
  {
    key: 'state_cpa_boards',
    label: 'State CPA Boards',
    description: '45,628 firms — licensed CPAs from AL, FL, TN boards',
    columns: ['firm_name', 'city', 'state', 'credentials', 'acquisition_tier', 'acquisition_score'],
  },
  {
    key: 'google_maps',
    label: 'Google Maps',
    description: '7,525 firms — address, phone, website, ratings',
    columns: ['firm_name', 'city', 'state', 'full_address', 'phone', 'website', 'google_rating', 'google_review_count', 'acquisition_tier', 'acquisition_score'],
  },
  {
    key: 'google_maps_detail',
    label: 'Google Maps Detail',
    description: '7,525 firms — extended detail for AL, FL, GA, MS, NC, SC, TN',
    columns: ['firm_name', 'city', 'state', 'full_address', 'phone', 'website', 'google_rating', 'google_review_count', 'acquisition_tier', 'acquisition_score'],
  },
  {
    key: 'accounting_practice_exchange',
    label: 'Practice Exchange',
    description: '285 firms — active M&A listings with revenue & broker data',
    columns: ['firm_name', 'city', 'state', 'annual_revenue', 'asking_price', 'sale_status', 'broker_name', 'listing_notes', 'acquisition_tier', 'acquisition_score'],
  },
  {
    key: 'accounting_practice_sales',
    label: 'APS Listings',
    description: '53 firms — live for-sale listings from accountingpracticesales.com',
    columns: ['firm_name', 'state', 'annual_revenue', 'asking_price', 'sale_status', 'broker_name', 'credentials', 'acquisition_tier', 'acquisition_score'],
  },
  {
    key: 'secretary_of_state',
    label: 'Secretary of State',
    description: '3 firms — SC business entity registrations',
    columns: ['firm_name', 'city', 'state', 'full_address', 'acquisition_tier', 'acquisition_score'],
  },
]

const STATES = ['AL', 'FL', 'GA', 'LA', 'MS', 'NC', 'SC', 'TN', 'TX']

const COL_LABELS = {
  firm_name: 'Firm Name',
  city: 'City',
  state: 'State',
  zip_code: 'Zip',
  full_address: 'Address',
  phone: 'Phone',
  website: 'Website',
  google_rating: 'Rating',
  google_review_count: 'Reviews',
  credentials: 'Credentials',
  annual_revenue: 'Annual Revenue',
  asking_price: 'Asking Price',
  sale_status: 'Sale Status',
  broker_name: 'Broker',
  listing_notes: 'Notes',
  acquisition_tier: 'Tier',
  acquisition_score: 'Score',
}

function formatValue(col, val) {
  if (val === null || val === undefined || val === '') return '—'
  if (col === 'annual_revenue' || col === 'asking_price') {
    return `$${Number(val).toLocaleString()}`
  }
  if (col === 'acquisition_score') return Math.round(val)
  if (col === 'google_rating') return `${val} ★`
  if (col === 'website') {
    return (
      <a href={val} target="_blank" rel="noopener noreferrer"
        style={{ color: TEAL, textDecoration: 'none', fontSize: 12 }}
        onClick={e => e.stopPropagation()}>
        {String(val).replace(/^https?:\/\//, '').slice(0, 30)}
      </a>
    )
  }
  if (col === 'listing_notes') {
    return <span title={val} style={{ cursor: 'help' }}>{String(val).slice(0, 60)}{val.length > 60 ? '…' : ''}</span>
  }
  return String(val)
}

function downloadCSV(data, columns, filename) {
  const header = columns.map(c => COL_LABELS[c] || c).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const v = row[c]
      if (v === null || v === undefined) return ''
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function RawData() {
  const [activeSource, setActiveSource] = useState(SOURCES[0])
  const [selectedState, setSelectedState] = useState('ALL')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async (src, state, pg) => {
    setLoading(true)
    try {
      let q = supabase
        .from('firms')
        .select(src.columns.join(','), { count: 'exact' })
        .or(`sources.ilike.%${src.key}%`)
        .range(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE - 1)
        .order('acquisition_score', { ascending: false })

      if (state !== 'ALL') q = q.eq('state', state)

      const { data, count, error } = await q
      if (error) throw error
      setRows(data || [])
      setTotal(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    fetchData(activeSource, selectedState, 0)
  }, [activeSource, selectedState])

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch up to 10,000 rows for export
      let q = supabase
        .from('firms')
        .select(activeSource.columns.join(','))
        .or(`sources.ilike.%${activeSource.key}%`)
        .order('acquisition_score', { ascending: false })
        .limit(10000)

      if (selectedState !== 'ALL') q = q.eq('state', selectedState)

      const { data } = await q
      if (data) {
        const stateSuffix = selectedState !== 'ALL' ? `_${selectedState}` : ''
        downloadCSV(data, activeSource.columns, `t3a_${activeSource.key}${stateSuffix}.csv`)
      }
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{
          fontFamily: '"Hedvig Letters Serif", Georgia, serif',
          fontSize: 32, fontWeight: 400, color: TEAL, margin: 0, letterSpacing: '-0.03em',
        }}>
          Raw Data Explorer
        </h1>
        <p style={{ color: '#636363', marginTop: 8, marginBottom: 0, fontSize: 15 }}>
          Browse and export data by source pipeline
        </p>
      </div>

      {/* Source tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SOURCES.map(src => (
          <button
            key={src.key}
            onClick={() => { setActiveSource(src); setSelectedState('ALL') }}
            style={{
              background: activeSource.key === src.key ? TEAL : 'white',
              color: activeSource.key === src.key ? 'white' : '#141414',
              border: '1px solid ' + (activeSource.key === src.key ? TEAL : '#e5e7eb'),
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: activeSource.key === src.key ? 600 : 400,
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {src.label}
          </button>
        ))}
      </div>

      {/* Active source info + controls */}
      <div style={{
        background: '#1f514c', borderRadius: 20, padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {activeSource.label}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {activeSource.description}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* State filter */}
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            style={{
              height: 38, background: 'rgba(255,255,255,0.12)', color: 'white',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
              padding: '0 12px', fontSize: 13, fontFamily: '"Inter", sans-serif',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="ALL" style={{ background: TEAL }}>All States</option>
            {STATES.map(s => (
              <option key={s} value={s} style={{ background: TEAL }}>{s}</option>
            ))}
          </select>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            style={{
              height: 38, background: 'white', color: TEAL,
              border: 'none', borderRadius: 10, padding: '0 18px',
              fontSize: 13, fontWeight: 600, cursor: exporting ? 'wait' : 'pointer',
              fontFamily: '"Inter", sans-serif', opacity: total === 0 ? 0.5 : 1,
            }}
          >
            {exporting ? 'Exporting…' : `↓ Export CSV`}
          </button>
        </div>
      </div>

      {/* Row count */}
      <div style={{ fontSize: 13, color: '#636363' }}>
        {loading ? 'Loading…' : `${total.toLocaleString()} rows ${selectedState !== 'ALL' ? `in ${selectedState}` : 'across all states'} · showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total).toLocaleString()}`}
      </div>

      {/* Table */}
      <div style={{
        background: 'white', borderRadius: 20,
        border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafa', borderBottom: '1px solid #f0f0f0' }}>
                {activeSource.columns.map(col => (
                  <th key={col} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#636363', textTransform: 'uppercase',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>
                    {COL_LABELS[col] || col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={activeSource.columns.length} style={{ padding: 40, textAlign: 'center', color: '#636363' }}>
                  Loading…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={activeSource.columns.length} style={{ padding: 40, textAlign: 'center', color: '#636363' }}>
                  No data for this selection.
                </td></tr>
              ) : rows.map((row, i) => (
                <tr key={i}
                  style={{ borderBottom: '1px solid #f5f5f5' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafa' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '' }}
                >
                  {activeSource.columns.map(col => (
                    <td key={col} style={{
                      padding: '10px 16px', color: '#141414',
                      maxWidth: col === 'listing_notes' ? 240 : col === 'firm_name' ? 220 : 'auto',
                      whiteSpace: col === 'listing_notes' || col === 'firm_name' ? 'nowrap' : 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {formatValue(col, row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => { setPage(0); fetchData(activeSource, selectedState, 0) }}
            disabled={page === 0} style={pgBtn(page === 0)}>«</button>
          <button onClick={() => { const p = page - 1; setPage(p); fetchData(activeSource, selectedState, p) }}
            disabled={page === 0} style={pgBtn(page === 0)}>‹ Prev</button>
          <span style={{ fontSize: 13, color: '#636363', padding: '0 8px' }}>
            Page {page + 1} of {totalPages.toLocaleString()}
          </span>
          <button onClick={() => { const p = page + 1; setPage(p); fetchData(activeSource, selectedState, p) }}
            disabled={page >= totalPages - 1} style={pgBtn(page >= totalPages - 1)}>Next ›</button>
          <button onClick={() => { const p = totalPages - 1; setPage(p); fetchData(activeSource, selectedState, p) }}
            disabled={page >= totalPages - 1} style={pgBtn(page >= totalPages - 1)}>»</button>
        </div>
      )}

      {/* Export note */}
      <div style={{ background: '#f0f8f0', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#2a6b64' }}>
        <strong>Export note:</strong> CSV exports up to 10,000 rows for the selected source and state filter. Open in Excel or Google Sheets. For full dataset exports, run the upload_data.py script and query Supabase directly.
      </div>
    </div>
  )
}

function pgBtn(disabled) {
  return {
    background: disabled ? '#f5f5f5' : 'white',
    border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '7px 14px', fontSize: 13,
    color: disabled ? '#ccc' : '#141414',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: '"Inter", sans-serif',
  }
}
