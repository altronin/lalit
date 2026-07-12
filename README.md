lalitpathak.com.np — Website Guide
Overview
This is a static HTML/CSS/JS website hosted on GitHub Pages, with content management handled by Decap CMS running locally through GitHub Desktop. No database, no build step — everything is plain files in the repo.
Folder structure

lalit/
├── admin/
│   ├── config.yml        ← defines what the CMS form looks like
│   └── index.html         ← loads the Decap CMS app (don't edit)
├── data/
│   ├── experience.json    ← Professional Experience entries
│   ├── projects.json      ← Projects entries
│   ├── publications.json  ← Publications entries
│   ├── training.json      ← Training & Professional Development entries
│   └── blogs.json         ← Blog listing cards + posts written in the CMS
├── images/                ← photos, thumbnails, general site images
├── blogs/                 ← a couple of legacy blog thumbnail images
├── css/                   ← stylesheets for the older template-based pages
├── fonts/                 ← webfont files
├── js/                    ← isotope, fancybox, and other page scripts
├── index.html              ← Home page (About Me, Skills)
├── portfolio.html          ← Experience / Projects / Publications / Training (data-driven)
├── blogs.html               ← Blog listing page (data-driven)
├── blog-post.html            ← Displays any blog post written directly in the CMS
├── blog_bmm1.html, blog_lsmvdo.html, blog_moutday2025.html, etc.
│                            ← older, individually hand-built blog post pages
├── blog_templete/           ← copy this folder's template if you ever want to
│                              hand-build a post with custom HTML (e.g. embedded video)
├── myskills.html, contact.html, CNAME, cv, form-handler.js


okay great it worked, but one thing the new blog option i have to create blog using html templete instead can i just write blog content and photo here?Thought for 23sThought for 23sYes — that's a very reasonable ask, and totally doable. Let me build a single "blog post" page template that reads your CMS-written content (title, photo, and the article body) and displays it, so new posts need zero HTML at all. Your existing 3 hand-made posts stay untouched.Check blog-article and blog-content-container CSS to reuse styling exactlyCheck blog-article and blog-content-container CSS to reuse styling exactlyNow let's build the dynamic blog-post template:Peek at footer/script section for reusePeek at footer/script section for reuseNow I'll build the full blog-post.html template, matching your existing design exactly:Dynamic blog post template that renders CMS-written postsDynamic blog post template that renders CMS-written postsNow update the config so the CMS gives you a slug field and a "write it here" body field, and update blogs.html to route to this new page when no external link is set:Edited 2 filesEdited 2 filesLet's validate config.yml syntax and re-zip everything:Validate config.yml syntaxValidate config.yml syntaxConfig looks good. Now update the README and re-package:Edited 2 files, ran a command, read a fileEdited 2 files, ran a command, read a fileYes — updated. Now for a new blog post, you can just:

Open /admin/ → Blog Posts → Add
Fill in title, date, category, thumbnail image, excerpt, and a short slug (e.g. my-new-post, no spaces)
Write your actual post in the "Write your post here" box — you can format text and drop in photos right there
Leave the "custom HTML file" field blank
Save, then commit + push through GitHub Desktop

No HTML at all. The new blog-post.html file (included in the zip) automatically displays it at blog-post.html?post=my-new-post, and the listing card on blogs.html will link straight to it.
Your 3 existing hand-made posts keep working exactly as before — nothing about them changes. This new path is only for future posts, and you can still use the old "copy the template" method too if you ever need something the markdown editor can't do, like an embedded YouTube video.
Add blog-post.html to your site folder alongside the updated portfolio.html, blogs.html, admin/config.yml, and data/ folder from before, then test locally the same way you did last time before pushing.Lalit cms updateZIP this is what i see when i create new blog: Title
Date
e.g. December 12, 2025
Category
Thumbnail Image
Choose an imageInsert from URL
Excerpt
Link to full post file
e.g. blog_mynewpost.html — the file you create by copying blog_templete.htmlDiagnosed outdated configuration and prescribed cache-clearing remediesDiagnosed outdated configuration and prescribed cache-clearing remediesThat means the config file on your computer is still the old version — the one you're seeing (Title, Date, Category, Thumbnail, Excerpt, Link) is the original config, not the updated one with slug + "Write your post here". A couple of likely causes:Confirm the new config.yml was actually savedOpen D:\Git_Website\lalit\admin\config.yml in a text editor and check whether it actually contains a field called 'Write your post here' (name: body) and 'URL slug' (name: slug). If it doesn't, the new config.yml from the zip was never copied in — copy it in again, overwriting the old one completely.Hard-refresh the admin page (not just F5)Decap CMS aggressively caches config.yml in the browser. Do a hard refresh: Ctrl+Shift+R (or Ctrl+F5) on the http://localhost:8000/admin/ page. A normal refresh often isn't enough.Restart both local serversStop both terminals (Ctrl+C in each), then restart them: npx decap-server in one, npx http-server -p 8000 in the other, from D:\Git_Website\lalit. Then revisit http://localhost:8000/admin/ fresh.Check what config.yml the browser is really loadingIf it's still showing old fields, open DevTools (F12) → Network tab → reload → click the request for config.yml → check the Response tab to see exactly what content the browser is actually receiving. That tells us for certain whether it's a caching issue or the file itself wasn't updated.1234Try step 1 first — most likely the new config.yml from the zip just hasn't replaced the old one on disk yet. Let me know what you find.it is updated: name: "blogs"
    label: "Blog Posts (Listing Cards)"
    label_singular: "Blog Card"
    files:
      - name: "blogs"
        label: "Blog Listing"
        file: "data/blogs.json"
        fields:
          - name: "items"
            label: "Entries"
            widget: "list"
            label_singular: "Post"
            summary: "{{fields.title}}"
            fields:
              - { label: "Title", name: "title", widget: "string" }
              - { label: "Date", name: "date", widget: "string", hint: "e.g. December 12, 2025" }
              - { label: "Category", name: "category", widget: "string" }
              - { label: "Thumbnail / Cover Image", name: "image", widget: "image" }
              - { label: "Excerpt (shown on the blog listing card)", name: "excerpt", widget: "text" }
              - { label: "URL slug", name: "slug", widget: "string", hint: "Short, no spaces, e.g. my-new-post — this becomes part of the post's web address", required: false }
              - { label: "Write your post here", name: "body", widget: "markdown", required: false, hint: "Use this OR the file link below — not both. This lets you write text, add photos, and format directly." }
              - { label: "Link to a custom HTML post file (advanced, optional)", name: "link", widget: "string", required: false, hint: "Only fill this in if you built a full custom HTML page yourself (like the older posts). Leave blank if you wrote the post above." }Show moreThe config file itself is correct — so this is a browser caching issue with the CMS UI, not the file. Let's force it to reload cleanly.Close the tab and stop both serversClose the admin tab entirely (not just refresh). Also stop decap-server and http-server (Ctrl+C in both terminals).Clear cache or use an Incognito windowOpen your browser's history/cache settings and clear cached files for localhost, or simply open the admin page in a new Incognito/Private window — this guarantees nothing old is cached.Restart both serversIn terminal 1: npx decap-server. In terminal 2 (from the same lalit folder): npx http-server -p 8000.Reopen the admin page and test againGo to http://localhost:8000/admin/ in the fresh/incognito window, open Blog Posts, click Add, and check whether 'URL slug' and 'Write your post here' now appear.1234If the incognito window still shows the old fields, one more possibility: check whether you actually have two config.yml files somewhere (e.g. a leftover copy from the earlier blog_templete folder or a duplicate admin folder), and the server is reading the wrong one. Let me know what the incognito test shows.Just write a readme content that complettely describe and important for my website reply in chat no need to create doc fileOrchestrated comprehensive README covering setup, configuration, and troubleshooting guidanceOrchestrated comprehensive README covering setup, configuration, and troubleshooting guidanceHere's a complete reference README for your website — save this somewhere (like a notes app, or paste it as README.md in your repo later) so you always have it handy.

lalitpathak.com.np — Website Guide
Overview
This is a static HTML/CSS/JS website hosted on GitHub Pages, with content management handled by Decap CMS running locally through GitHub Desktop. No database, no build step — everything is plain files in the repo.
Folder structure
lalit/
├── admin/
│   ├── config.yml        ← defines what the CMS form looks like
│   └── index.html         ← loads the Decap CMS app (don't edit)
├── data/
│   ├── experience.json    ← Professional Experience entries
│   ├── projects.json      ← Projects entries
│   ├── publications.json  ← Publications entries
│   ├── training.json      ← Training & Professional Development entries
│   └── blogs.json         ← Blog listing cards + posts written in the CMS
├── images/                ← photos, thumbnails, general site images
├── blogs/                 ← a couple of legacy blog thumbnail images
├── css/                   ← stylesheets for the older template-based pages
├── fonts/                 ← webfont files
├── js/                    ← isotope, fancybox, and other page scripts
├── index.html              ← Home page (About Me, Skills)
├── portfolio.html          ← Experience / Projects / Publications / Training (data-driven)
├── blogs.html               ← Blog listing page (data-driven)
├── blog-post.html            ← Displays any blog post written directly in the CMS
├── blog_bmm1.html, blog_lsmvdo.html, blog_moutday2025.html, etc.
│                            ← older, individually hand-built blog post pages
├── blog_templete/           ← copy this folder's template if you ever want to
│                              hand-build a post with custom HTML (e.g. embedded video)
├── myskills.html, contact.html, CNAME, cv, form-handler.js
How content is managed
portfolio.html and blogs.html no longer contain hard-coded cards — instead, a small script on each page fetches the matching JSON file from /data and builds the HTML on the fly. That means:

Adding a new project, publication, training entry, or experience item = adding one new entry to a JSON file.
Adding a new blog post = adding one entry to data/blogs.json.

The Decap CMS admin panel is just a form-based editor for those JSON files — you never touch the JSON by hand.
Everyday workflow — adding content

Start the two local servers (only needed while you're editing):

Terminal 1, from the lalit folder: npx decap-server
Terminal 2, same folder: npx http-server -p 8000


Open http://localhost:8000/admin/ in your browser.
Pick the section (Professional Experience / Projects / Publications / Training / Blog Posts), click Add, fill in the fields, and Save.

For a new blog post: fill in title, date, category, thumbnail, excerpt, a short slug (e.g. my-new-post, no spaces), and write the actual post in the "Write your post here" box — you can format text and insert photos directly there.
Leave "Link to a custom HTML post file" blank unless you specifically built a full custom HTML page from blog_templete/ (only needed for things the markdown editor can't do, like an embedded video).


Preview at http://localhost:8000/portfolio.html or blogs.html to confirm it looks right.
Open GitHub Desktop, review the changed files (should just be the relevant .json file, plus any uploaded image), write a commit message, and push. Your live site updates automatically via GitHub Pages within a minute or two.

Important things to remember

Never open portfolio.html/blogs.html by double-clicking — that loads it as file:/// and browsers block it from reading the JSON data. Always test through http://localhost:8000/....
Both terminals must stay open while you're using the admin panel — decap-server (saves your edits to disk) and http-server (serves the actual pages).
If the CMS shows a "Failed to fetch" error: decap-server probably isn't running, or crashed. Check terminal 1.
If the CMS admin shows outdated fields after you update config.yml: hard-refresh with Ctrl+Shift+R, or open the admin page in an Incognito window — Decap caches config.yml aggressively in the browser.
New images uploaded through the CMS media picker are saved into /images automatically (set by media_folder in config.yml).
Once pushed live, none of the local-server steps matter — GitHub Pages serves everything over real https://, so fetch() works normally without any local setup.

If something breaks

A blank/empty section on portfolio.html or blogs.html almost always means either (a) you're viewing it via file:// instead of a server, or (b) a JSON file has invalid syntax. Check the browser Console (F12) for the exact error.
To check a JSON file's validity, paste its contents into an online validator like jsonlint.com.