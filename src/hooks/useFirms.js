import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 50

export function useFirms(filters = {}) {
  const [firms, setFirms] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)

  const fetchFirms = useCallback(async (currentPage = 0) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('firms')
        .select('*', { count: 'exact' })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)
        .order('acquisition_score', { ascending: false })

      if (filters.states?.length) {
        query = query.in('state', filters.states)
      }
      if (filters.tiers?.length) {
        query = query.in('acquisition_tier', filters.tiers)
      }
      if (filters.sources?.length) {
        // sources is a comma-joined string field
        const sourceConditions = filters.sources.map(s => `sources.ilike.%${s}%`).join(',')
        query = query.or(sourceConditions)
      }
      if (filters.segments?.length) {
        query = query.in('client_segment', filters.segments)
      }
      if (filters.scoreMin !== undefined) {
        query = query.gte('acquisition_score', filters.scoreMin)
      }
      if (filters.scoreMax !== undefined) {
        query = query.lte('acquisition_score', filters.scoreMax)
      }
      if (filters.revenueMin !== undefined) {
        query = query.gte('estimated_revenue', filters.revenueMin)
      }
      if (filters.revenueMax !== undefined) {
        query = query.lte('estimated_revenue', filters.revenueMax)
      }
      if (filters.forSaleOnly) {
        query = query.eq('for_sale', true)
      }
      if (filters.search) {
        query = query.or(
          `firm_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
        )
      }

      const { data, error: err, count } = await query

      if (err) throw err
      setFirms(data || [])
      setTotal(count || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    setPage(0)
    fetchFirms(0)
  }, [JSON.stringify(filters)])

  const goToPage = (p) => {
    setPage(p)
    fetchFirms(p)
  }

  return { firms, total, loading, error, page, goToPage, pageSize: PAGE_SIZE }
}

export async function fetchStats() {
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  if (error) {
    // Fallback: manual aggregation
    const [stateData, tierData, sourceData, completenessData] = await Promise.all([
      supabase.from('firms').select('state').then(({ data }) => {
        const counts = {}
        data?.forEach(r => { counts[r.state] = (counts[r.state] || 0) + 1 })
        return counts
      }),
      supabase.from('firms').select('acquisition_tier').then(({ data }) => {
        const counts = {}
        data?.forEach(r => { counts[r.acquisition_tier] = (counts[r.acquisition_tier] || 0) + 1 })
        return counts
      }),
      supabase.from('firms').select('sources').then(({ data }) => {
        const counts = {}
        data?.forEach(r => {
          if (r.sources) {
            r.sources.split(', ').forEach(s => {
              const src = s.trim()
              if (src) counts[src] = (counts[src] || 0) + 1
            })
          }
        })
        return counts
      }),
      supabase.from('firms').select('count', { count: 'exact', head: true }).then(({ count }) => count),
    ])
    return { stateData, tierData, sourceData, total: completenessData }
  }
  return data
}

export async function fetchCompleteness() {
  const { count: total } = await supabase
    .from('firms')
    .select('*', { count: 'exact', head: true })

  const fields = [
    'firm_name', 'city', 'state', 'full_address', 'zip_code',
    'phone', 'website', 'email', 'annual_revenue', 'for_sale',
    'google_rating', 'google_review_count', 'credentials',
    'latitude', 'longitude', 'estimated_revenue', 'client_segment',
    'wealth_mgmt_potential', 'acquisition_score', 'acquisition_tier',
    'primary_service', 'employee_count', 'estimated_employee_count',
    'sale_status', 'broker_name', 'asking_price', 'software',
  ]

  const results = await Promise.all(
    fields.map(async (field) => {
      const { count } = await supabase
        .from('firms')
        .select('*', { count: 'exact', head: true })
        .not(field, 'is', null)
      return { field, count: count || 0, pct: total ? Math.round(((count || 0) / total) * 100) : 0 }
    })
  )

  return { total, fields: results }
}
