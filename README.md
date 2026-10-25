# kostiskarampinas.com

Personal site: one tagline, one input, ask me anything.

## Tech Stack
- Static HTML/CSS/JS on GitHub Pages (merging to `master` deploys)
- One Cloudflare Worker (`worker/`) for model answers

## Structure
- `/` the "ask me" homepage (`index.html`, `css/site.css`)
  - `js/content.js` holds all copy: tagline, answers, CV rows, links
  - `js/site.js` is behaviour only
- `/old/` the previous vim-style page, kept `noindex, nofollow`
- `robots.txt`, `sitemap.xml` and `og.png` (the share image) for search and social
- `worker/` answers questions no curated answer matches, using Workers AI and
  `js/content.js` as its only knowledge

## Development
Serve the repo root and open http://localhost:8123/ or http://localhost:8123/old/:

    python3 -m http.server 8123

The Worker allows requests from the live domain and `localhost:8123` only.

## Deploying the Worker
Redeploy after any change to `worker/` or `js/content.js`, so the model
knows the current content:

    cd worker && npx wrangler deploy

## License
© 2025 Kostis Karampinas
