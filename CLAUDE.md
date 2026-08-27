# markusluisflores.github.io

Personal resume/portfolio site, published via GitHub Pages from this repo's `main` branch. Global workflow rules (feature workflow, design process, mandatory skills, conventions) live in `~/.claude/CLAUDE.md` and apply here — with the project-specific overrides below.

## Constraints

- Must remain a **public** repository. GitHub Pages on the free plan only publishes from public repos — going private would take the site down (would require GitHub Pro to keep it working private).
- Static site only, no server-side runtime. Built with **Eleventy**, compiled to static HTML/CSS/JS and deployed via GitHub Actions (see [ADR-001](docs/adr/ADR-001-static-site-generator.md) for why Eleventy over Jekyll or a no-build plain HTML/CSS/JS approach).

## Project-specific overrides to the global workflow

- **`journal` and `interview-prep` capture outputs stay local-only, never pushed to `main`.** `docs/journal/` and `docs/project-reviewer.md` are gitignored. Since this repo is the public-facing resume site itself, it shouldn't be cluttered with the usual AI-workflow paper trail (session journals, interview-prep talking points) — those are still useful to keep locally, just not published.
- **Every change to this repo requires a check-in with the user before implementation begins** — not "somewhere in the chain," not at merge time. For routine engineering work (CSS, config, dependency bumps), this can be a brief heads-up, not a content-review ceremony. **User-visible published content specifically** (text, copy, headings, taglines, images, links — anything a visitor reads) raises the bar: that pre-implementation check-in must carry the exact final content — literal text for copy, the specific asset or URL for images and links, not just an intent to work on it. Separately: when the user's approval phrasing is ambiguous between "proceed" and "hold" — especially after a self-interrupted message — right before a merge that auto-deploys, ask a clarifying yes/no question rather than picking the reading that allows continuing.
