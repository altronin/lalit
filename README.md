# lalitpathak.com.np — Website Guide

## Overview

This is a static HTML/CSS/JS website hosted on **GitHub Pages**, with content
management handled by **Decap CMS** running locally through GitHub Desktop.
No database, no build step — everything is plain files in the repo.

As of this update, the site has been consolidated onto a **single shared
stylesheet and script**, so most day-to-day design or behavior changes only
need to happen in one file, not five.

## Folder structure

```
lalit/
├── admin/
│   ├── config.yml         ← defines what the CMS form looks like
│   └── index.html          ← loads the Decap CMS app (don't edit)
├── css/
│   └── site.css            ← THE stylesheet — used by every page
├── js/
│   └── site.js              ← THE script — nav, dark mode, scroll effects,
│                               back-to-top, reveal animations, used by every page
├── data/
│   ├── experience.json     ← Professional Experience entries
│   ├── projects.json       ← Projects entries
│   ├── publications.json   ← Publications entries
│   ├── training.json       ← Training & Professional Development entries
│   ├── skills.json          ← Skill categories, proficiency bars, tools, languages
│   │                          (feeds BOTH the homepage and My Skills page)
│   └── blogs.json           ← Blog listing cards + posts written in the CMS
├── images/                 ← photos, thumbnails, general site images, favicon.svg
├── blogs/                  ← a couple of legacy blog thumbnail images
├── fonts/                  ← webfont files (used by blog_templete only)
├── cv.pdf                   ← downloadable CV, linked from Home/Portfolio/Contact
├── index.html                ← Home page (About Me, live stats, skills preview, latest posts)
├── myskills.html              ← Full skills breakdown (data-driven from data/skills.json)
├── portfolio.html             ← Experience / Projects / Publications / Training (data-driven,
│                                 with a project status filter and a publication search box)
├── blogs.html                  ← Blog listing page (data-driven, with category filters + search)
├── blog-post.html               ← Displays any blog post written directly in the CMS
├── contact.html                  ← Contact form (Formspree) + contact details
├── 404.html                       ← Custom "page not found" page for GitHub Pages
├── robots.txt, sitemap.xml         ← basic SEO plumbing
├── blog_bmm1.html, blog_lsmvdo.html, blog_moutday2025.html
│                                    ← older, individually hand-built blog post pages
├── blog_templete/                  ← copy blog_templete.html if you ever want to
│                                      hand-build a post with custom HTML (e.g. embedded video)
└── form-handler.js                  ← real AJAX submit + inline success/error message for the
                                        contact form (replaces the old blind "alert()" popup)
```

## What changed in this update

1. **One CSS file, one JS file.** Previously every page had its own ~600-line
   `<style>` block, all nearly identical, plus duplicated `<script>` blocks for
   the mobile menu and scroll effect. That's now `css/site.css` and `js/site.js`,
   loaded by every page. **Change the nav, footer, colors, or button styles once
   and every page updates.** Each page keeps only the handful of CSS rules unique
   to its own content (e.g. `.blog-card`, `.experience-timeline`).
2. **Skills are now CMS-editable.** `data/skills.json` holds your skill
   categories, proficiency percentages, tool list, and languages. Both the
   homepage and My Skills page read from it, and it has its own section in the
   `/admin` CMS — no more editing two hardcoded lists by hand.
3. **Dark mode.** A toggle button in the nav switches between light/dark and
   remembers the choice (localStorage) on return visits.
4. **Live stats & content, not hardcoded copies.**
   - The homepage shows a stats strip (publication count, project count, etc.)
     computed directly from `data/projects.json`, `data/publications.json`, and
     `data/training.json` — so it's always accurate, no manual updates needed.
   - The homepage's "Latest from the Blog" and the Blog page's "Featured
     Publications" pull the newest entries straight from the same JSON files
     used elsewhere, instead of separately hand-typed content.
5. **Search & filters.**
   - Portfolio: filter Projects by Ongoing/Completed; search Publications by
     title/author/journal.
   - Blog: search posts, and click a category card to filter the grid (counts
     are computed live, not hardcoded numbers).
6. **Fixed the contact form.** It used to show a fake "message sent!" alert
   after a fixed delay regardless of what Formspree actually returned.
   `form-handler.js` now does a real `fetch()` POST and shows an honest
   success or error message inline.
7. **SEO basics added**: meta descriptions, Open Graph / Twitter cards,
   canonical URLs, a Person JSON-LD block on the homepage, `robots.txt`,
   `sitemap.xml`, and a branded `favicon.svg`.
8. **Accessibility & polish**: skip-to-content link, `loading="lazy"` on
   images, a back-to-top button, scroll-reveal animations, and a proper
   404 page.
9. **Removed dead weight**: unused legacy template CSS/JS
   (Isotope, Fancybox, PIE.htc — nothing referenced them anymore), stray
   draft/old copies of pages, and orphaned blog drafts. `blog_templete/`
   now holds just the one working custom-post template instead of eight
   old duplicates.

## How content is managed

`index.html`, `myskills.html`, `portfolio.html`, and `blogs.html` don't
contain hard-coded cards — a small script on each page fetches the matching
JSON file from `/data` and builds the HTML on the fly. That means:

- Adding a new project, publication, training entry, or experience item =
  adding one new entry to a JSON file.
- Adding a new blog post = adding one entry to `data/blogs.json`.
- Editing a skill, tool, or proficiency % = editing `data/skills.json`.

The Decap CMS admin panel (`/admin`) is just a form-based editor for those
JSON files — you never touch the JSON by hand.

## Everyday workflow — adding content

1. Start the two local servers (only needed while you're editing):
   - Terminal 1, from the `lalit` folder: `npx decap-server`
   - Terminal 2, same folder: `npx http-server -p 8000`
2. Open `http://localhost:8000/admin/` in your browser.
3. Pick the section (Professional Experience / Projects / Publications /
   Training / Skills / Blog Posts), click **Add**, fill in the fields, and
   **Save**.
   - For a new blog post: fill in title, date, category, thumbnail, excerpt,
     a short slug (e.g. `my-new-post`, no spaces), and write the actual post
     in the "Write your post here" box — you can format text and insert
     photos directly there.
   - Leave "Link to a custom HTML post file" blank unless you specifically
     built a full custom HTML page from `blog_templete/` (only needed for
     things the markdown editor can't do, like an embedded video).
4. Preview at `http://localhost:8000/index.html`, `portfolio.html`,
   `myskills.html`, or `blogs.html` to confirm it looks right.
5. Open GitHub Desktop, review the changed files (should just be the
   relevant `.json` file, plus any uploaded image), write a commit message,
   and push. Your live site updates automatically via GitHub Pages within a
   minute or two.

## Making a design change (color, font, spacing, nav item)

Almost everything visual and structural now lives in one place:

- **Colors, buttons, nav, footer, dark mode, responsive breakpoints** →
  edit `css/site.css`. This affects every page immediately.
- **Nav behavior, dark mode toggle, scroll effects, back-to-top** → edit
  `js/site.js`.
- **A page-specific layout** (e.g. how project cards look) → the small
  `<style>` block still inside that page's `<head>`.
- **Adding a new page to the nav** → add the `<li><a>` to the nav menu in
  every page's `<nav>` block (this one part is still per-page, since each
  page needs to mark its own link `active`).

## Important things to remember

- Never open `index.html`/`portfolio.html`/etc. by double-clicking — that
  loads it as `file:///` and browsers block it from reading the JSON data.
  Always test through `http://localhost:8000/...`.
- Both terminals must stay open while you're using the admin panel —
  `decap-server` (saves your edits to disk) and `http-server` (serves the
  actual pages).
- If the CMS shows a "Failed to fetch" error: `decap-server` probably isn't
  running, or crashed. Check terminal 1.
- If the CMS admin shows outdated fields after you update `config.yml`:
  hard-refresh with `Ctrl+Shift+R`, or open the admin page in an Incognito
  window — Decap caches `config.yml` aggressively in the browser.
- New images uploaded through the CMS media picker are saved into
  `/images` automatically (set by `media_folder` in `config.yml`).
- Once pushed live, none of the local-server steps matter — GitHub Pages
  serves everything over real `https://`, so `fetch()` works normally
  without any local setup.

## If something breaks

- A blank/empty section on any page almost always means either (a) you're
  viewing it via `file://` instead of a server, or (b) a JSON file has
  invalid syntax. Check the browser Console (F12) for the exact error.
- To check a JSON file's validity, paste its contents into an online
  validator like jsonlint.com, or run `python3 -m json.tool data/whatever.json`.
- To check `admin/config.yml`'s validity, run
  `python3 -c "import yaml; yaml.safe_load(open('admin/config.yml'))"`.
