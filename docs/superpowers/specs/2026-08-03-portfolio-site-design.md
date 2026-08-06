# Resume/Portfolio Site — Design

**Status:** Accepted
**Date:** 2026-08-03
**Revised:** 2026-08-05 — added the sticky-sidebar desktop layout, the Skills-to-Experience filtering interaction, and clarified the accent color's interaction-reserved usage. All three were designed and approved during Task 5's implementation-plan work; this revision brings the spec back in sync with what the plan now builds.

## Purpose

Turn `markusluisflores.github.io` from a placeholder into a personal resume site: a single-page, data-driven site presenting experience, skills, and education, with a downloadable PDF resume and a light/dark theme toggle. Built with a modern, distinctive visual identity rather than a generic template look — it doubles as a front-end taste signal, since visitors are evaluating a software engineer.

## Constraints

- **Repo must stay public.** GitHub Pages on the Free plan only builds from public repositories; going private would take the site down without upgrading to GitHub Pro. (Confirmed against current GitHub docs, 2026-08-03.)
- Static output only — GitHub Pages serves static files; any build step must run in CI (GitHub Actions) and publish static output, since GitHub Pages does not run arbitrary server code.
- Solo project, no collaborators — process/tooling choices below are scoped accordingly (no RFCs, no AGENTS.md, no log4brains — decided against per the New Project checklist's assessment step).
- `journal`/`interview-prep` outputs are gitignored (local-only, never pushed to `main`) so this repo isn't cluttered with the usual AI-workflow paper trail. Documented in the project's `CLAUDE.md`. Commits keep the standard `Co-Authored-By: Claude` trailer, same as every other project — no attempt to obscure that this is AI-assisted work.

## Scope decision

Resume-only content for this iteration, but the page structure (nav, layout, content-as-data pattern) is deliberately built so a "Projects" section/page can be added later without restructuring anything already built. This was an explicit trade-off discussed with the user: decide final content scope now (resume only) while keeping the architecture open to a near-future extension, rather than either over-building for projects we're not adding yet or designing something that would need to be reworked to add them.

## Content sections (in order)

1. **Hero** — name (typographic focal point), title/tagline, accent-color treatment, contact links (Email, GitHub, LinkedIn) as icon+text.
2. **Experience** — reverse-chronological entries (company, role, dates, bullets), styled as a timeline rather than plain bullet lists.
3. **Skills** — tag/pill chips grouped by category (e.g. Languages, Frameworks, Tools). See Skills-to-Experience filtering below for the interactive behavior on chips with real evidence.
4. **Education**.
5. **Footer** — repeats contact links, "Download Resume (PDF)" button, theme toggle control.

Nav is anchor links (Experience / Skills / Education) in a slim sticky header alongside the theme toggle. This header is the seam where a future Projects anchor/page attaches. On wide viewports the nav's active-section indicator tracks scroll position as the visitor moves through the page. This is additive to the anchor-link model, not a replacement for it — see Visual design system below for the accompanying layout change.

No headshot/photo — typography-driven hero instead.

The theme toggle is **one logical control with two visual instances** (header and footer) — both reflect and set the same `data-theme` state (see Visual design system below), kept in sync via shared JS, not independent controls with separate state.

### Head metadata

Beyond the visible content sections, `base.njk` sets: page `<title>`, a meta description (short professional summary, reused as the OG description), Open Graph tags (`og:title`, `og:description`, `og:image` — a simple generated card, since LinkedIn/social shares render these), and a favicon. This matters concretely because Lighthouse's SEO check is a CI gate (see Quality, testing & CI below) and because the page's contact links include LinkedIn, where a shared link with no OG image/description looks unpolished.

### Skills-to-Experience filtering

Each Skills chip that has real evidence in an Experience bullet — the skill is actually named in describing that piece of work, not just present somewhere on the resume — is interactive: clicking it highlights the matching Experience bullets and dims the rest, with multiple skills selectable at once (a bullet lights up if it matches *any* currently-active skill). This is deliberately not universal: a skill with no bullet behind it stays a plain, non-interactive label rather than a button that goes nowhere — an honest outcome for a real skill that isn't demonstrated by a specific piece of described work, not a gap to paper over. The feature is progressive enhancement — with JavaScript unavailable, the page shows the complete, unfiltered resume with no controls and nothing hidden. The intent is to let a visitor, a hiring manager in particular, verify a specific skill claim against concrete evidence rather than trusting a bare list.

## Visual design system

- **Aesthetic direction: modern & distinctive** (chosen over minimal/professional and developer/technical) — the user's actual paper resume already covers the safe/minimal treatment for direct employer submissions; this site is the place for a stronger visual identity.
- **Typography**: a distinctive display font for name/headers (e.g. Fraunces, Space Grotesk, or Sora — exact choice deferred to implementation) paired with a plain workhorse sans (Inter or system-ui) for body text.
- **Color**: CSS custom properties (`--bg`, `--text`, `--accent`, `--surface`, etc.) define the theme once; dark/light toggle swaps a `data-theme` attribute on `<html>`. Default follows `prefers-color-scheme`; user override persists via `localStorage`. One deliberate accent color (not default blue) — reserved mainly for interaction and emphasis (hover, focus, active states, a small number of deliberate resting marks) rather than applied broadly at rest across links, chips, and borders. Comparable-site research found that a quieter, interaction-reserved accent reads as more intentional at this page's scale than one applied everywhere it's permitted.
- **Theme detection must run before first paint** to avoid a flash of the wrong theme: a small inline `<script>` in `base.njk`'s `<head>` (not the deferred `assets/js/theme-toggle.js` file) reads `localStorage`/`prefers-color-scheme` and sets `data-theme` synchronously. The external `theme-toggle.js` file only handles the click-to-toggle interaction after load.
- **Layout**: CSS Grid/Flexbox, mobile-first, generous section spacing, subtle hover/scroll transitions (fade-in on section entry, hover states on links/chips) — nothing heavy. On wide viewports, the Hero (name, tagline, contact links, download CTA) becomes a sticky sidebar beside an independently-scrolling content column carrying Experience/Skills/Education; below a width/height threshold it falls back to the single-column, in-order stack, which remains the mobile-first base case rather than a degraded fallback.
- **No CSS framework** (no Tailwind/Bootstrap) — hand-written CSS, consistent with a hand-designed (not templated) look.
- Exact font/color values are an implementation-time decision, made via the `frontend-design` skill per the standard workflow, not fixed in this spec.

## Architecture

Static site generator: **Eleventy (11ty)**, chosen over two alternatives:

| Option | Verdict |
|---|---|
| Plain HTML/CSS/JS, no build | Rejected — zero setup, but nav/footer would be hand-duplicated across any future page (e.g. Projects), fighting the explicit scope decision above to keep that extension cheap. |
| Jekyll | Rejected — GitHub's native zero-config SSG, but Ruby/Liquid templating fights a fully custom, hand-designed look; also the least familiar tooling for this user. |
| **Eleventy + GitHub Actions** | **Chosen** — templating/partials avoid duplication like Jekyll, but JS-based tooling matches the user's existing stack familiarity (Vite/React, Next.js projects), and output is plain static HTML/CSS/JS with full design control. One-time setup cost (~20-30 min) for the win of a real dev loop and clean extension path. |

### Project layout

```
markusluisflores.github.io/
├── src/
│   ├── _layouts/
│   │   └── base.njk          # shared <head>, nav, footer, theme-toggle script
│   ├── _data/
│   │   └── resume.json       # all resume content (experience, skills, education, links)
│   ├── assets/
│   │   ├── css/style.css     # hand-written, custom-property-driven theme
│   │   ├── js/theme-toggle.js
│   │   ├── js/scroll-reveal.js
│   │   ├── js/nav-spy.js
│   │   ├── js/skill-filter.js
│   │   └── resume.pdf        # downloadable PDF
│   └── index.njk             # the one page, pulls from resume.json via layout
├── .eleventy.js               # Eleventy config (input/output dirs, passthrough copy)
├── package.json
└── .github/workflows/
    ├── ci.yml                 # lint, HTML validation, link check, Lighthouse, CodeQL, npm audit — runs on PRs
    └── deploy.yml              # build with Eleventy, publish _site/ to Pages — runs on push to main
```

Resume content lives in `resume.json`, separate from templates, so editing a job entry or skill is a data change, not a markup change. This is also what makes a future Projects section cheap: a `projects.json` + a new template, reusing the existing layout/nav.

## Quality, testing & CI

No unit tests — there's no application logic, just presentational markup driven by data. Instead:

- **HTML validation** via `html-validate` — catches broken markup.
- **Broken-link check** — catches a dead GitHub/LinkedIn/PDF link before it ships.
- **Lighthouse CI** — fails the build if the accessibility score drops below **90** (performance/SEO scores are reported but non-blocking) — relevant because this site is itself a professional signal.
- The Eleventy build succeeding is itself a check (a broken Nunjucks template or malformed `resume.json` fails the build).

All of the above run in `ci.yml` on every PR.

Quality baseline, scoped to what applies to a static JS-tooling project (per the standard New Project checklist):

- **Pre-commit**: husky + lint-staged running ESLint (the small amount of vanilla JS), Prettier (HTML/CSS/JS/JSON), Stylelint (CSS).
- **Commit-msg linting**: commitlint hook per the global git commit standard, applied in full — no deviations for this repo.
- **Secret scanning**: gitleaks pre-commit + GitHub push protection.
- **SAST**: CodeQL for JavaScript in CI.
- **Dependency scan**: Dependabot + `npm audit` in CI.
- **Auto-delete merged branches**: repository setting.
- **Type checking: skipped.** No TypeScript in this project — only a handful of vanilla JS lines for the theme toggle; not worth introducing a type system for that.

Not adopted for this project (assessed and declined at project start): RFCs, AGENTS.md, log4brains (all overkill for a solo, low-ADR-volume project), multi-model-review (optional; skipped as unnecessary for a static site with no business logic).

## Deployment

- Repo's Pages source set to **"GitHub Actions"** (not legacy "deploy from branch") so the Eleventy build runs before publishing.
- `deploy.yml` triggers on push to `main`, using the standard two-step Pages deploy pattern: `npm ci` → `npx @11ty/eleventy` → `actions/upload-pages-artifact` packages `_site/` as a Pages artifact → a separate `actions/deploy-pages` step deploys that artifact. Requires `pages: write` and `id-token: write` workflow permissions.
- No custom domain for now — stays on `markusluisflores.github.io`; a `CNAME` file can be added later if wanted.
- Hosting stays free throughout, contingent on the repo remaining public (per the Constraints section above).

## Out of scope (for this iteration)

- Projects/portfolio section content (architecture supports adding it later; not built now).
- Blog/writing section.
- Custom domain.
- Contact form (static site has no backend; would need a third-party form service if added later).

## Open inputs needed before/during implementation

- User's existing resume content, to populate `resume.json`.
- A PDF version of the resume, for `src/assets/resume.pdf`.
- Exact font and color choices — to be made during implementation via the `frontend-design` skill.
- Favicon — either user-supplied, or generated during implementation the same way `og:image` is (a simple generated card), rather than user-supplied by default.
