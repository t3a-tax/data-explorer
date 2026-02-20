const TEAL = '#1f514c'

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

function DetailRow({ label, value, href }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ fontSize: 12, color: '#636363', fontWeight: 500, minWidth: 140, flexShrink: 0 }}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: TEAL, wordBreak: 'break-all' }}>
          {String(value)}
        </a>
      ) : (
        <span style={{ fontSize: 13, color: '#141414', wordBreak: 'break-all' }}>{String(value)}</span>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#636363', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function FirmModal({ firm, onClose }) {
  const tierColors = TIER_COLORS[firm.acquisition_tier] || { bg: '#f0f0f0', text: '#555' }
  const revenue = firm.annual_revenue || firm.estimated_revenue
  const revenueLabel = firm.annual_revenue ? 'Annual Revenue' : 'Est. Revenue'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 24,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ background: TEAL, padding: '24px 28px', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              color: 'white',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>

          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 }}>
            {[firm.city, firm.state].filter(Boolean).join(', ')}
          </div>
          <h2 style={{ margin: '0 0 12px', color: 'white', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', paddingRight: 40 }}>
            {firm.firm_name || 'Unknown Firm'}
          </h2>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {firm.acquisition_tier && (
              <span style={{ background: tierColors.bg, color: tierColors.text, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                Tier {firm.acquisition_tier}
              </span>
            )}
            {firm.acquisition_score != null && (
              <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                Score: {Math.round(firm.acquisition_score)}
              </span>
            )}
            {firm.for_sale && (
              <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                For Sale
              </span>
            )}
            {firm.client_segment && (
              <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>
                {SEGMENT_LABELS[firm.client_segment] || firm.client_segment}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Section title="Contact Info">
              <DetailRow label="Address" value={firm.full_address || [firm.city, firm.state, firm.zip_code].filter(Boolean).join(', ')} />
              <DetailRow label="Phone" value={firm.phone} />
              <DetailRow label="Website" value={firm.website} href={firm.website} />
              <DetailRow label="Email" value={firm.email} />
            </Section>

            <Section title="Financial">
              <DetailRow label={revenueLabel} value={revenue ? `$${revenue.toLocaleString()}` : null} />
              <DetailRow label="Revenue Confidence" value={firm.revenue_confidence} />
              <DetailRow label="Asking Price" value={firm.asking_price ? `$${firm.asking_price.toLocaleString()}` : null} />
              <DetailRow label="Est. Employees" value={firm.estimated_employee_count || firm.employee_count} />
              <DetailRow label="Employee Confidence" value={firm.employee_count_confidence} />
              <DetailRow label="Wealth Mgmt Potential" value={firm.wealth_mgmt_potential != null ? `${firm.wealth_mgmt_potential}/100` : null} />
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Section title="Business Details">
              <DetailRow label="Credentials" value={firm.credentials} />
              <DetailRow label="Primary Service" value={firm.primary_service} />
              <DetailRow label="Software" value={firm.software} />
              <DetailRow label="Year Established" value={firm.year_established} />
              <DetailRow label="Google Rating" value={firm.google_rating ? `${firm.google_rating} ★ (${firm.google_review_count?.toLocaleString()} reviews)` : null} />
            </Section>

            <Section title="M&A Info">
              <DetailRow label="Sale Status" value={firm.sale_status} />
              <DetailRow label="Broker" value={firm.broker_name} />
              <DetailRow label="Client Segment" value={SEGMENT_LABELS[firm.client_segment] || firm.client_segment} />
              <DetailRow label="Segment Confidence" value={firm.client_segment_confidence} />
              <DetailRow label="Data Sources" value={firm.sources} />
            </Section>
          </div>

          {firm.listing_notes && (
            <Section title="Listing Notes">
              <div style={{ fontSize: 13, color: '#141414', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#fafafa', borderRadius: 10, padding: '12px 14px' }}>
                {firm.listing_notes}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
