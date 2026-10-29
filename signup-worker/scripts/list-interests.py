#!/usr/bin/env python3
"""List Mailchimp interest category + interest IDs for signup-worker mapping.

Usage:
  export MAILCHIMP_API_KEY='your-key-us18'
  python3 scripts/list-interests.py
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request

DC = os.environ.get("MAILCHIMP_DC", "us18")
KEY = os.environ.get("MAILCHIMP_API_KEY", "")

AUDIENCES = [
    ("b666fb9950", "SaskToday"),
    ("e0e70bc1df", "SportsCage Insider"),
]


def api_get(path: str) -> dict:
    url = f"https://{DC}.api.mailchimp.com/3.0{path}"
    token = base64.b64encode(f"any:{KEY}".encode()).decode()
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {token}"})
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def main() -> int:
    if not KEY:
        print("Set MAILCHIMP_API_KEY first.", file=sys.stderr)
        return 1

    for audience_id, label in AUDIENCES:
        print("=" * 60)
        print(f"{label}  ({audience_id})")
        print("=" * 60)
        try:
            cats = api_get(
                f"/lists/{audience_id}/interest-categories?count=100"
            )
        except urllib.error.HTTPError as e:
            print(f"  ERROR {e.code}: {e.read().decode()[:300]}")
            continue

        for cat in cats.get("categories", []):
            print(f"\nCategory: {cat.get('title')}  id={cat.get('id')}")
            interests = api_get(
                f"/lists/{audience_id}/interest-categories/{cat['id']}/interests?count=100"
            )
            for interest in interests.get("interests", []):
                print(
                    f"  interest: {interest.get('name')!r}  "
                    f"id={interest.get('id')}  "
                    f"subscribers={interest.get('subscriber_count')}"
                )
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
