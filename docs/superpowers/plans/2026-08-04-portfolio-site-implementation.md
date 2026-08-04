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

  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
    },
  };
};
```

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
    files: ["src/assets/js/**/*.js", ".eleventy.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
];
```

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
- Create: `src/_layouts/base.njk`
- Modify: `src/index.njk` (replace placeholder with real content)

**Interfaces:**
- Consumes: `resume` global data object (Task 3) — exact shape: `resume.name`, `resume.title`, `resume.tagline`, `resume.links.{email,github,linkedin}`, `resume.experience[].{role,company,dates,bullets[]}`, `resume.skills[].{category,items[]}`, `resume.education[].{degree,school,location,dates,note}`.
- Produces: page markup with hooks `data-theme-toggle` (button elements, consumed by Task 6's JS) and `id="experience"` / `id="skills"` / `id="education"` (anchor targets for nav, consumed by Task 5's CSS for sticky-header offset).

- [ ] **Step 1: Write the base layout**

Create `src/_layouts/base.njk`:

```njk
{% set pageTitle = title or (resume.name + " — " + resume.title) %}
<!doctype html>
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
    <button class="theme-toggle" data-theme-toggle aria-label="Toggle dark and light theme">🌓</button>
  </header>

  <main>
    {{ content | safe }}
  </main>

  <footer class="site-footer">
    <div class="footer-links">
      <a href="mailto:{{ resume.links.email }}">Email</a>
      <a href="{{ resume.links.github }}">GitHub</a>
      <a href="{{ resume.links.linkedin }}">LinkedIn</a>
    </div>
    <a class="download-resume" href="/assets/resume.pdf" download>Download Resume (PDF)</a>
    <button class="theme-toggle" data-theme-toggle aria-label="Toggle dark and light theme">🌓</button>
  </footer>

  <script src="/assets/js/theme-toggle.js"></script>
</body>
</html>
```

Note: the theme-detection `<script>` in `<head>` is deliberately inline and unminified/unbundled — it must run synchronously before first paint to avoid a flash of the wrong theme (per the spec). `theme-toggle.js` (Task 6) is loaded separately at the end of `<body>` and only handles the click interaction.

- [ ] **Step 2: Replace the placeholder page with real content**

Replace `src/index.njk` entirely:

```njk
---
layout: base.njk
title: "Markus Luis Flores — Software Developer"
description: "Software Developer with 5+ years of experience building and maintaining large-scale SaaS applications."
---
<section class="hero">
  <h1>{{ resume.name }}</h1>
  <p class="hero-title">{{ resume.title }}</p>
  <p class="hero-tagline">{{ resume.tagline }}</p>
  <div class="hero-links">
    <a href="mailto:{{ resume.links.email }}">Email</a>
    <a href="{{ resume.links.github }}">GitHub</a>
    <a href="{{ resume.links.linkedin }}">LinkedIn</a>
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

- [ ] **Step 3: Build and verify the real content renders**

```bash
npm run build
grep -c "Royal Bank of Canada" _site/index.html
grep -c "data-theme-toggle" _site/index.html
grep -c "og:image" _site/index.html
```

Expected: build exits 0; each `grep -c` returns a count ≥ 1 (RBC appears once, `data-theme-toggle` appears twice — header + footer buttons — `og:image` appears once).

- [ ] **Step 4: Commit**

```bash
git add src/_layouts/base.njk src/index.njk
git commit -m "feat: build the resume page from layout and real data

Implements the spec's content sections (Hero, Experience, Skills,
Education, Footer) as Nunjucks templates consuming resume.json. Head
metadata (title, description, OG tags, favicon link) lives in the
shared layout so it doesn't need repeating per page. Theme toggle
appears in both header and footer as two buttons sharing one
data-theme-toggle hook, wired up fully in Task 6.

Consists of:
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
- Consumes: the class names and `id`s from Task 4's templates (`.site-header`, `.site-nav`, `.theme-toggle`, `.hero`, `.hero-title`, `.hero-tagline`, `.hero-links`, `#experience .timeline`, `.timeline-entry`, `.timeline-meta`, `#skills .skill-group`, `.skill-chips`, `.chip`, `#education .education-entry`, `.education-note`, `.site-footer`, `.footer-links`, `.download-resume`).
- Produces: the `data-theme` attribute contract — `:root[data-theme="dark"]` / `:root[data-theme="light"]` selectors, consumed by Task 6's JS (which only ever toggles the attribute value, never touches CSS directly).

Before writing CSS, invoke the `frontend-design` skill (per the global workflow — implementation-time UI code requires it) to validate or refine the typography pairing and accent color proposed below against the "modern & distinctive" direction approved in the spec.

- [ ] **Step 1: Invoke frontend-design to confirm/refine the palette and type pairing**

Proposed starting point (confirm or adjust via the skill): display font **Space Grotesk** paired with body font **Inter**; one accent color, a warm terracotta (`#a3423b` light / `#e08a7d` dark) rather than a default blue, consistent with the spec's "one deliberate accent color" requirement.

- [ ] **Step 2: Write the CSS custom-property theme system**

Create `src/assets/css/style.css`:

```css
:root {
  --bg: #fdfdfc;
  --surface: #ffffff;
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
  font-family: "Inter", system-ui, sans-serif;
  line-height: 1.6;
}

h1,
h2,
h3 {
  font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
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

.hero-links a {
  color: var(--text);
  margin-right: 1rem;
}

.hero-links a:hover {
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
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.9rem;
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

.footer-links a {
  color: var(--text);
  margin: 0 0.5rem;
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

- [ ] **Step 6: Verify Stylelint passes and the build still succeeds**

```bash
npx stylelint "src/assets/css/**/*.css"
npm run build
```

Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/assets/css/style.css
git commit -m "feat(design): implement the modern/distinctive visual system

Space Grotesk + Inter type pairing, a single terracotta accent color
(light/dark variants), CSS custom properties driving the data-theme
attribute contract Task 6's JS toggles. Sticky header, timeline-styled
experience entries, chip-styled skills, reduced-motion-respecting
fade-in transitions — matching the spec's Visual design system
section. No CSS framework, hand-written throughout.

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
- Create: `src/assets/og-image.svg`
- Create: `src/assets/resume.pdf` (copied from the user's existing file)

**Interfaces:**
- Produces: the two asset paths already referenced in Task 4's `base.njk` (`/assets/favicon.svg`, `/assets/og-image.svg`, `/assets/resume.pdf`) — no interface change needed there, this task just makes those referenced paths resolve to real files.

- [ ] **Step 1: Create the favicon**

Create `src/assets/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#a3423b"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#fdfdfc" text-anchor="middle">MF</text>
</svg>
```

- [ ] **Step 2: Create the OG share-card image**

Create `src/assets/og-image.svg` (1200×630, the standard OG image dimension):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#a3423b"/>
  <text x="80" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#fdfdfc">Markus Luis Flores</text>
  <text x="80" y="370" font-family="Arial, sans-serif" font-size="36" fill="#fdfdfc">Software Developer</text>
</svg>
```

- [ ] **Step 3: Copy the real PDF resume**

The source file's location on disk is a personal path and is deliberately not recorded in this document. Copy the user's existing resume PDF (its path was supplied directly during planning) into `src/assets/resume.pdf`.

- [ ] **Step 4: Verify all three assets are copied into the build output**

```bash
npm run build
ls _site/assets/favicon.svg _site/assets/og-image.svg _site/assets/resume.pdf
```

Expected: all three files listed (confirms `.eleventy.js`'s passthrough copy from Task 1 is working for binary/non-template assets).

- [ ] **Step 5: Commit**

```bash
git add src/assets/favicon.svg src/assets/og-image.svg src/assets/resume.pdf
git commit -m "feat: add favicon, OG share image, and downloadable PDF resume

Favicon and OG image are simple generated SVGs (initials/name on the
accent color) rather than user-supplied, per the spec's stated
fallback. PDF is the user's real, existing resume file, copied in
as-is.

Consists of:
- src/assets/favicon.svg: browser-tab icon
- src/assets/og-image.svg: 1200x630 social-share card
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
- Produces: `_site/` published to GitHub Pages on every push to `main`; PR-blocking checks named `build`, `quality`, `lighthouse`, and CodeQL's `Analyze code with CodeQL` — exact names consumed by Task 9's branch-protection required-checks list.

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
      - run: npx eslint src/assets/js .eleventy.js
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

Note: `linkinator` skips LinkedIn URLs — LinkedIn blocks automated requests from CI bots (returns non-200 to non-browser clients), which would otherwise cause false-positive failures on a link that works fine for real visitors.

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
npm run build
npx html-validate "_site/**/*.html"
npx linkinator _site --recurse --skip "https://www.linkedin.com/*"
npm audit --audit-level=high
```

Expected: all four commands exit 0 (this is everything `ci.yml`'s `quality` job runs, minus the GitHub-Actions-only steps).

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

```bash
gh api repos/markusluisflores/markusluisflores.github.io/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build","quality","lighthouse","Analyze code with CodeQL"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews=null \
  --field restrictions=null
```

- [ ] **Step 5: Enable repository security settings**

```bash
gh api repos/markusluisflores/markusluisflores.github.io --method PATCH --field delete_branch_on_merge=true

gh api repos/markusluisflores/markusluisflores.github.io --method PATCH \
  --field security_and_analysis='{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}'
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

- [ ] **Step 8: Commit**

```bash
git add .github SECURITY.md CONTRIBUTING.md
git commit -m "chore: add GitHub templates, labels, branch protection, Pages source

Completes the New Project Checklist's github-setup step: issue/PR
templates, Dependabot config, SECURITY.md/CONTRIBUTING.md (with
project-specific placeholders filled in), bug-priority/status/type
labels, branch protection on main requiring the build/quality/
lighthouse/CodeQL checks, secret scanning + push protection, and
auto-delete-merged-branches. Also switches the Pages source from the
legacy branch build (set up before this implementation existed) to
the GitHub Actions build deploy.yml now provides.

Consists of:
- .github/ISSUE_TEMPLATE/*, pull_request_template.md, dependabot.yml
- SECURITY.md, CONTRIBUTING.md: project-specific placeholders filled"
```

---

## Post-implementation checklist

- [ ] Push the implementation branch and open a PR against `main` (per the global workflow — never push directly to `main`).
- [ ] Confirm `ci.yml`'s three jobs and CodeQL all pass on the PR.
- [ ] Run this plan's own Self-Review (spec coverage, placeholder scan, type/interface consistency, sibling-reuse check) before requesting review.
- [ ] Follow `review-process-standard.md` for the PR review cycle (judgment-surface gate, fresh + resumed rounds, GitHub-mechanic for posting findings) — this plan's tasks are all authored decisions (template structure, CSS values, workflow design), so the skip-review exemption does not apply.
- [ ] After merge, verify the live site at `https://markusluisflores.github.io` actually reflects the new content (per the "check the live version as we go" practice established this session).
