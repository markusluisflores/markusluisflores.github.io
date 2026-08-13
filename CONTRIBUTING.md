# Contributing to markusluisflores.github.io

## Development Setup

```bash
git clone https://github.com/markusluisflores/markusluisflores.github.io.git
cd markusluisflores.github.io
npm install
npm run serve
```

Note: [gitleaks](https://github.com/gitleaks/gitleaks#installing) is required for the pre-commit hook — install via `winget install Gitleaks.Gitleaks` (Windows), `brew install gitleaks` (macOS), or your platform's package manager.

## Branch Naming

| Type    | Pattern               | Example                 |
| ------- | --------------------- | ----------------------- |
| Feature | `feat/<description>`  | `feat/dark-mode`        |
| Bug fix | `fix/<description>`   | `fix/timeline-overflow` |
| Docs    | `docs/<description>`  | `docs/resume-content`   |
| Chore   | `chore/<description>` | `chore/update-deps`     |

## Workflow

1. Branch from `main` — never commit directly to `main`
2. Update resume.json or templates for content/markup changes
3. Run `npm run lint` and `npm run build` — both must succeed before opening a PR
4. Open a PR using the provided template — fill in all sections
5. CI must be green before merge

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add projects section to the resume page
fix: correct chip wrapping on narrow viewports
docs: update CONTRIBUTING with the lint workflow
chore: update Eleventy to v3.2
```

## Print Layout Checklist

This site's print stylesheet (`@media print` in `src/assets/css/style.css`) fights pagination bugs that are easy to reintroduce without noticing, because they're invisible on screen and only show up in an actual paginated export.

**The root cause, if you hit one of these again:** neither Chromium nor WebKit reliably honors `break-inside: avoid` (or `break-after: avoid`) on an element that is itself a flex or CSS Grid item — the browser will still split it across a page boundary. The only pattern that has proven reliable is removing `display: flex`/`display: grid` from the element in question (or its parent formatting context) in favor of plain block flow, then applying the break rules to the resulting block-level elements. `columns:` (CSS multi-column) has the same problem for its columned children and needs to be turned off in print (`columns: unset; display: block;`) rather than fixed with break rules.

Elements currently relying on this pattern — treat any of these as a regression if a future change reintroduces `flex`/`grid`/`columns` on them without re-verifying print output: `.project-card`, `.project-grid`, `.filter-entry ul` / `.filter-entry ul li`, `.timeline-entry h3` / `.timeline-entry .timeline-meta`, `.education-entry`, `main > section > h2`.

**If you touch layout CSS for the Experience, Projects, Volunteer Experience, or Education sections, or anything under `.filter-entry`/`.timeline-entry`, verify print output before opening a PR:**

1. `npm run build`, then open `_site/index.html` in a real browser (not a headless screenshot).
2. Print to PDF (Ctrl/Cmd+P → Save as PDF) and open the result.
3. Check every page break for: a card, list item, or entry split across two pages; a heading or meta line stranded alone at the bottom of a page with its content pushed to the next.
4. Repeat for at least one narrow-content and one long-content scenario (e.g. an active skill filter that leaves few bullets, and no filter active with everything showing) — pagination bugs are content-length-dependent and won't show up in every configuration.

A visual DOM inspection is not sufficient — these bugs only manifest in the browser's actual print layout engine, which differs from screen layout.

## Bug Reports

See [SECURITY.md](SECURITY.md) for security vulnerabilities.
For all other bugs, use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) issue template.
Only file a bug if the defect was found after merge to main or a release — catch-during-development issues are fixed inline.

## Feature Requests

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) issue template.
