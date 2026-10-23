# Copilot Instructions for `kostiskarampinas.com`

## Project Overview
- Personal portfolio website with a code editor aesthetic.
- Static site using modern HTML5 and CSS3.
- Deployed via GitHub Pages.
- Mobile-first responsive design maintaining code block feeling.

## Content & Structure
- Root contains `index.html` as the main entry point.
- Modern CSS with CSS custom properties in `css/main.css`.
- Uses Fira Code monospace font for authentic code editor look.
- Configuration file: `CNAME` for custom domain (kostiskarampinas.com).
- The site simulates a vim editor displaying a Ruby code file (`me.rb`).
- Footer displays vim-style stats: `me.rb [+] XL, YC` where X=lines, Y=characters.
- When updating content, remember to update the footer stats to match actual line/char count.

## Beta homepage (`/new/`)
- A different design: one lowercase tagline and one input; answers carry the CV and links.
- All copy lives in `new/js/content.js`; `new/js/site.js` is behaviour only.
- The page is `noindex, nofollow` until it replaces the root page.
- Sizes are in `rem`: 16px up to 1920px wide, scaling up on larger screens.
- Unmatched questions go to the Cloudflare Worker in `worker/` (Workers AI). It is grounded
  only on `new/js/content.js`; redeploy it with `cd worker && npx wrangler deploy` after
  editing that file.
- Never put internal or unannounced company details in `content.js`: it is public and is
  the model's only knowledge.

## Development Guidelines
- Keep changes minimal and focused.
- Maintain the code editor aesthetic across all screen sizes.
- Use semantic HTML5 elements (`main`, `nav`, etc.).
- Leverage CSS custom properties for theming consistency.
- Ensure mobile-first responsive design with proper touch targets.
- Test accessibility (keyboard navigation, screen readers).
- Add comments only when clarity is necessary.
- Do not commit local scratch files or temporary build artifacts.

## HTML Structure & Syntax
- Content is structured as a Ruby code snippet wrapped in HTML/CSS for styling.
- Each line of Ruby code is wrapped in `<span class="line">` with appropriate indent classes.
- Indentation uses classes: `indent`, `indent-2`, `indent-3` for visual hierarchy.
- Ruby syntax highlighting uses semantic class names: `def`, `def_name`, `hash_key`, `string`, `s2`.
- Links embedded within code use standard `<a>` tags with `rel="noopener"` for security.
- Empty lines use `<span class="line empty">&nbsp;</span>` to maintain spacing.
- The cursor is represented by `<span class="cursor"></span>` at the end of content.

## SEO & Metadata
- Rich meta tags implemented: Open Graph, Twitter Cards, structured data (JSON-LD).
- Uses Gravatar for profile images across social platforms.
- Canonical URL and proper meta descriptions are essential.
- Schema.org Person markup includes job, organization, and social profiles.

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

