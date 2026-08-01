#!/usr/bin/env python3
"""
Updates data/scholar-stats.json with current citation metrics from Google
Scholar, using the (unofficial) `scholarly` library.

Run manually any time with:  python3 scripts/update_scholar_stats.py
Also runs automatically once a month via
.github/workflows/update-scholar-stats.yml.

There is no official Google Scholar API, so this scrapes the public
profile page. Google sometimes blocks or rate-limits automated requests
(especially from cloud IPs like GitHub Actions runners), so this is
written to fail safely:
  - if the fetch throws an error, the existing file is left untouched
  - if the fetch "succeeds" but returns suspicious data (e.g. citations
    dropped to 0 when we previously had a real number), the update is
    skipped rather than trusted
A skipped run exits 0 (not an error) so it doesn't send you a monthly
"workflow failed" email for something outside your control — check the
Action's log output if you want to confirm whether it actually updated.
"""
import json
import sys
from datetime import date
from pathlib import Path

SCHOLAR_ID = "g2ElSJYAAAAJ"
ROOT = Path(__file__).resolve().parent.parent
STATS_PATH = ROOT / "data" / "scholar-stats.json"


def fetch_metrics():
    from scholarly import scholarly
    author = scholarly.search_author_id(SCHOLAR_ID)
    author = scholarly.fill(author, sections=["indices"])
    return {
        "total_citations": int(author.get("citedby", 0) or 0),
        "h_index": int(author.get("hindex", 0) or 0),
        "i10_index": int(author.get("i10index", 0) or 0),
    }


def looks_like_a_real_drop(old, new):
    """
    A metric going down slightly can be legitimate (Scholar does correct
    itself occasionally), but citations falling all the way to 0 when we
    previously had a nonzero count is almost always a bad scrape, not
    reality. Treat that specific case as untrustworthy.
    """
    return old.get("total_citations", 0) > 0 and new["total_citations"] == 0


def main():
    current = json.loads(STATS_PATH.read_text(encoding="utf-8")) if STATS_PATH.exists() else {}

    try:
        fresh = fetch_metrics()
    except Exception as exc:
        print(f"SKIPPED: could not fetch Google Scholar data ({exc}). Leaving scholar-stats.json unchanged.")
        return 0

    if looks_like_a_real_drop(current, fresh):
        print("SKIPPED: fetched citation count dropped to 0, which looks like a bad scrape rather than reality. Leaving scholar-stats.json unchanged.")
        return 0

    updated = {
        "profile_url": current.get("profile_url", f"https://scholar.google.com/citations?user={SCHOLAR_ID}&hl=en"),
        "total_citations": fresh["total_citations"],
        "h_index": fresh["h_index"],
        "i10_index": fresh["i10_index"],
        "last_updated": date.today().isoformat(),
    }

    if updated == {**current, "last_updated": updated["last_updated"]}:
        print("No change in citation metrics — updating last_updated only.")
    else:
        print(f"Updated scholar-stats.json: {updated}")

    STATS_PATH.write_text(json.dumps(updated, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
