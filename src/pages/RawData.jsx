import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

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

// Columns that use numeric (gte) filtering instead of ilike
const NUMERIC_COLS = new Set(['annual_revenue', 'asking_price', 'acquisition_score', 'google_rating', 'google_review_count'])

// Columns that should not be sortable
const UNSORTABLE_COLS = new Set(['listing_notes', 'full_address', 'credentials'])

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

export default function RawData() {
  const [activeSource, setActiveSource] = useState(SOURCES[0])
  const [selectedState, setSelectedState] = useState('ALL')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(null)
  const [sortCol, setSortCol] = useState('acquisition_score')
  const [sortDir, setSortDir] = useState('desc')
  const [filters, setFilters] = useState({})
  const filterTimers = useRef({})

  const applyFilters = (q, filt) => {
    for (const [col, val] of Object.entries(filt)) {
      if (val === '' || val === null || val === undefined) continue
      if (NUMERIC_COLS.has(col)) {
        const num = parseFloat(val)
        if (!isNaN(num)) q = q.gte(col, num)
      } else {
        q = q.ilike(col, `%${val}%`)
      }
    }
    return q
  }

  const fetchData = useCallback(async (src, state, pg, sCol, sDir, filt) => {
    setLoading(true)
    try {
      let q = supabase
        .from('firms')
        .select(src.columns.join(','), { count: 'exact' })
        .or(`sources.ilike.%${src.key}%`)
        .range(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE - 1)
        .order(sCol, { ascending: sDir === 'asc' })

      if (state !== 'ALL') q = q.eq('state', state)
      q = applyFilters(q, filt)

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

  // Reset everything when source or state changes
  useEffect(() => {
    const newSort = 'acquisition_score'
    const newDir = 'desc'
    const newFilters = {}
    setPage(0)
    setSortCol(newSort)
    setSortDir(newDir)
    setFilters(newFilters)
    fetchData(activeSource, selectedState, 0, newSort, newDir, newFilters)
  }, [activeSource, selectedState])

  const handleSort = (col) => {
    if (UNSORTABLE_COLS.has(col)) return
    const newDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'
    setSortCol(col)
    setSortDir(newDir)
    setPage(0)
    fetchData(activeSource, selectedState, 0, col, newDir, filters)
  }

  const handleFilter = (col, val) => {
    const newFilters = { ...filters, [col]: val }
    setFilters(newFilters)
    clearTimeout(filterTimers.current[col])
    filterTimers.current[col] = setTimeout(() => {
      setPage(0)
      fetchData(activeSource, selectedState, 0, sortCol, sortDir, newFilters)
    }, 400)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchData(activeSource, selectedState, newPage, sortCol, sortDir, filters)
  }

  const handleExport = async () => {
    setExporting(true)
    setExportProgress('Fetching rows…')
    try {
      const allRows = []
      let pg = 0
      const batchSize = 1000

      while (true) {
        let q = supabase
          .from('firms')
          .select('*')
          .or(`sources.ilike.%${activeSource.key}%`)
          .order(sortCol, { ascending: sortDir === 'asc' })
          .range(pg * batchSize, (pg + 1) * batchSize - 1)

        if (selectedState !== 'ALL') q = q.eq('state', selectedState)
        q = applyFilters(q, filters)

        const { data, error } = await q
        if (error) throw error
        if (!data || data.length === 0) break
        allRows.push(...data)
        setExportProgress(`Fetched ${allRows.length.toLocaleString()} rows…`)
        if (data.length < batchSize) break
        pg++
      }

      setExportProgress('Building Excel file…')

      const ws = XLSX.utils.json_to_sheet(allRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, activeSource.label.slice(0, 31))
      const stateSuffix = selectedState !== 'ALL' ? `_${selectedState}` : ''
      XLSX.writeFile(wb, `t3a_${activeSource.key}${stateSuffix}.xlsx`)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
      setExportProgress(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const sortIndicator = (col) => {
    if (UNSORTABLE_COLS.has(col)) return null
    if (sortCol !== col) return <span style={{ color: 'rgba(99,99,99,0.35)', marginLeft: 4 }}>↕</span>
    return <span style={{ color: TEAL, marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length

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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Active filters badge */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                const cleared = {}
                setFilters(cleared)
                setPage(0)
                fetchData(activeSource, selectedState, 0, sortCol, sortDir, cleared)
              }}
              style={{
                height: 38, background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10,
                padding: '0 14px', fontSize: 13, cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active · clear
            </button>
          )}

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
              whiteSpace: 'nowrap',
            }}
          >
            {exporting ? (exportProgress || 'Exporting…') : `↓ Export Excel`}
          </button>
        </div>
      </div>

      {/* Row count */}
      <div style={{ fontSize: 13, color: '#636363' }}>
        {loading
          ? 'Loading…'
          : `${total.toLocaleString()} rows ${selectedState !== 'ALL' ? `in ${selectedState}` : 'across all states'}${activeFiltersCount > 0 ? ' (filtered)' : ''} · showing ${total === 0 ? 0 : page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total).toLocaleString()}`
        }
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
              {/* Column header row — sortable */}
              <tr style={{ background: '#f8fafa', borderBottom: '1px solid #ececec' }}>
                {activeSource.columns.map(col => {
                  const sortable = !UNSORTABLE_COLS.has(col)
                  return (
                    <th key={col}
                      onClick={() => sortable && handleSort(col)}
                      style={{
                        padding: '12px 16px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, color: sortable ? '#444' : '#636363',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap', userSelect: 'none',
                        cursor: sortable ? 'pointer' : 'default',
                      }}
                    >
                      {COL_LABELS[col] || col}
                      {sortIndicator(col)}
                    </th>
                  )
                })}
              </tr>
              {/* Filter input row */}
              <tr style={{ background: '#fcfcfc', borderBottom: '2px solid #e8e8e8' }}>
                {activeSource.columns.map(col => (
                  <th key={col} style={{ padding: '6px 10px' }}>
                    <input
                      type={NUMERIC_COLS.has(col) ? 'number' : 'text'}
                      value={filters[col] || ''}
                      onChange={e => handleFilter(col, e.target.value)}
                      placeholder={NUMERIC_COLS.has(col) ? 'min' : 'filter…'}
                      style={{
                        width: '100%', minWidth: col === 'firm_name' ? 120 : col === 'state' ? 40 : 60,
                        padding: '5px 8px', fontSize: 12,
                        border: filters[col] ? `1px solid ${TEAL}` : '1px solid #e0e0e0',
                        borderRadius: 6, outline: 'none', fontFamily: '"Inter", sans-serif',
                        background: filters[col] ? '#f0f8f7' : 'white',
                        color: '#141414', boxSizing: 'border-box',
                      }}
                    />
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
                      whiteSpace: 'nowrap',
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
          <button onClick={() => handlePageChange(0)}
            disabled={page === 0} style={pgBtn(page === 0)}>«</button>
          <button onClick={() => handlePageChange(page - 1)}
            disabled={page === 0} style={pgBtn(page === 0)}>‹ Prev</button>
          <span style={{ fontSize: 13, color: '#636363', padding: '0 8px' }}>
            Page {page + 1} of {totalPages.toLocaleString()}
          </span>
          <button onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1} style={pgBtn(page >= totalPages - 1)}>Next ›</button>
          <button onClick={() => handlePageChange(totalPages - 1)}
            disabled={page >= totalPages - 1} style={pgBtn(page >= totalPages - 1)}>»</button>
        </div>
      )}

      {/* Export note */}
      <div style={{ background: '#f0f8f0', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#2a6b64' }}>
        <strong>Export note:</strong> Excel exports all rows and all columns for the selected source and active filters. Any column filters and state selection applied above are reflected in the export.
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
