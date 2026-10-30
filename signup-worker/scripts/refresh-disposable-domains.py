#!/usr/bin/env python3
"""Download the community disposable-email blocklist and regenerate src/data/disposable-domains.ts."""
from __future__ import annotations
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

URL = (
    "https://raw.githubusercontent.com/disposable-email-domains/"
    "disposable-email-domains/master/disposable_email_blocklist.conf"
)
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "disposable-domains.ts"

def main() -> None:
    with urllib.request.urlopen(URL, timeout=60) as res:
        text = res.read().decode("utf-8")
    domains = sorted(
        {line.strip().lower() for line in text.splitlines() if line.strip() and not line.startswith("#")}
    )
    lines = [
        "/**",
        " * Snapshot of disposable-email-domains/disposable-email-domains",
        " * (disposable_email_blocklist.conf). Observe-only — do not treat as gospel.",
        " * Refresh: npm run refresh:disposable-domains",
        f" * Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d')} UTC — {len(domains)} domains",
        " */",
        "export const DISPOSABLE_DOMAIN_LIST: readonly string[] = [",
    ]
    for d in domains:
        lines.append(f"  {d!r},")
    lines.append("];")
    lines.append("")
    OUT.write_text("\n".join(lines))
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(domains)} domains)")

if __name__ == "__main__":
    main()
