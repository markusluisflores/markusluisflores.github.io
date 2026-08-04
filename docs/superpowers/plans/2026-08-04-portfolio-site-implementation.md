# Resume/Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `markusluisflores.github.io` into a live, data-driven, single-page resume site built with Eleventy, deployed via GitHub Actions to GitHub Pages.

**Architecture:** Eleventy compiles Nunjucks templates + a JSON data file into static HTML/CSS/JS under `_site/`. No client-side framework; a small vanilla-JS file handles the light/dark theme toggle. GitHub Actions builds and deploys on every push to `main`, and runs quality/security checks on every PR.

**Tech Stack:** Eleventy (11ty), Nunjucks (`.njk`), vanilla CSS/JS, GitHub Actions, ESLint, Stylelint, Prettier, Husky + lint-staged, commitlint, gitleaks, CodeQL, html-validate, linkinator, Lighthouse CI (`@lhci/cli`).

## Global Constraints

- Repo must stay public — GitHub Pages Free only builds from public repos (already public as of this session).
- Static output only — no server-side runtime; any build step runs in CI, not at request time.
- No TypeScript, no unit test framework — the site is presentational markup driven by data, per the spec's explicit decision. "Tests" for this project mean: build succeeds, `html-validate` passes, links resolve, Lighthouse accessibility ≥ 90, ESLint/Stylelint pass.
- Commits follow `git-commit-standard.md` in full, including the `Co-Authored-By: Claude` trailer — no deviations for this repo.
- No CSS framework (no Tailwind/Bootstrap) — hand-written CSS only.
- Content lives in `src/_data/resume.json`, never hand-duplicated into templates.

---

## Task 1: Project scaffolding — Eleventy + npm

**Files:**
- Create: `package.json`
- Create: `.eleventy.js`
- Create: `.gitignore` (extend the existing one)
- Create: `src/index.njk` (temporary placeholder, replaced fully in Task 4)
- Create: `.nvmrc`

**Interfaces:**
- Produces: `npm run build` → compiles `src/` to `_site/`. `npm run serve` → local dev server. Both consumed by every later task and by CI.

- [ ] **Step 1: Initialize package.json and install Eleventy**

```bash
npm init -y
npm install --save-dev @11ty/eleventy
```

- [ ] **Step 2: Set package.json scripts**

Edit `package.json`, replace the `"scripts"` block:

```json
"scripts": {
  "build": "eleventy",
  "serve": "eleventy --serve",
  "lint": "eslint src/assets/js .eleventy.js && stylelint \"src/assets/css/**/*.css\""
}
```

- [ ] **Step 3: Create `.eleventy.js`**

```js
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.setNunjucksEnvironmentOptions({
    trimBlocks: true,
    lstripBlocks: true,
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
    },
  };
};
```

`trimBlocks`/`lstripBlocks` matter later: without them, every `{% for %}`/`{% if %}`/`{% import %}` tag leaves a blank line behind in the rendered HTML (Nunjucks' default whitespace behavior), which html-validate's default `no-trailing-whitespace` rule rejects.

- [ ] **Step 4: Pin the Node version**

Create `.nvmrc`:

```
lts/*
```

- [ ] **Step 5: Extend `.gitignore`**

Append to the existing `.gitignore`:

```
node_modules/
_site/
.cache/
```

- [ ] **Step 6: Create a temporary placeholder page**

Create `src/index.njk`:

```njk
<p>Under construction.</p>
```

- [ ] **Step 7: Verify the build works**

Run: `npm run build`
Expected: exits 0, creates `_site/index.html` containing `<p>Under construction.</p>`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .eleventy.js .nvmrc .gitignore src/index.njk
git commit -m "chore(build): scaffold Eleventy project

Sets up the static site generator chosen in ADR-001 — npm project,
Eleventy config with src/ as input and _site/ as output, passthrough
copy for static assets. Placeholder page only; real content lands in
Task 4.

Consists of:
- package.json: Eleventy dependency + build/serve scripts
- .eleventy.js: input/output dirs, layouts dir, asset passthrough
- src/index.njk: temporary placeholder, replaced in Task 4"
```

---

## Task 2: Quality baseline tooling

**Files:**
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`
- Create: `commitlint.config.mjs`
- Create: `eslint.config.js`
- Create: `.stylelintrc.json`
- Create: `.prettierrc`
- Modify: `package.json` (add `lint-staged` block, `prepare` script)

**Interfaces:**
- Produces: a `pre-commit` hook that blocks a bad commit before it's created — consumed by every later task's own commit step (a step in a later task that violates lint/format rules will fail here, not in CI).

- [ ] **Step 1: Install tooling**

```bash
npm install --save-dev husky lint-staged eslint @eslint/js stylelint stylelint-config-standard prettier @commitlint/cli @commitlint/config-conventional
npx husky init
```

- [ ] **Step 2: Add lint-staged config and prepare script to package.json**

Add alongside existing `"scripts"`:

```json
"scripts": {
  "build": "eleventy",
  "serve": "eleventy --serve",
  "lint": "eslint src/assets/js .eleventy.js && stylelint \"src/assets/css/**/*.css\"",
  "prepare": "husky"
},
"lint-staged": {
  "*.js": ["eslint --fix", "prettier --write"],
  "*.css": ["stylelint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

Note: `.njk` templates are intentionally excluded — Prettier has no Nunjucks parser and would corrupt them.

- [ ] **Step 3: Write ESLint config**

Create `eslint.config.js`:

```js
const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: [".eleventy.js", "scripts/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
  {
    files: ["src/assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
];
```

Two separate blocks, not one shared one: Node/CommonJS files (`.eleventy.js`, `scripts/**/*.js`, and `eslint.config.js` itself — otherwise the config can't lint itself once it's staged in Step 9's commit) need `require`/`module`/`__dirname`/`process` globals and no browser globals; browser-run files (`src/assets/js/**/*.js`) need the reverse. Mixing them into one globals list would let each file type reference the other's globals without ESLint catching a real mistake (e.g. `document` accidentally used inside a Node script).

- [ ] **Step 4: Write Stylelint and Prettier configs**

Create `.stylelintrc.json`:

```json
{
  "extends": "stylelint-config-standard"
}
```

Create `.prettierrc`:

```json
{
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 5: Write commitlint config**

Create `commitlint.config.mjs`:

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always",
      ["feat", "fix", "ci", "refactor", "test", "docs", "chore", "perf", "style", "migration"]],
    "header-max-length": [2, "always", 72],
    "subject-case": [0],
  },
};
```

- [ ] **Step 6: Wire up Husky hooks**

Create `.husky/pre-commit`:

```bash
npx lint-staged
```

Create `.husky/commit-msg`:

```bash
npx --no -- commitlint --edit $1
```

- [ ] **Step 7: Install gitleaks and add it to pre-commit**

Run (if not already installed on this machine): `winget install Gitleaks.Gitleaks`

Edit `.husky/pre-commit` to run gitleaks first:

```bash
gitleaks protect --staged --verbose
npx lint-staged
```

- [ ] **Step 8: Verify the pre-commit hook actually blocks a bad commit**

```bash
echo "const x = 1" > src/assets/js/_tmp-lint-test.js
git add src/assets/js/_tmp-lint-test.js
git commit -m "bad commit message"
```

Expected: commit-msg hook rejects the message (commitlint `type-enum` failure). Then:

```bash
git reset
rm src/assets/js/_tmp-lint-test.js
```

- [ ] **Step 9: Commit**

```bash
git add .husky commitlint.config.mjs eslint.config.js .stylelintrc.json .prettierrc package.json package-lock.json
git commit -m "chore: add pre-commit hooks, linting, and commit-msg enforcement

Implements the quality baseline from the design spec: Husky +
lint-staged for pre-commit ESLint/Stylelint/Prettier, gitleaks for
secret scanning, commitlint enforcing git-commit-standard.md's
type(scope) format at commit time. No TypeScript in this project, so
no tsc step — matches the spec's explicit decision to skip type
checking.

Consists of:
- .husky/pre-commit: gitleaks + lint-staged
- .husky/commit-msg: commitlint
- eslint.config.js, .stylelintrc.json, .prettierrc: linter/formatter config
- commitlint.config.mjs: enforces git-commit-standard.md's type-enum"
```

---

## Task 3: Resume data

**Files:**
- Create: `src/_data/resume.json`

**Interfaces:**
- Produces: global Eleventy data object `resume` (Eleventy convention: any file under `src/_data/` is exposed globally to all templates, keyed by filename) — consumed by `src/_layouts/base.njk` and `src/index.njk` in Task 4.

- [ ] **Step 1: Write resume.json with real content**

Create `src/_data/resume.json`:

```json
{
  "name": "Markus Luis Flores",
  "title": "Software Developer",
  "tagline": "Software Developer with 5+ years of experience building and maintaining large-scale SaaS applications — from full-stack feature development to test automation and quality engineering.",
  "location": "Calgary, Alberta, Canada",
  "links": {
    "email": "markuslsflores@gmail.com",
    "github": "https://github.com/markusluisflores",
    "linkedin": "https://www.linkedin.com/in/markusluisflores/"
  },
  "experience": [
    {
      "role": "SDET – Quality Engineer",
      "company": "Royal Bank of Canada (RBC)",
      "dates": "May 2025 – Present",
      "bullets": [
        "Develop and execute comprehensive test strategies and technical solutions for Wealth Management Technology.",
        "Collaborate in Agile ceremonies to align QA efforts with project deliverables.",
        "Design optimized test cases, leveraging automation frameworks to support end-to-end and integration testing.",
        "Automate and maintain regression suites using Selenium and internal testing tools.",
        "Manage test execution and defect triage, providing test documentation and status updates to stakeholders.",
        "Support server deployments by configuring environments, validating builds, and performing post-deployment checks."
      ]
    },
    {
      "role": "Software Engineer",
      "company": "Infor PSSC, Inc.",
      "dates": "Dec 2018 – June 2023",
      "bullets": [
        "Designed and developed new features and enhancements for Infor's SaaS Human Capital Management (HCM) platform based on business requirements.",
        "Maintained and improved existing HCM modules using Agile and object-oriented programming (OOP) practices.",
        "Led code reviews through meetings, Crucible, and GitLab. Maintained release versions code using AccuRev and Git.",
        "Authored functional and technical design documents, user documentation, and client knowledge transfer (KT) materials.",
        "Collaborated with Business Analysts and Product Owners to influence design decisions and deliver customer solutions.",
        "Supported QA teams by preparing detailed test cases, contributing to automation scripts, and ensuring coverage for functional and regression testing."
      ]
    }
  ],
  "skills": [
    { "category": "Frontend", "items": ["HTML", "CSS", "Tailwind CSS", "React.js", "Next.js", "JavaScript", "TypeScript", "Mantine"] },
    { "category": "Backend", "items": ["Java", "PHP", "Node.js", "SQL", "NoSQL", "Docker"] },
    { "category": "AI Tools", "items": ["Claude Code", "Copilot", "Cursor", "n8n"] },
    { "category": "Testing", "items": ["Selenium", "Playwright", "Postman"] },
    { "category": "Others", "items": ["Git", "RESTful API", "Jira", "Trello", "Confluence", "Agile Scrum Methodology", "AccuRev"] },
    { "category": "Soft Skills", "items": ["Problem-solving", "Detail-oriented", "Critical thinking", "Adaptability", "Communication", "Collaboration/Teamwork"] }
  ],
  "education": [
    {
      "degree": "Diploma in Software Development",
      "school": "Southern Alberta Institute of Technology (SAIT)",
      "location": "Calgary, Alberta",
      "dates": "Sept 2023 – April 2025",
      "note": "With Honours"
    },
    {
      "degree": "Bachelor of Science in Information Technology",
      "school": "De La Salle University",
      "location": "Manila, Philippines",
      "dates": "May 2014 – August 2018",
      "note": "5x Dean's Lister"
    }
  ]
}
```

- [ ] **Step 2: Verify it's valid JSON and Eleventy picks it up**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/_data/resume.json'))"
npm run build
```

Expected: both exit 0. (The build still renders the Task 1 placeholder — `resume` isn't consumed by a template until Task 4 — this step only confirms the data file itself is valid and doesn't break the build.)

- [ ] **Step 3: Commit**

```bash
git add src/_data/resume.json
git commit -m "feat(data): add resume content as structured data

Adds the real resume content (experience, skills, education, contact
links) as Eleventy global data, sourced from the user's existing
resume PDF. Kept separate from templates so future edits are data
changes, not markup changes — also what makes a future Projects
section cheap (a sibling projects.json, per the design spec).

Consists of:
- src/_data/resume.json: name/title/tagline, links, 2 experience
  entries, 6 skill categories, 2 education entries"
```

---

## Task 4: Base layout + head metadata + page content

**Files:**
- Create: `src/_includes/contact-links.njk`
- Create: `src/_layouts/base.njk`
- Modify: `src/index.njk` (replace placeholder with real content)

**Interfaces:**
- Consumes: `resume` global data object (Task 3) — exact shape: `resume.name`, `resume.title`, `resume.tagline`, `resume.location`, `resume.links.{email,github,linkedin}`, `resume.experience[].{role,company,dates,bullets[]}`, `resume.skills[].{category,items[]}`, `resume.education[].{degree,school,location,dates,note}` (note: `resume.location` and `edu.location` are unrelated fields on different objects — don't conflate them).
- Produces: page markup with hooks `data-theme-toggle` (button elements, consumed by Task 6's JS), `.contact-link` elements (icon + text, consumed by Task 5's CSS), and `id="experience"` / `id="skills"` / `id="education"` (anchor targets for nav, consumed by Task 5's CSS for sticky-header offset).

- [ ] **Step 1: Write the shared contact-links macro**

The spec requires contact links as icon+text in both the Hero and the footer — rather than duplicating three anchors twice (which is exactly the kind of repeated cross-cutting markup that drifts out of sync), write it once as a Nunjucks macro and call it from both places.

Create `src/_includes/contact-links.njk`:

```njk
{% macro contactLinks(links) %}
<a href="mailto:{{ links.email }}" class="contact-link">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 4h20v16H2V4zm2 2v.01L12 12l8-5.99V6H4zm16 12V8.24l-8 6-8-6V18h16z"/></svg>
  <span>Email</span>
</a>
<a href="{{ links.github }}" class="contact-link">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>
  <span>GitHub</span>
</a>
<a href="{{ links.linkedin }}" class="contact-link">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
  <span>LinkedIn</span>
</a>
{% endmacro %}
```

Icons use `fill="currentColor"` so they automatically inherit the surrounding link's text color — no separate icon-color CSS needed per theme.

- [ ] **Step 2: Write the base layout**

Create `src/_layouts/base.njk`:

```njk
{% import "contact-links.njk" as contact %}
{% set pageTitle = title or (resume.name + " — " + resume.title) %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ pageTitle }}</title>
  <meta name="description" content="{{ description or resume.tagline }}">
  <meta property="og:title" content="{{ pageTitle }}">
  <meta property="og:description" content="{{ description or resume.tagline }}">
  <meta property="og:image" content="/assets/og-image.svg">
  <meta property="og:type" content="website">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
  <script>
    (function () {
      var stored = localStorage.getItem("theme");
      var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);
    })();
  </script>
</head>
<body>
  <header class="site-header">
    <nav class="site-nav">
      <a href="#experience">Experience</a>
      <a href="#skills">Skills</a>
      <a href="#education">Education</a>
    </nav>
    <button type="button" class="theme-toggle" data-theme-toggle aria-label="Toggle dark and light theme">🌓</button>
  </header>

  <main>
    {{ content | safe }}
  </main>

  <footer class="site-footer">
    <div class="footer-links">
      {{ contact.contactLinks(resume.links) }}
    </div>
    <a class="download-resume" href="/assets/resume.pdf" download>Download Resume (PDF)</a>
    <button type="button" class="theme-toggle" data-theme-toggle aria-label="Toggle dark and light theme">🌓</button>
  </footer>

  <script src="/assets/js/theme-toggle.js"></script>
</body>
</html>
```

Note: the theme-detection `<script>` in `<head>` is deliberately inline and unminified/unbundled — it must run synchronously before first paint to avoid a flash of the wrong theme (per the spec). `theme-toggle.js` (Task 6) is loaded separately at the end of `<body>` and only handles the click interaction.

Note: the Google Fonts `<link>` tags load Space Grotesk and Inter — Task 5's CSS declares these font-family names, but without this `<link>` nothing actually fetches them and every browser silently falls back to `system-ui`. The `preconnect` hints reduce the connection-setup cost since these are the first cross-origin requests the page makes.

- [ ] **Step 3: Replace the placeholder page with real content**

Replace `src/index.njk` entirely:

```njk
---
layout: base.njk
---
{% import "contact-links.njk" as contact %}
<section class="hero">
  <h1>{{ resume.name }}</h1>
  <p class="hero-title">{{ resume.title }} · {{ resume.location }}</p>
  <p class="hero-tagline">{{ resume.tagline }}</p>
  <div class="hero-links">
    {{ contact.contactLinks(resume.links) }}
  </div>
</section>

<section id="experience" class="experience">
  <h2>Experience</h2>
  <ol class="timeline">
    {% for job in resume.experience %}
    <li class="timeline-entry">
      <h3>{{ job.role }}</h3>
      <p class="timeline-meta">{{ job.company }} · {{ job.dates }}</p>
      <ul>
        {% for bullet in job.bullets %}
        <li>{{ bullet }}</li>
        {% endfor %}
      </ul>
    </li>
    {% endfor %}
  </ol>
</section>

<section id="skills" class="skills">
  <h2>Skills</h2>
  {% for group in resume.skills %}
  <div class="skill-group">
    <h3>{{ group.category }}</h3>
    <ul class="skill-chips">
      {% for item in group.items %}
      <li class="chip">{{ item }}</li>
      {% endfor %}
    </ul>
  </div>
  {% endfor %}
</section>

<section id="education" class="education">
  <h2>Education</h2>
  {% for edu in resume.education %}
  <div class="education-entry">
    <h3>{{ edu.degree }}</h3>
    <p>{{ edu.school }} · {{ edu.location }} · {{ edu.dates }}</p>
    {% if edu.note %}<p class="education-note">{{ edu.note }}</p>{% endif %}
  </div>
  {% endfor %}
</section>
```

Note: `title`/`description` are deliberately absent from this front matter, not just the `description` line — both would otherwise hand-duplicate `resume.name`/`resume.title`/`resume.tagline`, violating this plan's own Global Constraint ("never hand-duplicated into templates"). `base.njk`'s existing `{{ title or (resume.name + " — " + resume.title) }}` and `{{ description or resume.tagline }}` fallbacks already cover this page entirely; a future page (e.g. Projects) can still override either via its own front matter.

- [ ] **Step 4: Build and verify the real content renders**

```bash
npm run build
grep -c "Royal Bank of Canada" _site/index.html
grep -c "data-theme-toggle" _site/index.html
grep -c "og:image" _site/index.html
grep -c "contact-link" _site/index.html
grep -c "fonts.googleapis.com" _site/index.html
npx html-validate "_site/**/*.html"
```

Expected: build exits 0; each `grep -c` returns a count ≥ 1. `data-theme-toggle` returns 2 (header + footer buttons). `contact-link` returns 6 (3 links × 2 places — Hero and footer both call the macro). `html-validate` exits 0 (confirms the uppercase `DOCTYPE` and `type="button"` fixes hold against the real build output, not just the reconstruction this plan was checked against).

- [ ] **Step 5: Commit**

```bash
git add src/_includes/contact-links.njk src/_layouts/base.njk src/index.njk
git commit -m "feat: build the resume page from layout and real data

Implements the spec's content sections (Hero, Experience, Skills,
Education, Footer) as Nunjucks templates consuming resume.json. Head
metadata (title, description, OG tags, favicon link, Google Fonts
Space Grotesk/Inter) lives in the shared layout so it doesn't need
repeating per page. Theme toggle appears in both header and footer as
two type=\"button\" elements sharing one data-theme-toggle hook, wired
up fully in Task 6. Contact links (Email, GitHub, LinkedIn) render as
icon+text per the spec, via one shared macro called from both the
Hero and the footer rather than duplicated markup. DOCTYPE is
uppercase per html-validate's default doctype-style rule.

Consists of:
- src/_includes/contact-links.njk: shared icon+text contact-link macro
- src/_layouts/base.njk: head metadata, nav, header/footer, FOUC-safe
  inline theme-detection script
- src/index.njk: Hero/Experience/Skills/Education sections, replaces
  Task 1's placeholder"
```

---

## Task 5: Visual design system (CSS)

**Files:**
- Create: `src/assets/css/style.css`

**Interfaces:**
- Consumes: the class names and `id`s from Task 4's templates (`.site-header`, `.site-nav`, `.theme-toggle`, `.hero`, `.hero-title`, `.hero-tagline`, `.hero-links`, `.contact-link` (from the shared macro), `#experience .timeline`, `.timeline-entry`, `.timeline-meta`, `#skills .skill-group`, `.skill-chips`, `.chip`, `#education .education-entry`, `.education-note`, `.site-footer`, `.footer-links`, `.download-resume`).
- Produces: the `data-theme` attribute contract — `:root[data-theme="dark"]` / `:root[data-theme="light"]` selectors, consumed by Task 6's JS (which only ever toggles the attribute value, never touches CSS directly).

Before writing CSS, invoke the `frontend-design` skill (per the global workflow — implementation-time UI code requires it) to validate or refine the typography pairing and accent color proposed below against the "modern & distinctive" direction approved in the spec.

- [ ] **Step 1: Invoke frontend-design to confirm/refine the palette and type pairing**

Proposed starting point (confirm or adjust via the skill): display font **Space Grotesk** paired with body font **Inter**; one accent color, a warm terracotta (`#a3423b` light / `#e08a7d` dark) rather than a default blue, consistent with the spec's "one deliberate accent color" requirement.

- [ ] **Step 2: Write the CSS custom-property theme system**

Create `src/assets/css/style.css`:

```css
:root {
  --bg: #fdfdfc;
  --surface: #fff;
  --text: #1a1a1a;
  --text-muted: #5a5a5a;
  --accent: #a3423b;
  --border: #e5e2dd;
}

:root[data-theme="dark"] {
  --bg: #16171a;
  --surface: #1e2024;
  --text: #f2f1ee;
  --text-muted: #a6a6a6;
  --accent: #e08a7d;
  --border: #2c2e33;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

h1,
h2,
h3 {
  font-family: "Space Grotesk", Inter, system-ui, sans-serif;
}
```

- [ ] **Step 3: Style the header, nav, and theme toggle**

Append to `style.css`:

```css
.site-header {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  z-index: 10;
}

.site-nav a {
  color: var(--text);
  text-decoration: none;
  margin-right: 1.25rem;
}

.site-nav a:hover {
  color: var(--accent);
}

.theme-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
}

.theme-toggle:hover {
  border-color: var(--accent);
}
```

- [ ] **Step 4: Style the hero, sections, and content**

Append to `style.css`:

```css
main {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.hero {
  padding: 3rem 0 2rem;
  border-bottom: 3px solid var(--accent);
}

.hero h1 {
  font-size: 2.5rem;
  margin: 0 0 0.25rem;
}

.hero-title {
  color: var(--accent);
  font-weight: 600;
  margin: 0 0 1rem;
}

.hero-tagline {
  color: var(--text-muted);
  max-width: 60ch;
}

.hero-links,
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text);
  text-decoration: none;
}

.contact-link:hover {
  color: var(--accent);
}

section {
  padding: 2.5rem 0;
  border-bottom: 1px solid var(--border);
}

.timeline {
  list-style: none;
  padding: 0;
}

.timeline-entry {
  margin-bottom: 2rem;
  padding-left: 1rem;
  border-left: 2px solid var(--accent);
}

.timeline-meta {
  color: var(--text-muted);
  margin: 0.15rem 0 0.75rem;
}

.skill-group {
  margin-bottom: 1.5rem;
}

.skill-chips {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0;
}

.chip {
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.9rem;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.chip:hover {
  background: var(--accent);
  color: var(--bg);
}

.education-entry {
  margin-bottom: 1.5rem;
}

.education-note {
  color: var(--accent);
  font-weight: 600;
}
```

- [ ] **Step 5: Style the footer and add reduced-motion-respecting transitions**

Append to `style.css`:

```css
.site-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1.5rem;
  text-align: center;
}

.download-resume {
  color: var(--bg);
  background: var(--accent);
  padding: 0.6rem 1.25rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
}

@media (prefers-reduced-motion: no-preference) {
  section {
    animation: fade-in 0.4s ease-in;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

- [ ] **Step 6: Add narrow-viewport styling**

The spec names "mobile-first" as a requirement; the sticky header (3 nav links + a toggle button in a flex row) is the element most likely to break on a narrow screen. Append to `style.css`:

```css
@media (width <= 640px) {
  .site-header {
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }

  .site-nav a {
    margin-right: 0.75rem;
  }

  .hero h1 {
    font-size: 1.875rem;
  }
}
```

- [ ] **Step 7: Verify Stylelint passes, the build succeeds, and the header doesn't break narrow**

```bash
npx stylelint "src/assets/css/**/*.css"
npm run build
npm run serve
```

Expected: stylelint and build both exit 0. With the dev server running, open the local URL and resize the browser (or use devtools' device toolbar) down to ~375px width: confirm the header's nav links and theme toggle wrap onto a second line rather than overlapping or clipping, and the hero heading doesn't overflow horizontally. Stop the server (Ctrl+C) when done.

- [ ] **Step 8: Commit**

```bash
git add src/assets/css/style.css
git commit -m "feat(design): implement the modern/distinctive visual system

Space Grotesk + Inter type pairing, a single terracotta accent color
(light/dark variants), CSS custom properties driving the data-theme
attribute contract Task 6's JS toggles. Sticky header, timeline-styled
experience entries, chip-styled skills, reduced-motion-respecting
fade-in transitions, and a narrow-viewport breakpoint for the header —
matching the spec's Visual design system and mobile-first
requirements. No CSS framework, hand-written throughout.

Consists of:
- src/assets/css/style.css: full theme system and page styling"
```

---

## Task 6: Theme toggle interactivity

**Files:**
- Create: `src/assets/js/theme-toggle.js`

**Interfaces:**
- Consumes: `[data-theme-toggle]` buttons (Task 4's templates — both header and footer instances), `:root[data-theme]` attribute contract (Task 5's CSS).
- Produces: click-to-toggle behavior with `localStorage` persistence.

- [ ] **Step 1: Write the toggle script**

Create `src/assets/js/theme-toggle.js`:

```js
(function () {
  var toggles = document.querySelectorAll("[data-theme-toggle]");

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  toggles.forEach(function (button) {
    button.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });
})();
```

- [ ] **Step 2: Verify ESLint passes**

```bash
npx eslint src/assets/js/theme-toggle.js
```

Expected: exits 0.

- [ ] **Step 3: Manual browser verification**

```bash
npm run build
npm run serve
```

Open the printed local URL. Click either theme-toggle button (header or footer): confirm the page switches theme instantly and clicking the *other* button reflects the same state (both read/write the same `data-theme` attribute). Reload the page: confirm the theme choice persisted via `localStorage`. Stop the server (Ctrl+C) when done.

- [ ] **Step 4: Commit**

```bash
git add src/assets/js/theme-toggle.js
git commit -m "feat: wire up the theme toggle click handler

Both header and footer toggle buttons share one data-theme-toggle
hook and one localStorage-persisted state, so clicking either updates
both — matches the spec's 'one logical control, two visual instances'
requirement. Deliberately separate from base.njk's inline FOUC-
prevention script (Task 4), which only sets the initial theme before
first paint.

Consists of:
- src/assets/js/theme-toggle.js: click handler + localStorage sync"
```

---

## Task 7: Static assets — favicon, OG image, PDF resume

**Files:**
- Create: `src/assets/favicon.svg`
- Create: `src/assets/og-image.svg` (source; rasterized in Step 3, not referenced directly by any template)
- Create: `src/assets/og-image.png` (the actual referenced asset)
- Create: `scripts/generate-og-image.js`
- Create: `src/assets/resume.pdf` (copied from the user's existing file)

**Interfaces:**
- Produces: the asset paths referenced in Task 4's `base.njk` — `/assets/favicon.svg`, `/assets/og-image.png` (not `.svg` — see Step 3), `/assets/resume.pdf`. Task 4's `og:image` meta tag must point at the `.png`, not the `.svg`.

- [ ] **Step 1: Create the favicon**

Create `src/assets/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#a3423b"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#fdfdfc" text-anchor="middle">MF</text>
</svg>
```

SVG favicons are broadly supported by browsers, so no rasterization needed here — unlike the OG image below, which specifically needs to work with social-platform crawlers.

- [ ] **Step 2: Create the OG share-card source image**

Create `src/assets/og-image.svg` (1200×630, the standard OG image dimension):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#a3423b"/>
  <text x="80" y="300" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="72" font-weight="700" fill="#fdfdfc">Markus Luis Flores</text>
  <text x="80" y="370" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="36" fill="#fdfdfc">Software Developer</text>
</svg>
```

Note: the font stack leads with `DejaVu Sans`/`Liberation Sans` rather than just `Arial` — this SVG gets rasterized by `sharp` in Step 3, running on GitHub Actions' `ubuntu-latest` runner in Task 8's CI, which typically doesn't have Arial installed; DejaVu Sans and Liberation Sans are commonly preinstalled there, so the rendered PNG doesn't silently fall back to a generic system font. (The favicon in Step 1 keeps `Arial, sans-serif` — it's served directly to browsers, not rasterized at build time, so this concern doesn't apply there.)

- [ ] **Step 3: Rasterize it to PNG**

Facebook's and LinkedIn's Open Graph crawlers commonly reject or ignore SVG for `og:image` (documented preference for jpg/png/gif) — and the spec's stated reason for having an OG image at all is specifically so LinkedIn shares look polished, so shipping raw SVG there would defeat its own purpose. Rasterize at asset-creation time instead:

```bash
npm install --save-dev sharp
```

Create `scripts/generate-og-image.js`:

```js
const sharp = require("sharp");
const path = require("path");

sharp(path.join(__dirname, "..", "src", "assets", "og-image.svg"))
  .png()
  .toFile(path.join(__dirname, "..", "src", "assets", "og-image.png"))
  .then(() => console.log("og-image.png generated"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

Run it once now to generate the file:

```bash
node scripts/generate-og-image.js
```

Add a script entry to `package.json` so it re-runs automatically before every build, and widen the `lint` script now that `scripts/` exists (Task 2's ESLint config already covers this path — see Task 2 — but the `lint` script's CLI invocation needs to list it too, or `npx eslint` won't check it). Update the `"scripts"` block from Task 1/2:

```json
"scripts": {
  "build": "eleventy",
  "serve": "eleventy --serve",
  "lint": "eslint src/assets/js .eleventy.js scripts && stylelint \"src/assets/css/**/*.css\"",
  "prepare": "husky",
  "prebuild": "node scripts/generate-og-image.js"
}
```

Note: `scripts` couldn't be added to `lint` back in Task 1/2 — at that point in the build order, the `scripts/` directory didn't exist yet, and `eslint` errors out (not just warns) on a path pattern matching zero files. Confirmed empirically: `npx eslint nonexistent-dir` exits with "No files matching the pattern... were found," not a silent no-op.

- [ ] **Step 4: Point Task 4's og:image meta tag at the PNG**

In `src/_layouts/base.njk` (written in Task 4), change:

```njk
<meta property="og:image" content="/assets/og-image.svg">
```

to:

```njk
<meta property="og:image" content="/assets/og-image.png">
```

- [ ] **Step 5: Copy the real PDF resume — requires human hand-off, not just a checkbox**

Unlike every other step in this plan, this one cannot be completed by an implementer working from this document alone, zero-context or not — the source file's location on disk is a personal path and is deliberately not recorded here (a real privacy constraint, not a missing detail this plan failed to specify). This is the same category of gap the spec's own "Open inputs needed" section already names for the resume content and font/color choices: something that has to come from the user directly at execution time. Whoever executes this task needs the real path supplied to them in that session before this step can run; if it's missing, stop and ask rather than guessing or skipping. Once supplied, copy the file into `src/assets/resume.pdf`.

- [ ] **Step 6: Verify all assets are copied into the build output**

```bash
npm run build
ls _site/assets/favicon.svg _site/assets/og-image.png _site/assets/resume.pdf
grep -c "og-image.png" _site/index.html
```

Expected: all three files listed (confirms `.eleventy.js`'s passthrough copy from Task 1 is working for binary/non-template assets); `grep -c` returns 1 (confirms Task 4's meta tag was updated, not left pointing at the `.svg`).

- [ ] **Step 7: Commit**

```bash
git add src/assets/favicon.svg src/assets/og-image.svg src/assets/og-image.png scripts/generate-og-image.js package.json package-lock.json src/_layouts/base.njk src/assets/resume.pdf
git commit -m "feat: add favicon, OG share image, and downloadable PDF resume

Favicon and OG image are simple generated SVGs (initials/name on the
accent color) rather than user-supplied, per the spec's stated
fallback. The OG image is rasterized to PNG via sharp at build time
(a prebuild npm script) since social-platform crawlers commonly
reject SVG for og:image — the favicon stays SVG since browsers
support that directly. PDF is the user's real, existing resume file,
copied in as-is.

Consists of:
- src/assets/favicon.svg: browser-tab icon
- src/assets/og-image.svg: 1200x630 social-share card source
- src/assets/og-image.png: rasterized version actually referenced by og:image
- scripts/generate-og-image.js: sharp-based SVG-to-PNG conversion, run via a prebuild script
- src/_layouts/base.njk: og:image meta tag repointed at the .png
- src/assets/resume.pdf: real downloadable resume"
```

---

## Task 8: GitHub Actions workflows — CI, CodeQL, deploy

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/codeql.yml`
- Create: `.github/workflows/deploy.yml`
- Create: `lighthouserc.json`

**Interfaces:**
- Consumes: `npm run build` (Task 1), ESLint/Stylelint configs (Task 2), `src/assets/js`/`src/assets/css` paths (Tasks 5–6).
- Produces: `_site/` published to GitHub Pages on every push to `main`; PR-blocking checks named `build`, `quality`, `lighthouse`, and CodeQL's check — exact names consumed by Task 9's branch-protection required-checks list. Note: GitHub Actions appends the matrix combination to a matrixed job's check name regardless of the job's static `name:` field, so `codeql.yml`'s `name: Analyze code with CodeQL` job with `matrix.language: [javascript-typescript]` actually reports as `Analyze code with CodeQL (javascript-typescript)` — that full string, not the shorter `name:` value, is what Task 9 must require.

- [ ] **Step 1: Write ci.yml**

Create `.github/workflows/ci.yml` (extends the `github-setup` skill's baseline CI template with this project's specific checks — build, lint, HTML validation, broken-link check, dependency audit, and a separate Lighthouse job):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}-${{ github.event.pull_request.number || github.run_id }}
  cancel-in-progress: true

jobs:
  build:
    name: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: site
          path: _site

  quality:
    name: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - run: npm ci
      - run: npx eslint src/assets/js .eleventy.js scripts
      - run: npx stylelint "src/assets/css/**/*.css"
      - run: npm run build
      - run: npx html-validate "_site/**/*.html"
      - run: npx linkinator _site --recurse --skip "https://www.linkedin.com/*"
      - run: npm audit --audit-level=high

  lighthouse:
    name: lighthouse
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npx @lhci/cli autorun
```

Note: `linkinator` skips LinkedIn URLs — LinkedIn blocks automated requests from CI bots (returns non-200 to non-browser clients), which would otherwise cause false-positive failures on a link that works fine for real visitors. `--skip` takes a regular expression, not a glob — `https://www.linkedin.com/*` happens to work here since `.` and `*` are valid (if slightly loose) regex syntax against this specific URL shape, but don't read the trailing `*` as glob wildcard syntax if reusing this pattern elsewhere.

- [ ] **Step 2: Write lighthouserc.json**

Create `lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./_site",
      "url": ["http://localhost/index.html"]
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

- [ ] **Step 3: Install the CI-only tooling used by the workflow**

```bash
npm install --save-dev html-validate linkinator @lhci/cli
```

- [ ] **Step 4: Copy CodeQL workflow verbatim from github-setup templates**

```bash
mkdir -p .github/workflows
cp "~/.claude/skills/github-setup/templates/workflows/codeql.yml" ".github/workflows/codeql.yml"
```

- [ ] **Step 5: Write deploy.yml**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 6: Verify ci.yml locally as much as possible before pushing**

```bash
npx eslint src/assets/js .eleventy.js scripts
npx stylelint "src/assets/css/**/*.css"
npm run build
npx html-validate "_site/**/*.html"
npx linkinator _site --recurse --skip "https://www.linkedin.com/*"
npm audit --audit-level=high
```

Expected: all six commands exit 0 — this is the full `quality` job from `ci.yml` (eslint and stylelint were already exercised individually in Tasks 2/5/6, but running the complete set together here catches anything that only shows up in combination).

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/codeql.yml .github/workflows/deploy.yml lighthouserc.json package.json package-lock.json
git commit -m "ci: add build, quality, CodeQL, and deploy workflows

Secrets required: none — deploy.yml uses the built-in GITHUB_TOKEN via
the pages:write/id-token:write permissions; codeql.yml uses the
built-in GITHUB_TOKEN via security-events:write.
Manual trigger: gh workflow run ci.yml | codeql.yml | deploy.yml

ci.yml runs build/quality/lighthouse jobs on every PR and push to
main. quality covers ESLint, Stylelint, html-validate, a broken-link
check (linkinator, skipping LinkedIn's bot-blocked URLs), and
npm audit. lighthouse enforces an accessibility score >= 90 per the
spec. deploy.yml implements the exact two-step Pages pattern from the
design spec (upload-pages-artifact + deploy-pages).

Consists of:
- .github/workflows/ci.yml: build + quality + lighthouse jobs
- .github/workflows/codeql.yml: copied verbatim from github-setup
- .github/workflows/deploy.yml: Eleventy build -> Pages deploy
- lighthouserc.json: accessibility >= 0.9 assertion"
```

---

## Task 9: GitHub repository configuration

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`
- Create: `.github/dependabot.yml`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Delete: `index.html` (pre-Eleventy placeholder, superseded once Pages serves via Actions)

**Interfaces:** none — this task is GitHub configuration + templates, not code other tasks depend on. Must run after Task 8, since branch protection's required-checks list names jobs Task 8 creates.

- [ ] **Step 1: Copy github-setup's canonical templates**

```bash
mkdir -p .github/ISSUE_TEMPLATE
cp "~/.claude/skills/github-setup/templates/ISSUE_TEMPLATE/bug_report.yml" ".github/ISSUE_TEMPLATE/bug_report.yml"
cp "~/.claude/skills/github-setup/templates/ISSUE_TEMPLATE/feature_request.yml" ".github/ISSUE_TEMPLATE/feature_request.yml"
cp "~/.claude/skills/github-setup/templates/ISSUE_TEMPLATE/config.yml" ".github/ISSUE_TEMPLATE/config.yml"
cp "~/.claude/skills/github-setup/templates/pull_request_template.md" ".github/pull_request_template.md"
cp "~/.claude/skills/github-setup/templates/dependabot.yml" ".github/dependabot.yml"
cp "~/.claude/skills/github-setup/templates/SECURITY.md" "SECURITY.md"
cp "~/.claude/skills/github-setup/templates/CONTRIBUTING.md" "CONTRIBUTING.md"
```

- [ ] **Step 2: Fill in the template placeholders**

Edit `SECURITY.md`: replace `[PROJECT_NAME]` with `markusluisflores.github.io` and `[CONTACT_EMAIL]` with `markuslsflores@gmail.com`.

Edit `CONTRIBUTING.md`: replace `[PROJECT_NAME]` with `markusluisflores.github.io`; replace generic dev commands with `npm install`, `npm run serve` (local dev), `npm run build`, `npm run lint`.

Edit `.github/ISSUE_TEMPLATE/config.yml`: replace `[SECURITY_URL]` with `https://github.com/markusluisflores/markusluisflores.github.io/security/policy`.

- [ ] **Step 3: Create GitHub labels**

```bash
gh label create "bug"              --color "d73a4a" --description "Confirmed defect" --force
gh label create "priority: p0"     --color "b60205" --description "Release blocker" --force
gh label create "priority: p1"     --color "e4e669" --description "Fix before next release" --force
gh label create "priority: p2"     --color "0075ca" --description "Schedule next cycle" --force
gh label create "priority: p3"     --color "cfd3d7" --description "Backlog" --force
gh label create "priority: p4"     --color "ffffff" --description "Won't fix / by design" --force
gh label create "confirmed"        --color "0e8a16" --description "Root cause reproduced" --force
gh label create "needs-repro"      --color "e4e669" --description "Awaiting reproduction steps" --force
gh label create "in-progress"      --color "6f42c1" --description "Fix underway" --force
gh label create "wontfix"          --color "cccccc" --description "Triaged out" --force
gh label create "enhancement"      --color "a2eeef" --description "New feature or improvement" --force
gh label create "documentation"    --color "0075ca" --description "Documentation change" --force
gh label create "security"         --color "b60205" --description "Security vulnerability" --force
gh label create "dependencies"     --color "0075ca" --description "Dependency update" --force
```

- [ ] **Step 4: Configure branch protection**

`gh api`'s `--field`/`-F` does type conversion on scalar values (`true`/`false`/`null`/numbers), but it does **not** parse a JSON-object-shaped string into a nested object — a value like `'{"strict":true,...}'` is sent as a literal string, which GitHub's API rejects (422) since `required_status_checks` must be an actual object. Use bracket field syntax instead (gh's own documented pattern for nested/array fields, e.g. `-F 'files[myfile.txt][content]=@myfile.txt'`):

```bash
gh api repos/markusluisflores/markusluisflores.github.io/branches/main/protection \
  --method PUT \
  -F "required_status_checks[strict]=true" \
  -F "required_status_checks[contexts][]=build" \
  -F "required_status_checks[contexts][]=quality" \
  -F "required_status_checks[contexts][]=lighthouse" \
  -F "required_status_checks[contexts][]=Analyze code with CodeQL (javascript-typescript)" \
  -F "enforce_admins=true" \
  -F "required_pull_request_reviews=null" \
  -F "restrictions=null"
```

- [ ] **Step 5: Enable repository security settings**

```bash
gh api repos/markusluisflores/markusluisflores.github.io --method PATCH -F "delete_branch_on_merge=true"

gh api repos/markusluisflores/markusluisflores.github.io --method PATCH \
  -F "security_and_analysis[secret_scanning][status]=enabled" \
  -F "security_and_analysis[secret_scanning_push_protection][status]=enabled"
```

- [ ] **Step 6: Switch Pages source from legacy branch build to GitHub Actions**

The repo currently serves the placeholder via the legacy branch-based build (set up earlier this session, before Eleventy existed). Now that `deploy.yml` exists, switch the source:

```bash
gh api -X PUT repos/markusluisflores/markusluisflores.github.io/pages -f "build_type=workflow"
```

- [ ] **Step 7: Verify branch protection and Pages source**

```bash
gh api repos/markusluisflores/markusluisflores.github.io/branches/main/protection --jq '.required_status_checks.contexts'
gh api repos/markusluisflores/markusluisflores.github.io/pages --jq '.build_type'
```

Expected: first command lists all 4 contexts from Step 4; second prints `workflow`.

- [ ] **Step 8: Remove the stale placeholder `index.html`**

The root-level `index.html` ("Hello World!") was the pre-Eleventy placeholder that the legacy branch build served. Now that Pages serves `_site/index.html` via the Actions build (Step 6), the root file is dead weight — remove it:

```bash
git rm index.html
```

- [ ] **Step 9: Commit**

```bash
git add .github SECURITY.md CONTRIBUTING.md
git commit -m "chore: add GitHub templates, labels, branch protection, Pages source

Completes the New Project Checklist's github-setup step: issue/PR
templates, Dependabot config, SECURITY.md/CONTRIBUTING.md (with
project-specific placeholders filled in), bug-priority/status/type
labels, branch protection on main requiring the build/quality/
lighthouse/CodeQL checks, secret scanning + push protection, and
auto-delete-merged-branches. Switches the Pages source from the
legacy branch build (set up before this implementation existed) to
the GitHub Actions build deploy.yml now provides, and removes the
now-dead pre-Eleventy placeholder index.html the legacy build used
to serve.

Consists of:
- .github/ISSUE_TEMPLATE/*, pull_request_template.md, dependabot.yml
- SECURITY.md, CONTRIBUTING.md: project-specific placeholders filled
- index.html: removed (superseded by _site/index.html via deploy.yml)"
```

---

## Post-implementation checklist

- [ ] Push the implementation branch and open a PR against `main` (per the global workflow — never push directly to `main`).
- [ ] Confirm `ci.yml`'s three jobs and CodeQL all pass on the PR.
- [ ] Run this plan's own Self-Review (spec coverage, placeholder scan, type/interface consistency, sibling-reuse check) before requesting review.
- [ ] Follow `review-process-standard.md` for the PR review cycle (judgment-surface gate, fresh + resumed rounds, GitHub-mechanic for posting findings) — this plan's tasks are all authored decisions (template structure, CSS values, workflow design), so the skip-review exemption does not apply.
- [ ] After merge, verify the live site at `https://markusluisflores.github.io` actually reflects the new content (per the "check the live version as we go" practice established this session).
