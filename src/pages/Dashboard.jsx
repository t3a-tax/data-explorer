import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const TEAL = '#1f514c'
const TEAL_LIGHT = '#35857d'

const TIER_COLORS = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#dc2626' }
const SOURCE_COLORS = ['#1f514c', '#35857d', '#2563eb', '#7c3aed', '#d97706', '#dc2626']

const SOURCE_LABELS = {
  cpadirectory: 'CPA Directory',
  state_cpa_boards: 'State CPA Boards',
  google_maps: 'Google Maps',
  google_maps_detail: 'Google Maps Detail',
  accounting_practice_exchange: 'Practice Exchange',
  secretary_of_state: 'Secretary of State',
}

const STATE_NAMES = {
  AL: 'Alabama', FL: 'Florida', GA: 'Georgia', LA: 'Louisiana',
  MS: 'Mississippi', NC: 'North Carolina', SC: 'South Carolina',
  TN: 'Tennessee', TX: 'Texas',
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 20,
        padding: '20px 24px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: 12, color: '#636363', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || TEAL, letterSpacing: '-0.03em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#636363', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      // Fetch aggregate counts
      const [
        { count: total },
        { count: forSaleCount },
        stateResult,
        tierResult,
        sourceSample,
        scoreResult,
        wealthResult,
      ] = await Promise.all([
        supabase.from('firms').select('*', { count: 'exact', head: true }),
        supabase.from('firms').select('*', { count: 'exact', head: true }).eq('for_sale', true),
        supabase.from('firms').select('state'),
        supabase.from('firms').select('acquisition_tier'),
        supabase.from('firms').select('sources').limit(5000),
        supabase.from('firms').select('acquisition_score').not('acquisition_score', 'is', null).limit(10000),
        supabase.from('firms').select('wealth_mgmt_potential').not('wealth_mgmt_potential', 'is', null).limit(10000),
      ])

      // State counts
      const stateCounts = {}
      stateResult.data?.forEach(r => {
        stateCounts[r.state] = (stateCounts[r.state] || 0) + 1
      })
      const stateData = Object.entries(stateCounts)
        .map(([state, count]) => ({ state, name: STATE_NAMES[state] || state, count }))
        .sort((a, b) => b.count - a.count)

      // Tier counts
      const tierCounts = {}
      tierResult.data?.forEach(r => {
        if (r.acquisition_tier) tierCounts[r.acquisition_tier] = (tierCounts[r.acquisition_tier] || 0) + 1
      })
      const tierData = Object.entries(tierCounts)
        .map(([tier, count]) => ({ tier, count }))
        .sort((a, b) => a.tier.localeCompare(b.tier))

      // Source counts
      const srcCounts = {}
      sourceSample.data?.forEach(r => {
        if (r.sources) {
          r.sources.split(', ').forEach(s => {
            const src = s.trim()
            if (src) srcCounts[src] = (srcCounts[src] || 0) + 1
          })
        }
      })
      const sourceData = Object.entries(srcCounts)
        .map(([src, count]) => ({ name: SOURCE_LABELS[src] || src, count }))
        .sort((a, b) => b.count - a.count)

      // Avg score
      const scores = scoreResult.data?.map(r => r.acquisition_score) || []
      const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A'

      // High wealth
      const highWealth = wealthResult.data?.filter(r => r.wealth_mgmt_potential >= 70).length || 0

      setStats({ total, forSaleCount, stateData, tierData, sourceData, avgScore, highWealth })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ color: TEAL, fontSize: 16 }}>Loading dashboard…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: '"Hedvig Letters Serif", Georgia, serif',
            fontSize: 36,
            fontWeight: 400,
            color: TEAL,
            margin: 0,
            letterSpacing: '-0.03em',
          }}
        >
          Acquisition Intelligence
        </h1>
        <p style={{ color: '#636363', marginTop: 8, marginBottom: 0, fontSize: 15 }}>
          Overview of {stats?.total?.toLocaleString()} accounting firms across 9 southern US states
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <MetricCard label="Total Firms" value={stats?.total?.toLocaleString() || '—'} />
        <MetricCard label="For Sale" value={stats?.forSaleCount?.toLocaleString() || '—'} color="#16a34a" />
        <MetricCard label="States Covered" value="9" sub="AL, FL, GA, LA, MS, NC, SC, TN, TX" />
        <MetricCard label="Avg Acq. Score" value={stats?.avgScore || '—'} sub="out of 100" />
        <MetricCard label="High Wealth Potential" value={stats?.highWealth?.toLocaleString() || '—'} sub="score ≥ 70" color="#7c3aed" />
        <MetricCard label="Data Sources" value="6" sub="Active pipelines" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Firms by state */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            padding: '24px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#141414' }}>
            Firms by State
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.stateData || []} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="state" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v.toLocaleString()} />
              <Tooltip
                formatter={(v) => [v.toLocaleString(), 'Firms']}
                labelFormatter={(l) => STATE_NAMES[l] || l}
              />
              <Bar dataKey="count" fill={TEAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Acquisition tier distribution */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            padding: '24px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#141414' }}>
            Acquisition Tier Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats?.tierData || []}
                dataKey="count"
                nameKey="tier"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ tier, percent }) => `${tier} (${(percent * 100).toFixed(0)}%)`}
              >
                {stats?.tierData?.map((entry) => (
                  <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || TEAL} />
                ))}
              </Pie>
              <Legend formatter={(v) => `Tier ${v}`} />
              <Tooltip formatter={(v) => [v.toLocaleString(), 'Firms']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data source coverage */}
      <div
        style={{
          background: 'white',
          borderRadius: 24,
          padding: '24px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#141414' }}>
          Data Source Coverage
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={stats?.sourceData || []}
            layout="vertical"
            margin={{ left: 20, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => v.toLocaleString()} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
            <Tooltip formatter={(v) => [v.toLocaleString(), 'Firms']} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {stats?.sourceData?.map((_, i) => (
                <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick insight cards */}
      <div
        style={{
          background: '#1f514c',
          borderRadius: 24,
          padding: '32px',
          color: 'white',
        }}
      >
        <h3
          style={{
            fontFamily: '"Hedvig Letters Serif", Georgia, serif',
            fontSize: 22,
            fontWeight: 400,
            margin: '0 0 20px',
            letterSpacing: '-0.02em',
          }}
        >
          Pipeline Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { source: 'CPA Directory', states: 9, status: 'Complete', color: '#4ade80' },
            { source: 'State CPA Boards', states: 3, status: 'Partial (AL, FL, TN)', color: '#fbbf24' },
            { source: 'Google Maps', states: 9, status: 'Complete', color: '#4ade80' },
            { source: 'Google Maps Detail', states: 7, status: 'Partial (no LA, TX)', color: '#fbbf24' },
            { source: 'Practice Exchange', states: 9, status: 'Complete', color: '#4ade80' },
            { source: 'Secretary of State', states: 1, status: 'SC only', color: '#f87171' },
          ].map(({ source, states, status, color }) => (
            <div
              key={source}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '16px 20px',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{source}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                {states} state{states !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 12, color }}>{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
