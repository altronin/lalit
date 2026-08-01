#!/usr/bin/env python3
"""
Regenerates feed.xml from data/blogs.json.

Run manually any time with:  python3 scripts/generate_feed.py
Also runs automatically via .github/workflows/generate-feed.yml whenever
data/blogs.json changes on push, so feed.xml never needs manual editing.

Posts are always sorted newest-first by their `date` field, so a newly
added post appears at the top of the feed regardless of where it sits
in blogs.json.
"""
import json
import html
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://lalitpathak.com.np"


def parse_date(date_str):
    for fmt in ("%B %d, %Y", "%b %d, %Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return datetime.min


def rfc822(dt):
    return format_datetime(dt.replace(tzinfo=timezone.utc))


def build_item(post):
    link = post.get("link") or f"blog-post.html?post={post.get('slug', '')}"
    if not link.startswith("http"):
        link = f"{SITE_URL}/{link}"
    return f"""    <item>
      <title>{html.escape(post['title'])}</title>
      <link>{html.escape(link)}</link>
      <guid isPermaLink="true">{html.escape(link)}</guid>
      <pubDate>{rfc822(parse_date(post['date']))}</pubDate>
      <category>{html.escape(post.get('category', ''))}</category>
      <description>{html.escape(post.get('excerpt', ''))}</description>
    </item>"""


def main():
    blogs_path = ROOT / "data" / "blogs.json"
    feed_path = ROOT / "feed.xml"

    data = json.loads(blogs_path.read_text(encoding="utf-8"))
    posts = sorted(data.get("items", []), key=lambda p: parse_date(p.get("date", "")), reverse=True)

    items_xml = "\n".join(build_item(p) for p in posts)
    build_date = rfc822(datetime.now())

    feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lalit Pathak - Environmental Insights</title>
    <link>{SITE_URL}/blogs.html</link>
    <description>Research findings, field experiences, and perspectives on environmental science, GIS, and disaster risk management from Lalit Pathak.</description>
    <language>en-us</language>
    <atom:link href="{SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>{build_date}</lastBuildDate>
{items_xml}
  </channel>
</rss>
"""
    feed_path.write_text(feed, encoding="utf-8")
    print(f"Wrote {feed_path} with {len(posts)} posts, newest first.")


if __name__ == "__main__":
    main()
