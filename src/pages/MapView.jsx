import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { supabase } from '../lib/supabase'

const TEAL = '#1f514c'

const STATE_CENTERS = {
  AL: [32.806671, -86.791130],
  FL: [27.994402, -81.760254],
  GA: [33.040619, -83.643074],
  LA: [31.169960, -91.867805],
  MS: [32.741646, -89.678696],
  NC: [35.630066, -79.806419],
  SC: [33.856892, -80.945007],
  TN: [35.747845, -86.692345],
  TX: [31.968599, -99.901810],
}

const STATE_NAMES = {
  AL: 'Alabama', FL: 'Florida', GA: 'Georgia', LA: 'Louisiana',
  MS: 'Mississippi', NC: 'North Carolina', SC: 'South Carolina',
  TN: 'Tennessee', TX: 'Texas',
}

const TIER_COLORS = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#dc2626' }

function getTierColor(tier) {
  return TIER_COLORS[tier] || '#636363'
}

export default function MapView() {
  const [stateStats, setStateStats] = useState([])
  const [geocodedFirms, setGeocodedFirms] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('state') // 'state' | 'firm'

  useEffect(() => {
    loadMapData()
  }, [])

  async function loadMapData() {
    setLoading(true)
    try {
      // State-level aggregates
      const { data: stateData } = await supabase.from('firms').select('state')
      const counts = {}
      stateData?.forEach(r => { counts[r.state] = (counts[r.state] || 0) + 1 })
      setStateStats(
        Object.entries(counts).map(([state, count]) => ({
          state,
          name: STATE_NAMES[state] || state,
          count,
          center: STATE_CENTERS[state],
        }))
      )

      // Geocoded firms (only those with lat/lng)
      const { data: geoData } = await supabase
        .from('firms')
        .select('firm_id,firm_name,city,state,latitude,longitude,acquisition_tier,acquisition_score,phone,estimated_revenue')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(2000)
      setGeocodedFirms(geoData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const maxCount = Math.max(...stateStats.map(s => s.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            Geographic Distribution
          </h1>
          <p style={{ color: '#636363', marginTop: 6, marginBottom: 0, fontSize: 14 }}>
            Firm locations across 9 southern US states
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['state', 'firm'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                background: viewMode === mode ? TEAL : 'white',
                color: viewMode === mode ? 'white' : '#141414',
                border: '1px solid ' + (viewMode === mode ? TEAL : '#e5e7eb'),
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {mode === 'state' ? 'By State' : 'By Firm'}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ height: 560, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafa' }}>
            <span style={{ color: TEAL }}>Loading map data…</span>
          </div>
        ) : (
          <MapContainer
            center={[32.5, -88]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {viewMode === 'state' && stateStats.map(({ state, name, count, center }) => {
              if (!center) return null
              const radius = 10 + (count / maxCount) * 40
              return (
                <CircleMarker
                  key={state}
                  center={center}
                  radius={radius}
                  pathOptions={{
                    fillColor: TEAL,
                    color: TEAL,
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.5,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: '"Inter", sans-serif', minWidth: 140 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{name}</div>
                      <div style={{ color: '#636363', fontSize: 13 }}>{count.toLocaleString()} firms</div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}

            {viewMode === 'firm' && geocodedFirms.map((firm) => {
              const lat = parseFloat(firm.latitude)
              const lng = parseFloat(firm.longitude)
              if (isNaN(lat) || isNaN(lng)) return null
              return (
                <CircleMarker
                  key={firm.firm_id}
                  center={[lat, lng]}
                  radius={6}
                  pathOptions={{
                    fillColor: getTierColor(firm.acquisition_tier),
                    color: 'white',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: '"Inter", sans-serif', minWidth: 160 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{firm.firm_name}</div>
                      <div style={{ color: '#636363', fontSize: 12 }}>{firm.city}, {firm.state}</div>
                      {firm.acquisition_tier && (
                        <div style={{ fontSize: 12, marginTop: 4 }}>Tier {firm.acquisition_tier} · Score {Math.round(firm.acquisition_score || 0)}</div>
                      )}
                      {firm.phone && <div style={{ fontSize: 12, marginTop: 2, color: '#636363' }}>{firm.phone}</div>}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>

      {/* State stats grid */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#141414', marginBottom: 16 }}>State Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {stateStats.sort((a, b) => b.count - a.count).map(({ state, name, count }) => (
            <div
              key={state}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '16px 20px',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: TEAL }}>{state}</div>
              <div style={{ fontSize: 12, color: '#636363', marginTop: 2 }}>{name}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#141414', marginTop: 8 }}>
                {count.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#636363' }}>firms</div>
              <div style={{ marginTop: 10, height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                <div
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    height: '100%',
                    background: TEAL,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewMode === 'firm' && geocodedFirms.length === 0 && (
        <div style={{ background: '#fef9c3', borderRadius: 12, padding: '16px 20px', color: '#a16207', fontSize: 14 }}>
          No geocoded firm data available. The geocoding pipeline needs to be run to populate latitude/longitude coordinates.
        </div>
      )}
    </div>
  )
}
