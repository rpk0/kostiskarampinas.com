# kostiskarampinas.com

Personal portfolio website with a code editor aesthetic.

## Tech Stack
- Static HTML/CSS/JS on GitHub Pages (merging to `master` deploys)
- One Cloudflare Worker (`worker/`) for model answers on the beta page

## Structure
- `/` the live vim-style homepage (`index.html`, `css/main.css`)
- `/new/` the beta "ask me" homepage, `noindex, nofollow` until it replaces `/`
  - `new/js/content.js` holds all copy: tagline, answers, CV rows, links
  - `new/js/site.js` is behaviour only
- `worker/` answers questions no curated answer matches, using Workers AI and
  `new/js/content.js` as its only knowledge

## Development
Serve the repo root and open http://localhost:8123/ or http://localhost:8123/new/:

    python3 -m http.server 8123

The Worker allows requests from the live domain and `localhost:8123` only.

## Deploying the Worker
Redeploy after any change to `worker/` or `new/js/content.js`, so the model
knows the current content:

    cd worker && npx wrangler deploy

## License
© 2025 Kostis Karampinas
