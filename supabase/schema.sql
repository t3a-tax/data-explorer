-- T3A Data Explorer - Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database

-- ============================================================
-- FIRMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.firms (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id                   TEXT UNIQUE,
  firm_name                 TEXT NOT NULL,
  city                      TEXT,
  state                     TEXT,
  full_address              TEXT,
  zip_code                  TEXT,
  phone                     TEXT,
  website                   TEXT,
  email                     TEXT,

  -- Revenue & Financial
  annual_revenue            NUMERIC,
  estimated_revenue         NUMERIC,
  revenue_confidence        TEXT,
  asking_price              NUMERIC,

  -- Employees
  employee_count            NUMERIC,
  estimated_employee_count  NUMERIC,
  employee_count_confidence TEXT,

  -- For Sale / M&A
  for_sale                  BOOLEAN,
  sale_status               TEXT,
  broker_name               TEXT,
  listing_notes             TEXT,

  -- Google data
  google_rating             NUMERIC,
  google_review_count       NUMERIC,

  -- Professional
  credentials               TEXT,
  year_established          NUMERIC,
  software                  TEXT,

  -- Geographic
  latitude                  NUMERIC,
  longitude                 NUMERIC,

  -- Pipeline enrichment
  sources                   TEXT,
  source                    TEXT,
  client_segment            TEXT,
  client_segment_confidence TEXT,
  wealth_mgmt_potential     INTEGER,
  primary_service           TEXT,
  service_mix               TEXT,
  client_segments           TEXT,
  classification_signals    TEXT,

  -- Scoring
  acquisition_tier          TEXT,
  acquisition_score         NUMERIC,

  -- Financial metadata
  profit_margin_pct         NUMERIC,
  cash_flow_quality         TEXT,
  owner_hours_per_week      TEXT,

  -- Timestamps
  first_seen                TIMESTAMPTZ,
  last_updated              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_firms_state ON public.firms (state);
CREATE INDEX IF NOT EXISTS idx_firms_acquisition_tier ON public.firms (acquisition_tier);
CREATE INDEX IF NOT EXISTS idx_firms_acquisition_score ON public.firms (acquisition_score DESC);
CREATE INDEX IF NOT EXISTS idx_firms_client_segment ON public.firms (client_segment);
CREATE INDEX IF NOT EXISTS idx_firms_for_sale ON public.firms (for_sale) WHERE for_sale = true;
CREATE INDEX IF NOT EXISTS idx_firms_estimated_revenue ON public.firms (estimated_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_firms_firm_name ON public.firms USING gin (to_tsvector('english', firm_name));

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all firms
CREATE POLICY "Authenticated users can view firms"
  ON public.firms
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete (data uploads use service key)
CREATE POLICY "Service role can manage firms"
  ON public.firms
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- DASHBOARD STATS FUNCTION (for fast aggregates)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM public.firms),
    'for_sale', (SELECT COUNT(*) FROM public.firms WHERE for_sale = true),
    'states', (SELECT COUNT(DISTINCT state) FROM public.firms),
    'avg_score', (SELECT ROUND(AVG(acquisition_score)::numeric, 1) FROM public.firms WHERE acquisition_score IS NOT NULL),
    'tier_counts', (
      SELECT json_object_agg(acquisition_tier, cnt)
      FROM (
        SELECT acquisition_tier, COUNT(*) as cnt
        FROM public.firms
        WHERE acquisition_tier IS NOT NULL
        GROUP BY acquisition_tier
      ) t
    ),
    'state_counts', (
      SELECT json_object_agg(state, cnt)
      FROM (
        SELECT state, COUNT(*) as cnt
        FROM public.firms
        WHERE state IS NOT NULL
        GROUP BY state
        ORDER BY cnt DESC
      ) t
    )
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE public.firms IS 'T3A accounting firm acquisition intelligence dataset. 135K+ firms across 9 southern US states.';
COMMENT ON COLUMN public.firms.acquisition_score IS 'Proprietary acquisition score 0-100. Base 40, bonuses for data richness.';
COMMENT ON COLUMN public.firms.acquisition_tier IS 'A (80+), B (60-79), C (40-59), D (<40)';
COMMENT ON COLUMN public.firms.estimated_revenue IS 'Estimated revenue from pipeline. 100% coverage but low confidence for most firms.';
COMMENT ON COLUMN public.firms.sources IS 'Comma-separated list of data sources that contributed data for this firm.';
