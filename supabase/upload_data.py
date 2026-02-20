#!/usr/bin/env python3
"""
T3A Data Explorer - Supabase Data Upload Script
================================================
Reads firms_master.parquet and uploads to Supabase in batches.

Usage:
    pip install supabase pandas pyarrow python-dotenv
    python supabase/upload_data.py

Requires environment variables in .env:
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key

The script uploads in batches of 500 rows and handles upserts
(safe to run multiple times - will update existing records).
"""

import os
import json
import math
from pathlib import Path
from dotenv import load_dotenv

import pandas as pd
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

PARQUET_PATH = Path(__file__).parent.parent.parent / "accounting-firm-explorer" / "data" / "merged" / "firms_master.parquet"
BATCH_SIZE = 500


def clean_value(v):
    """Convert pandas/numpy types to JSON-serializable Python types."""
    if pd.isna(v):
        return None
    if isinstance(v, bool):
        return bool(v)
    if hasattr(v, 'item'):  # numpy scalar
        return v.item()
    if isinstance(v, (dict, list)):
        return json.dumps(v) if not isinstance(v, str) else v
    if hasattr(v, 'isoformat'):  # datetime
        return v.isoformat()
    return v


def prepare_row(row: dict) -> dict:
    """Prepare a DataFrame row for Supabase insertion."""
    # Fields to include in the upload
    include = {
        'firm_id', 'firm_name', 'city', 'state', 'full_address', 'zip_code',
        'phone', 'website', 'email',
        'annual_revenue', 'estimated_revenue', 'revenue_confidence', 'asking_price',
        'employee_count', 'estimated_employee_count', 'employee_count_confidence',
        'for_sale', 'sale_status', 'broker_name', 'listing_notes',
        'google_rating', 'google_review_count',
        'credentials', 'year_established', 'software',
        'latitude', 'longitude',
        'sources', 'source',
        'client_segment', 'client_segment_confidence', 'wealth_mgmt_potential',
        'primary_service', 'classification_signals',
        'acquisition_tier', 'acquisition_score',
        'first_seen', 'last_updated',
    }

    cleaned = {}
    for k, v in row.items():
        if k not in include:
            continue
        cv = clean_value(v)

        # Handle for_sale: convert string 'True'/'False' to bool
        if k == 'for_sale':
            if cv is None:
                pass
            elif isinstance(cv, str):
                cv = cv.lower() == 'true'
            else:
                cv = bool(cv)

        # Handle latitude/longitude: skip if zero or string
        if k in ('latitude', 'longitude'):
            try:
                fv = float(cv) if cv is not None else None
                cv = fv if fv and fv != 0.0 else None
            except (ValueError, TypeError):
                cv = None

        cleaned[k] = cv

    return cleaned


def upload(supabase: Client, df: pd.DataFrame):
    """Upload DataFrame to Supabase in batches."""
    total = len(df)
    n_batches = math.ceil(total / BATCH_SIZE)
    print(f"Uploading {total:,} rows in {n_batches} batches of {BATCH_SIZE}…\n")

    success = 0
    errors = 0

    for i in range(n_batches):
        batch_df = df.iloc[i * BATCH_SIZE:(i + 1) * BATCH_SIZE]
        rows = [prepare_row(row) for row in batch_df.to_dict(orient='records')]

        try:
            result = supabase.table('firms').upsert(rows, on_conflict='firm_id').execute()
            success += len(rows)
            print(f"  Batch {i+1}/{n_batches}: {len(rows)} rows ✓ ({success:,} total)")
        except Exception as e:
            errors += len(rows)
            print(f"  Batch {i+1}/{n_batches}: ERROR — {e}")

    print(f"\n✅ Upload complete: {success:,} rows succeeded, {errors:,} errors")


def main():
    if not PARQUET_PATH.exists():
        print(f"ERROR: Parquet file not found at {PARQUET_PATH}")
        print("Run the pipeline first: python run_pipeline.py --merge-only")
        return

    print(f"Loading {PARQUET_PATH.name}…")
    df = pd.read_parquet(PARQUET_PATH)
    print(f"Loaded {len(df):,} rows, {len(df.columns)} columns\n")

    print(f"Connecting to Supabase: {SUPABASE_URL[:40]}…")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    upload(supabase, df)


if __name__ == "__main__":
    main()
