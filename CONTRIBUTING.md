# Contributing to markusluisflores.github.io

## Development Setup

```bash
git clone https://github.com/markusluisflores/markusluisflores.github.io.git
cd markusluisflores.github.io
npm install
npm run serve
```

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

## Bug Reports

See [SECURITY.md](SECURITY.md) for security vulnerabilities.
For all other bugs, use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) issue template.
Only file a bug if the defect was found after merge to main or a release — catch-during-development issues are fixed inline.

## Feature Requests

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) issue template.
