#!/usr/bin/env python3
"""
Create a test user in Supabase Auth for the T3A Data Explorer portal.

Usage:
    pip install supabase python-dotenv
    python supabase/create_test_user.py

Requires in .env:
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

TEST_USER_EMAIL = "explorer@t3a.tax"
TEST_USER_PASSWORD = "T3A-Explorer-2025!"


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    print(f"Creating test user: {TEST_USER_EMAIL}")
    try:
        result = supabase.auth.admin.create_user({
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "email_confirm": True,  # Skip email verification
            "user_metadata": {
                "full_name": "T3A Explorer (Test)",
                "role": "analyst",
            }
        })
        user = result.user
        print(f"\n✅ Test user created successfully!")
        print(f"   User ID: {user.id}")
        print(f"   Email:   {user.email}")
        print(f"   Status:  {user.email_confirmed_at is not None and 'confirmed' or 'unconfirmed'}")
        print(f"\n   Login credentials:")
        print(f"   Email:    {TEST_USER_EMAIL}")
        print(f"   Password: {TEST_USER_PASSWORD}")
        print(f"\n   ⚠️  Change this password before sharing the portal.")
    except Exception as e:
        print(f"\n❌ Error creating user: {e}")
        print("If the user already exists, you can reset the password in the Supabase Dashboard:")
        print("  Authentication → Users → Find user → Reset password")


if __name__ == "__main__":
    main()
