# Website Guide

## Overview

This is a static HTML/CSS/JS website hosted on **GitHub Pages**, with content
management handled by **Decap CMS**. No database, no build step — everything
is plain files in the repo.

## Folder structure
```
lalit/
├── admin/
│   ├── config.yml         ← production CMS config (GitHub backend — needs an
│   │                          OAuth proxy URL filled in, see comment inside)
│   ├── config.dev.yml      ← LOCAL-DEV-ONLY config (local proxy backend) —
│   │                          never rename this over config.yml
│   └── index.html           ← loads the Decap CMS app (don't edit)
├── css/
│   ├── tokens.css           ← design tokens: color, type, spacing (edit here
│   │                            for a palette/font change site-wide)
│   └── site.css              ← THE stylesheet — layout & components, used by
│                                 every page, imports tokens.css
├── js/
│   ├── site.js                ← THE shared script — nav, dark mode, scroll
│   │                              effects, back-to-top, reveal animations,
│   │                              lpRenderMedia() — used by every page
│   ├── theme-init.js           ← tiny anti-flash dark-mode script, loaded in
│   │                              <head> before first paint on every page
│   ├── pages/                  ← one file per page's own dynamic content
│   │   ├── home.js, blogs.js, myskills.js, portfolio.js, blog-post.js
│   └── vendor/                 ← locally-vendored third-party libs (not CDN)
│       ├── marked-12.0.2.min.js
│       └── dompurify-3.4.16.min.js
├── data/
│   ├── experience.json     ← Professional Experience entries
│   ├── projects.json       ← Projects entries
│   ├── publications.json   ← Publications entries
│   ├── training.json       ← Training & Professional Development entries
│   ├── skills.json          ← Skill categories, proficiency bars, tools, languages
│   │                          (feeds BOTH the homepage and My Skills page)
│   ├── blogs.json           ← Blog listing cards + posts written in the CMS
│   │                          (an `image` field can be a still image OR an
│   │                          .mp4/.webm clip — lpRenderMedia() picks the tag)
│   └── person-schema.json   ← Person JSON-LD, loaded by index.html via
│                                <script type="application/ld+json" src="...">
├── images/                 ← photos, thumbnails, general site images, favicon.svg,
│                              short .mp4/.webm clips + matching -poster.jpg stills
├── blogs/                  ← a couple of legacy blog thumbnail images
├── fonts/                  ← webfont files (used by blog_templete only)
├── cv.pdf                   ← downloadable CV, linked from Home/Portfolio/Contact
├── index.html                ← Home page (About Me, live stats, skills preview, latest posts)
├── myskills.html              ← Full skills breakdown (data-driven from data/skills.json)
├── portfolio.html             ← Experience / Projects / Publications / Training (data-driven,
│                                 with a project status filter and a publication search box)
├── projects.html / project.html       ← all projects list + one page per project (?project=slug)
├── publications.html / publication.html ← all publications list + one page per publication, with abstract (?pub=slug)
├── blogs.html                  ← Blog listing page (data-driven, with category filters + search)
├── blog-post.html               ← Displays any blog post written directly in the CMS
├── contact.html                  ← Contact form (Formspree + honeypot) + contact details
├── 404.html                       ← Custom "page not found" page for GitHub Pages
├── robots.txt, sitemap.xml         ← basic SEO plumbing
├── blog_bmm1.html, blog_lsmvdo.html, blog_moutday2025.html
│                                    ← older, individually hand-built blog post pages
│                                      (still use inline <script>, so their CSP keeps
│                                      'unsafe-inline' — see revision notes above)
├── blog_templete/                  ← copy blog_templete.html if you ever want to
│                                      hand-build a post with custom HTML (e.g. embedded video)
└── form-handler.js                  ← real AJAX submit + honeypot spam check + inline
                                        success/error message for the contact form
```

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



## Projects & Publications pages

`portfolio.html` shows only the latest 3 projects / 5 publications. The full
lists live on `projects.html` and `publications.html`, and every entry opens
its own page (`project.html` / `publication.html`). All of it is driven by
`data/projects.json` and `data/publications.json`, so adding an entry in the
admin panel is all it takes. The page URL is created from the title
automatically (the optional "URL slug" field only matters if you rename a
title and want the old link to keep working).

- Publications: fill in the **Abstract** (and optional Keywords) in the CMS.
- Projects: fill in **Full overview** (and optional cover image / link).
