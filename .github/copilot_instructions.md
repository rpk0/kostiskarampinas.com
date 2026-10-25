# Copilot Instructions for `kostiskarampinas.com`

## Project Overview
- Personal site, static HTML/CSS/JS, deployed via GitHub Pages; `CNAME` holds the domain.
- `/` is the "ask me" homepage: one lowercase tagline and one input; answers carry the CV and links.
- `/old/` is the previous vim-style page, kept `noindex, nofollow`.

## Homepage (`/`)
- All copy lives in `js/content.js`; `js/site.js` is behaviour only; styles in `css/site.css`.
- Sizes are in `rem`: 16px up to 1920px wide, scaling up on larger screens.
- Unmatched questions go to the Cloudflare Worker in `worker/` (Workers AI). It is grounded
  only on `js/content.js`; redeploy it with `cd worker && npx wrangler deploy` after
  editing that file.
- Never put internal or unannounced company details in `content.js`: it is public and is
  the model's only knowledge.
- Keep the `<noscript>` bio, the JSON-LD and the meta descriptions in line with `content.js`.
- `og.png` (1200x630) is the share image; regenerate it if the tagline changes.
- Cloudflare tells browsers to cache CSS/JS for 4 hours (HTML for 10 minutes). After changing
  `css/` or `js/`, bump the `?v=` date on their links in `index.html` (and `old/index.html`),
  or visitors get new HTML with stale assets.
- No third-party assets: fonts live in `fonts/` (declared at the top of each stylesheet),
  icons are the magenta dot (`favicon.svg`, `favicon-48.png`, `favicon.ico`,
  `apple-touch-icon.png`), and `profile.png` is the photo with the dot.

## Old page (`/old/`)
- Simulates vim showing a Ruby file (`me.rb`), styled by `old/css/main.css` with Fira Code.
- Footer displays vim-style stats: `me.rb [+] XL, YC` where X=lines, Y=characters.
  Update them when the content changes.

## Development Guidelines
- Keep changes minimal and focused.
- Use semantic HTML5 elements (`main`, `nav`, etc.).
- Leverage CSS custom properties for theming consistency.
- Ensure mobile-first responsive design with proper touch targets.
- Test accessibility (keyboard navigation, screen readers).
- Add comments only when clarity is necessary.
- Do not commit local scratch files or temporary build artifacts.

## Old page HTML Structure & Syntax
- Content is structured as a Ruby code snippet wrapped in HTML/CSS for styling.
- Each line of Ruby code is wrapped in `<span class="line">` with appropriate indent classes.
- Indentation uses classes: `indent`, `indent-2`, `indent-3` for visual hierarchy.
- Ruby syntax highlighting uses semantic class names: `def`, `def_name`, `hash_key`, `string`, `s2`.
- Links embedded within code use standard `<a>` tags with `rel="noopener"` for security.
- Empty lines use `<span class="line empty">&nbsp;</span>` to maintain spacing.
- The cursor is represented by `<span class="cursor"></span>` at the end of content.

## SEO & Metadata
- Only `/` is indexed: canonical, Open Graph, Twitter card, and JSON-LD (`ProfilePage`,
  `Person`, `WebSite`). It is the only URL in `sitemap.xml`.
- `/old/` is `noindex, nofollow`. Don't block it in `robots.txt`, or crawlers can't see that.

## Communication Tips for Agents
- Propose design options rather than making unilateral decisions when unsure.
- When in doubt, just ask.
- When editing content, always verify line/character counts match the footer stats.
- The Ruby code aesthetic is central to the design—maintain proper syntax highlighting.
- For commits, respect the following:
  - Title line: Maximum 50 characters, followed by a blank line
  - Description: Wrapped at 80 characters per line
  - One commit = one logical change - Keep commits small and focused
  - If the commit is small enough, the "what" should be evident from the code
  - Focus on explaining WHY the change was made
  - Provide enough context for reviewers and future developers

