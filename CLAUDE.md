# markusluisflores.github.io

Personal resume/portfolio site, published via GitHub Pages from this repo's `main` branch. Global workflow rules (feature workflow, design process, mandatory skills, conventions) live in `C:\Users\Miko\.claude\CLAUDE.md` and apply here — with the project-specific overrides below.

## Constraints

- Must remain a **public** repository. GitHub Pages on the free plan only publishes from public repos — going private would take the site down (would require GitHub Pro to keep it working private).
- Static site only, no server-side runtime. Built with **Eleventy**, compiled to static HTML/CSS/JS and deployed via GitHub Actions (see [ADR-001](docs/adr/ADR-001-static-site-generator.md) for why Eleventy over Jekyll or a no-build plain HTML/CSS/JS approach).

## Project-specific overrides to the global workflow

- **`journal` and `interview-prep` capture outputs stay local-only, never pushed to `main`.** `docs/journal/` and `docs/project-reviewer.md` are gitignored. Since this repo is the public-facing resume site itself, it shouldn't be cluttered with the usual AI-workflow paper trail (session journals, interview-prep talking points) — those are still useful to keep locally, just not published.
