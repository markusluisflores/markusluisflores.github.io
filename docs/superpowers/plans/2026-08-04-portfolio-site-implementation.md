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

Note: `npm run lint` is **not runnable yet** at this point — `src/assets/js` and `src/assets/css` don't exist until Tasks 5/6 create them, and both `eslint`/`stylelint` error (not warn) on a path pattern matching zero files. Nothing in Tasks 1-4 invokes `npm run lint`, so this doesn't block anything, but don't try running it early while sanity-checking the scaffold.

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
.lighthouseci/
```

`.lighthouseci/` is `@lhci/cli`'s local report/cache directory — not created by anything in this plan's local steps today, but worth having ready before Task 8 introduces it, so reproducing the CI Lighthouse run locally doesn't leave an untracked directory sitting in the repo.

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
- src/index.njk: temporary placeholder, replaced in Task 4

Co-Authored-By: Claude <noreply@anthropic.com>"
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
        IntersectionObserver: "readonly",
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

`src/assets/js/` doesn't exist yet at this point in the build order (Tasks 5/6 create it) — create it first, or this step fails on a missing directory before it even tests anything. The test file must also be lint-clean: `git` runs `pre-commit` (ESLint) *before* `commit-msg` (commitlint), so a lint error never reaches commitlint at all — confirmed empirically: `const x = 1` trips `no-unused-vars` and the commit is blocked by ESLint, not by the commit-message check this step is actually trying to verify. The commit message also needs an invalid *type*, specifically, to trigger `type-enum` — a message with no `type:` prefix at all (like "bad commit message") triggers `subject-empty`/`type-empty` instead, a different rule than what this step originally claimed:

```bash
mkdir -p src/assets/js
echo "window.themeTest = 1;" > src/assets/js/_tmp-lint-test.js
git add src/assets/js/_tmp-lint-test.js
git commit -m "wip: something"
```

Expected: pre-commit passes (the file is lint-clean), then the commit-msg hook rejects the message with a `type-enum` failure — confirmed empirically: `type must be one of [feat, fix, ci, refactor, test, docs, chore, perf, style, migration]`. Then:

```bash
git reset
rm src/assets/js/_tmp-lint-test.js
rmdir src/assets/js src/assets 2>/dev/null || true
```

The trailing `rmdir` cleans up the directory this step created, so it doesn't leave an empty `src/assets/js/` sitting around before Task 5/6 populate it for real — `|| true` because a later task's file (if this step ever runs out of order) would make `rmdir` fail harmlessly on a non-empty directory.

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
- commitlint.config.mjs: enforces git-commit-standard.md's type-enum

Co-Authored-By: Claude <noreply@anthropic.com>"
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
      "dates": "Dec 2018 – Jun 2023",
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
      "dates": "Sep 2023 – Apr 2025",
      "note": "With Honours"
    },
    {
      "degree": "Bachelor of Science in Information Technology",
      "school": "De La Salle University",
      "location": "Manila, Philippines",
      "dates": "May 2014 – Aug 2018",
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
  entries, 6 skill categories, 2 education entries

Co-Authored-By: Claude <noreply@anthropic.com>"
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
{% set siteUrl = "https://markusluisflores.github.io" %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ pageTitle }}</title>
  <meta name="description" content="{{ description or resume.tagline }}">
  <meta property="og:title" content="{{ pageTitle }}">
  <meta property="og:description" content="{{ description or resume.tagline }}">
  <meta property="og:image" content="{{ siteUrl }}/assets/og-image.svg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="{{ siteUrl }}/">
  <meta property="og:type" content="website">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
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
    <button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Toggle dark and light theme">🌓</button>
  </header>

  <main>
    {{ content | safe }}
  </main>

  <footer class="site-footer">
    <div class="footer-links">
      {{ contact.contactLinks(resume.links) }}
    </div>
    <a class="download-resume" href="/assets/resume.pdf" download>Download Resume (PDF)</a>
    <button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Toggle dark and light theme">🌓</button>
  </footer>

  <script src="/assets/js/theme-toggle.js"></script>
</body>
</html>
```

Note: the theme-detection `<script>` in `<head>` is deliberately inline and unminified/unbundled — it must run synchronously before first paint to avoid a flash of the wrong theme (per the spec). `theme-toggle.js` (Task 6) is loaded separately at the end of `<body>` and only handles the click interaction.

Note: the Google Fonts `<link>` tags load Space Grotesk, Inter, and IBM Plex Mono — Task 5's CSS declares these font-family names, but without this `<link>` nothing actually fetches them and every browser silently falls back to `system-ui`/`monospace`. The `preconnect` hints reduce the connection-setup cost since these are the first cross-origin requests the page makes.

IBM Plex Mono is the third family in the pairing, not decoration: Task 5's visual system sets every *label* on the page in it (nav, section headings, skill categories, dates, tags, the download CTA) as a distinct utility register, separate from the display face (names/roles) and the body face (prose). A system-monospace stack (`ui-monospace`/Consolas/Menlo/SF Mono) was considered instead, to avoid the extra font request — rejected because that register carries a lot of visual weight here and its glyph widths and personality would change per operating system, which undermines the point of a site whose job is being a controlled taste signal. The stack in Task 5's `--font-mono` still lists those system faces as fallbacks, so a blocked Google Fonts request degrades to a reasonable monospace rather than to the body face.

Note: `og:image` and `og:url` use the absolute `siteUrl`, not a root-relative path. The [ogp.me spec](https://ogp.me/) requires both `og:image` and `og:url` as absolute URLs — off-site crawlers (LinkedIn, Facebook) fetch `og:image` as a standalone resource, and a relative path is the single most common cause of a social share rendering with no image, which would defeat the entire reason this project has an OG card (per the spec: "a shared link with no OG image/description looks unpolished"). `og:image:width`/`height` match the dimensions Task 7 actually generates (1200×630) and help crawlers render correctly on first scrape without fetching the image first.

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

`html-validate` is used here for the first time, before Task 8 installs the rest of the CI-only tooling — install it now as a devDependency rather than relying on `npx` to auto-fetch an unpinned version from the network on every run:

```bash
npm install --save-dev html-validate
npm run build
grep -c "Royal Bank of Canada" _site/index.html
grep -c "data-theme-toggle" _site/index.html
grep -c "og:url" _site/index.html
grep -c "contact-link" _site/index.html
grep -c "fonts.googleapis.com" _site/index.html
npx html-validate "_site/**/*.html"
```

Expected: build exits 0; each `grep -c` returns a count ≥ 1. `data-theme-toggle` returns 2 (header + footer buttons). `contact-link` returns 6 (3 links × 2 places — Hero and footer both call the macro). `og:url` returns 1 (confirms the absolute-URL OG fix is present — `og:image`'s own count is no longer a clean single-value check since `og:image:width`/`og:image:height` also contain that substring). `html-validate` exits 0 (confirms the uppercase `DOCTYPE` and `type="button"` fixes hold against the real build output, not just the reconstruction this plan was checked against).

- [ ] **Step 5: Commit**

```bash
git add src/_includes/contact-links.njk src/_layouts/base.njk src/index.njk package.json package-lock.json
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
  Task 1's placeholder

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Visual design system (CSS)

**Files:**
- Create: `src/assets/css/style.css`
- Create: `src/assets/js/scroll-reveal.js`
- Modify: `src/_layouts/base.njk` (written in Task 4) — adds the `scroll-reveal.js` script tag and a `<noscript>` fallback

**Interfaces:**
- Consumes: the class names and `id`s from Task 4's templates (`.site-header`, `.site-nav`, `.theme-toggle`, `.hero`, `.hero-title`, `.hero-tagline`, `.hero-links`, `.contact-link` **and the `<span>` inside it** (from the shared macro — the label underline is styled on that span so the inline SVG icon isn't underlined), `#experience .timeline`, `.timeline-entry`, `.timeline-meta`, `#skills .skill-group`, `.skill-chips`, `.chip`, `#education .education-entry`, `.education-note`, `.site-footer`, `.footer-links`, `.download-resume`). Also consumes the *document order* inside `.timeline-entry` (`h3`, then `.timeline-meta`, then `ul`) — Step 5 flips the first two visually with `order`, which only works against that exact order.
- Produces: the `data-theme` attribute contract — `:root[data-theme="dark"]` overrides the unqualified `:root` (light is the base state, not a separate `[data-theme="light"]` selector), consumed by Task 6's JS (which only ever toggles the attribute value, never touches CSS directly). Also produces the `.is-visible` class contract on `#experience`/`#skills`/`#education` — set by `scroll-reveal.js`, consumed only by this task's own CSS (no other task depends on it).

Before writing CSS, invoke the `frontend-design` skill (per the global workflow — implementation-time UI code requires it). It has already been run once for this task and its output is recorded as the design direction in Step 1; re-invoke it if any of those decisions are being changed.

- [ ] **Step 1: The design direction (already run through `frontend-design`)**

The spec asks for "modern & distinctive" specifically because the paper resume already covers safe/minimal — this site is the taste signal. The direction below is what the whole of Task 5 implements; the individual rules in Steps 2–8 are only meaningful as expressions of it.

**Direction: instrument panel.** The subject is a quality engineer — the craft is measurement, coverage, and verification. The page borrows that vocabulary rather than generic-portfolio vocabulary: a calibrated rail down the Experience entries, tick markers instead of bullet discs, and a monospace *label register* applied to everything that labels rather than states.

**Color.** Cool tinted paper in light (`#eaedf2`) rather than white or cream, with genuinely raised white surfaces on top of it; deep ink in dark (`#0f1116`) with a lifted surface. One accent — a saturated indigo (`#4a35c9` light / `#a79bff` dark).

Two things this deliberately moves *away* from, both flagged by the `frontend-design` skill's own calibration notes as things AI-generated design clusters on regardless of subject: a warm cream ground with a terracotta accent (which is what this plan originally proposed — `#fdfdfc` + `#a3423b` — and is the single most recognizable "generated portfolio" palette), and a near-black page with one acid-green or vermilion accent. The cool-slate ground is also the change that makes `--surface` do real work: at `#fdfdfc`/`#fff` the surface token measured **1.018:1** against the background, i.e. invisible, so it existed in the token list without ever appearing on screen. It now measures **1.174:1** — still a quiet elevation step rather than a contrast boundary, which is the point, but a visible one.

**Type — three registers, not two.**

| Register | Face | Used for |
|---|---|---|
| Display | Space Grotesk 600/700, tight tracking | The name, job roles, degrees |
| Body | Inter 400 | Tagline and Experience bullets — the prose |
| Label | IBM Plex Mono 400/500, uppercase, wide tracking | Nav, section headings, skill categories, dates/company, tags, the download CTA, the honours note |

The label register is what the original CSS lacked entirely, and its absence is why that version measured only five distinct font sizes across the whole page with everything sitting one step below the hero. It also fixes a real hierarchy inversion: "Experience" (an `h2`) was set larger and heavier than "SDET – Quality Engineer" (an `h3`), so the section *label* outranked the job title it labels. Section headings are now the smallest text on the page and the roles are the largest thing below the hero — which is the correct reading order for a resume.

**Accent budget.** The accent appears exactly six times at rest: the hero rule, two timeline nodes, two honours tags, and the download CTA. Everything else that used to be accent-colored — ~136 chip borders, every timeline border, the hero's full-width rule, nav and contact link resting states — is now a neutral hairline, with the accent reserved for hover, focus, and those six marks. This satisfies the spec's "used consistently for the hero accent, links, and skill-chip highlights" through *state* (links and chips turn accent on hover/focus) rather than through resting color, which is what an accent is for.

**Geometry.** One radius (`4px`) on everything — tags, CTA, toggle. The original mixed `999px` pills throughout; squared-off tags read as tokens, which suits the subject and is the clearest single signal that this isn't the default rounded-pill portfolio. The spec's wording ("tag/pill chips") permits either.

**Signature.** The Experience rail: a hairline with a filled accent node at each entry, dates set in mono as an eyebrow *above* the role, and bullets marked with a short horizontal tick that echoes the rail. The section carrying the most content is also the one carrying the design idea — rather than the design living in the chrome and the content being left as browser defaults, which is exactly what the original did.

- [ ] **Step 2: Write the CSS custom-property theme system**

Create `src/assets/css/style.css`:

```css
:root {
  --measure: 45rem;
  --gutter: 1.5rem;
  --radius: 4px;
  --font-display: "Space Grotesk", "Inter", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", "Menlo", "Consolas", monospace;
  --bg: #eaedf2;
  --surface: #fff;
  --text: #14161b;
  --text-muted: #565d6b;
  --border: #d7dbe3;
  --border-strong: #7d8697;
  --accent: #4a35c9;
  --accent-hover: #3826a4;
  --accent-soft: #e3e0f9;
  --accent-contrast: #fff;
}

:root[data-theme="dark"] {
  --bg: #0f1116;
  --surface: #171a21;
  --text: #e9ebf0;
  --text-muted: #98a0af;
  --border: #262a33;
  --border-strong: #6d7482;
  --accent: #a79bff;
  --accent-hover: #bdb3ff;
  --accent-soft: #221f3d;
  --accent-contrast: #0f1116;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.6;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
}

```

Note on the token set. `--measure` and `--gutter` exist because the content column's width is now needed in three places (`main`, the sticky header's padding, the footer) and they must agree exactly or the header/content misalignment this redesign fixes comes straight back the next time one of them is nudged. `--border-strong` is separate from `--border` because they serve different rules: `--border` is decorative hairlines (section rules, tag outlines) with no contrast floor, while `--border-strong` is for anything WCAG 1.4.11 governs (the theme-toggle's boundary) plus the contact-link underlines — both measured above 3:1 against every surface they sit on, in both themes. `--accent-soft`/`--accent-contrast`/`--accent-hover` exist so the accent has a usable *tonal range* rather than one flat value: the honours notes sit on the soft tint, the CTA label sits on the solid fill, and hover darkens (light) or lightens (dark).

Note on the font names being quoted. `"Inter"`, `"Menlo"`, `"Consolas"` are quoted even though they're single words and don't need to be in plain CSS. Stylelint's `value-keyword-case` rule exempts the `font-family` *property*, but these values live inside custom properties, where it has no way to know they're font names and flags them as mis-cased keywords. Confirmed empirically — unquoted, `npx stylelint` fails with `Expected "Inter" to be "inter"`. Quoting is the fix that keeps them working as font names; lowercasing them would break the match against the actual font.

- [ ] **Step 3: Style the header, nav, and theme toggle**

Append to `style.css`:

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem calc(max(0px, (100% - var(--measure)) / 2) + var(--gutter));
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.site-nav {
  display: flex;
  gap: 1.5rem;
}

.site-nav a {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: color 0.15s ease;
}

.site-nav a:hover {
  color: var(--accent);
}

.theme-toggle {
  padding: 0.3rem 0.5rem;
  background: none;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  font-size: 0.875rem;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.theme-toggle:hover {
  border-color: var(--accent);
}

```

The `padding` expression is the fix for the header/content misalignment, and it's the whole reason `--measure` is a token. The header stays full-bleed — it's sticky chrome and its background should span the viewport — but its *contents* are inset to exactly where `main`'s content starts. `100%` in a padding value resolves against the containing block's inline size, which for this block-level child of `<body>` (margin 0) is the same width `main` centres itself within, so the two always agree. `max(0px, …)` collapses the extra inset to zero once the viewport is narrower than the measure, leaving just `--gutter` — so this single declaration covers every viewport and no media query is needed for it.

Measured at 1280px: the first nav link's left edge and the hero `h1`'s left edge both sit at **x = 304px** (offset between them: **0px**). Before this change the nav sat at x = 24 while content started at x = 304 — a **280px** orphaning of the nav from the column it navigates. At 768px both sit at x = 48 (was a 24px offset); at 375px both at x = 24 (already aligned there, unchanged).

`.site-nav` switches from `margin-right` on each link to a flex `gap`, which removes the dangling trailing margin after the last link — that margin was what made the nav's right edge not actually line up with anything.

- [ ] **Step 4: Style the content column, section headings, hero, and contact links**

Append to `style.css`:

```css
main {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 0 var(--gutter) 4rem;
}

main > section {
  padding: 0 0 4.5rem;
}

main > section:last-child {
  padding-bottom: 0;
}

/*
 * Section rules belong to the heading, not the section box, so a trailing
 * section can never leave a stray rule floating above the footer.
 */
main > section > h2 {
  margin: 0 0 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

#experience,
#skills,
#education {
  scroll-margin-top: 4.5rem;
}

.hero {
  padding: 4rem 0 5rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.125rem, 7.5vw, 4rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.035em;
}

.hero-title {
  margin: 1.1rem 0 0;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-tagline {
  max-width: 52ch;
  margin: 2rem 0 2.25rem;
  color: var(--text);
  font-size: 1.0625rem;
  line-height: 1.6;
}

/* The one accent mark in the hero, sized as an accent rather than a full-width rule. */
.hero-tagline::before {
  content: "";
  display: block;
  width: 3.25rem;
  height: 3px;
  margin-bottom: 1.75rem;
  background: var(--accent);
}

.hero-links,
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.contact-link {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  color: var(--text);
  font-size: 0.9375rem;
  text-decoration: none;
}

/*
 * The underline sits on the label span so the icon isn't underlined, and so
 * these links stay distinguishable without relying on color alone.
 */
.contact-link span {
  border-bottom: 1px solid var(--border-strong);
  transition: border-color 0.15s ease;
}

.contact-link:hover {
  color: var(--accent);
}

.contact-link:hover span {
  border-color: var(--accent);
}

```

Three things worth calling out here, because each replaces something that looked fine in the CSS and was wrong on screen:

**The section rule moved from the section box to the heading.** Previously `section { border-bottom: 1px solid var(--border) }` put a rule under *every* section — including `#education`, the last one, which left a stray hairline floating in the gap above the footer, attached to nothing. Putting the rule on `h2` as a `border-top` means it renders exactly three times, always immediately above a label that explains it, and is structurally incapable of trailing: there is no fourth heading. Measured after: `#education`'s `border-bottom` is `0px none`, and all three `h2`s carry `1px solid`.

**The hero's accent is a mark, not a rule.** It was a full-bleed `3px solid var(--accent)` across the bottom of the entire hero plus an accent-colored title line. It's now a 3.25rem bar rendered by `.hero-tagline::before`, which is what lets it sit *between* the mono title line and the tagline without any change to Task 4's markup. `.hero-title` moves to the mono label register instead of accent-colored bold body text.

**The `h1` uses `clamp()` instead of a media-query font size.** The old rule needed a `@media (width <= 640px)` override to drop from 2.5rem to 1.875rem; `clamp(2.125rem, 7.5vw, 4rem)` covers the whole range continuously and lets the name go considerably larger on desktop (measured 64px at 1280px and 768px, 34px at 375px) without a second breakpoint to keep in sync. Verified no horizontal overflow at 375px (`scrollWidth === clientWidth === 375`).

- [ ] **Step 5: Style the Experience timeline — the signature element**

Append to `style.css`:

```css
.timeline {
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-entry {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0 0 3rem 1.75rem;
  border-left: 1px solid var(--border);
}

.timeline-entry:last-child {
  padding-bottom: 0;
}

.timeline-entry::before {
  content: "";
  position: absolute;
  top: 0.5rem;
  left: -4.5px;
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--bg);
}

/* Reordered visually only — company and dates read as an eyebrow above the role. */
.timeline-entry .timeline-meta {
  order: -1;
  margin: 0 0 0.35rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
}

.timeline-entry h3 {
  margin: 0 0 1.1rem;
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
}

.timeline-entry ul {
  display: grid;
  gap: 0.7rem;
  max-width: 58ch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-entry ul li {
  position: relative;
  padding-left: 1.5rem;
  line-height: 1.65;
}

/* A measurement tick rather than a browser-default disc. */
.timeline-entry ul li::before {
  content: "";
  position: absolute;
  top: 0.8em;
  left: 0;
  width: 0.6rem;
  height: 1px;
  background: var(--border-strong);
}

```

This block is the one that matters most, because the bullet lists it styles are the highest-content-density part of the page and the previous version of this task left them **completely unstyled** — inheriting the browser default `list-style-type: circle` and `padding-left: 40px`, with no gap between items, no line-length limit, and no custom marker. Every *other* element on the page had been given a custom treatment; the one carrying the actual resume content had not. Measured before → after on `.timeline-entry ul`: `list-style-type` `circle` → `none`; `padding-left` `40px` → `0px`; `display` `block` → `grid` with an `11.2px` row gap (was `normal`, i.e. items touching); `max-width` `none` (rendering 654px wide) → `58ch` (585px). On the `li`: `padding-left` `0px` → `24px`, and a real marker pseudo-element (`9.6 × 1px`, `--border-strong`) where there was none (`content: none`).

The marker is a short horizontal rule, not a dot — it echoes the rail the entries hang off and reads as a tick on a scale, which is the direction from Step 1. It's set in `--border-strong`, not the accent: twelve accent-colored bullet markers would put the accent straight back onto the highest-frequency element on the page, which is the problem this redesign exists to fix.

`.timeline-entry` keeps its left border on every entry (including the last) so the rail is continuous — verified: entry 1's bottom edge and entry 2's top edge are the same y-coordinate, so there's no gap in the line. The border is now a 1px `--border` hairline rather than a 2px accent stripe, with the accent concentrated into the 8px node instead. `left: -4.5px` centres that 8px node on the 1px border: for an absolutely-positioned child, `left` is measured from the containing block's *padding* box, so the border occupies −1px to 0px and its centre is at −0.5px. The `box-shadow` is a `--bg`-colored ring that punches the rail out from behind the node.

`order: -1` on `.timeline-meta` is what puts company and dates above the role without touching Task 4's markup — the flex container reorders them visually while the DOM keeps the role first. This is safe here specifically because neither element is focusable, so there's no tab-order/visual-order mismatch (WCAG 2.4.3 is unaffected), and both sequences are meaningful readings of a resume entry (WCAG 1.3.2). It would **not** be safe to do this to a group containing links or buttons. Verified: `.timeline-meta` renders 26.4px above the `h3` in both entries.

- [ ] **Step 6: Style Skills and Education**

Append to `style.css`:

```css
.skill-group {
  display: grid;
  gap: 0.6rem;
  padding: 1.25rem 0;
}

.skill-group:first-of-type {
  padding-top: 0;
}

.skill-group + .skill-group {
  border-top: 1px solid var(--border);
}

.skill-group h3 {
  margin: 0;
  padding-top: 0.4rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  padding: 0.28rem 0.55rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.4;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.education-entry {
  padding: 1.25rem 0;
}

.education-entry:first-of-type {
  padding-top: 0;
}

.education-entry + .education-entry {
  border-top: 1px solid var(--border);
}

.education-entry h3 {
  margin: 0 0 0.4rem;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.education-entry > p {
  margin: 0;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

/*
 * Two class selectors so this beats `.education-entry > p` above — the honour
 * note is a distinction, not another metadata line.
 */
.education-entry .education-note {
  display: inline-block;
  margin-top: 0.65rem;
  padding: 0.15rem 0.5rem;
  background: var(--accent-soft);
  border-radius: var(--radius);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}

```

**The chips carried almost the entire accent problem.** With `border: 1px solid var(--accent)` on 34 chips, they alone accounted for 136 of the 143 accent-colored resting properties on the page — a wall of identically-outlined pills where the accent stopped reading as emphasis and became the page's default outline color. They're now neutral-outlined tags on `--surface` (which is finally visible, per Step 1) that turn accent on hover — which is what the spec's "skill-chip highlights" actually describes. Chip label text is `--text-muted` on `--surface`, measured 6.62:1 in both themes.

**`.education-entry .education-note` uses two class selectors deliberately.** `.education-entry > p` (specificity 0,1,1) would otherwise beat a single-class `.education-note` (0,1,0) and silently repaint the honours note as ordinary muted metadata — the note is a `<p>` inside `.education-entry`, so both selectors match it. This is the CSS-specificity trap the `frontend-design` skill warns about, and it is live in this exact file; the two-class form (0,2,0) is what makes the intended rule win. Anyone reordering or "simplifying" these two selectors needs to re-check that the honours tag still renders as a tinted tag.

**The `.skill-group` grid is a label column, not decoration.** At ≥40rem the category name sits in an 8rem left column with its tags to the right (see Step 8's media query), which rhymes with the Experience rail's left-marker structure and gives the Skills section a spine instead of six stacked heading-and-blob pairs. Below 40rem it collapses to stacked rows automatically, because the base rule is a single-column grid and only the column template is added at the breakpoint.

Both lists use `+`-combinator rules for their separators (`.skill-group + .skill-group`, `.education-entry + .education-entry`) rather than a rule on every item, so — like the section headings in Step 4 — a trailing separator is structurally impossible rather than something to remember to suppress.

- [ ] **Step 7: Style the footer and the focus states**

Append to `style.css`:

```css
.site-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 1.5rem;
  align-items: center;
  max-width: var(--measure);
  margin: 0 auto;
  padding: 2rem var(--gutter) 3rem;
  border-top: 1px solid var(--border);
}

.download-resume {
  padding: 0.65rem 1.1rem;
  background: var(--accent);
  border-radius: var(--radius);
  color: var(--accent-contrast);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.download-resume:hover {
  background: var(--accent-hover);
}

/* Pushes the CTA to the right edge of the measure, opposite the contact links. */
.site-footer .download-resume {
  margin-left: auto;
}

.site-nav a:focus-visible,
.contact-link:focus-visible,
.theme-toggle:focus-visible,
.download-resume:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

```

The footer changes from a centered column to a row aligned to the same `--measure` as the header contents and `main`: contact links at the left edge, the download CTA pushed to the right edge by `margin-left: auto`, toggle after it. That mirrors the header (navigation left, control right) so the two bracket the content column instead of one being left-aligned and the other centered. It collapses back to a left-aligned column below 640px (Step 9).

The two `.download-resume` rules **must stay in this order** — `.site-footer .download-resume` (0,2,0) after the bare `.download-resume` (0,1,0). Stylelint's `no-descending-specificity` rule fails the build if they're swapped; confirmed empirically (`Expected selector ".download-resume" to come before selector ".site-footer .download-resume"`).

Note: measured contrast on every color pair in this file, in **both** themes, after the redesign — all pass, with the tightest margin on the theme-toggle boundary at 3.12:1 against a 3:1 requirement. Two things automated Lighthouse scoring doesn't catch, both preserved from the previous version of this task and re-verified against the new palette: `.theme-toggle`'s border must clear the 3:1 WCAG 1.4.11 floor for UI component boundaries (now `var(--border-strong)`, measured 3.67:1 on the header surface and 3.12:1 on the page background in light, 3.71/4.02:1 in dark — the original `var(--border)` measured ~1.3:1 and failed); and `:focus-visible` styling must exist at all, or keyboard users get no indication of what's focused, since every affordance here is otherwise hover-only. `outline-offset` goes from 2px to 3px because the tags and CTA now have a 4px radius, and a 2px offset made the ring visibly clip the corners.

One addition this redesign makes on top of that baseline: `.contact-link span` carries a permanent `--border-strong` underline. The contact links previously had *no* non-color affordance at rest — they were plain `--text`-colored inline text that only became distinguishable on hover. That's WCAG 1.4.1 (use of color) territory for links inside a text block; the underline makes them identifiable without color and gives the hover state something to change rather than inventing one.

- [ ] **Step 8: Add the scroll-reveal states (unchanged behaviour)**

This block and the `.is-visible` class contract it defines are carried over from the previous version of this task **unchanged** — the redesign is a visual-system pass and deliberately does not touch the motion behaviour, the class contract `scroll-reveal.js` writes to, or the `@media print` override below. Append to `style.css`:

```css
@media (prefers-reduced-motion: no-preference) {
  #experience,
  #skills,
  #education {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.4s ease-in, transform 0.4s ease-in;
  }

  #experience.is-visible,
  #skills.is-visible,
  #education.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

```

Note: the spec calls for "fade-in on section entry" — i.e. triggered by scrolling a section into view, not a one-time page-load animation on every section simultaneously (the original `@keyframes`/`animation` approach here didn't actually do that; it faded every section in at once on load, nothing happened on scroll at all). This CSS only sets up the two states (hidden/`.is-visible`) and the transition between them; `scroll-reveal.js` (a new file, Step 10 below) does the actual scroll-triggered class toggling via `IntersectionObserver`. Scoped to `#experience`/`#skills`/`#education` only, not `.hero` — the hero is above the fold on load, so a scroll-triggered reveal doesn't apply to it; it should just be visible immediately.

- [ ] **Step 9: Add the responsive and print rules**

The spec names "mobile-first" as a requirement. Most of the layout is now intrinsically responsive — `clamp()` on the `h1`, `max()` in the header padding, and wrapping flex rows — so these two breakpoints handle only what those can't express. Append to `style.css`:

```css
@media (width >= 40rem) {
  .skill-group {
    grid-template-columns: 8rem 1fr;
    gap: 1.5rem;
    align-items: start;
  }
}

@media (width <= 640px) {
  .site-header {
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }

  .site-nav {
    gap: 1.1rem;
  }

  .site-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-footer .download-resume {
    margin-left: 0;
  }

  #experience,
  #skills,
  #education {
    scroll-margin-top: 6.5rem;
  }
}

@media print {
  #experience,
  #skills,
  #education {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

Note: the scroll-reveal's `opacity: 0` initial state (added in this task's Step 8) lives inside `@media (prefers-reduced-motion: no-preference)`, which applies under `print` too — `IntersectionObserver` fires against the scrolling viewport, not a print render, so a recruiter hitting Ctrl+P or "Save as PDF" on landing (without having scrolled) would get a document with Skills and Education silently blank. This `@media print` override forces all three visible for print regardless of scroll state. `transition: none` is load-bearing, not decorative — confirmed empirically: without it, opacity measures ~0.003 immediately after switching to print media (the 0.4s transition is still mid-flight), settling to `1` only ~700ms later, which would race an actual print snapshot; with `transition: none`, opacity is `1` immediately.

Note: the header only actually wraps to two lines at very narrow widths (empirically measured: still single-line, ~62.78px tall, all the way down to 375px; wraps to ~91.78px only at 320px) — but the `scroll-margin-top` override applies across the whole `<= 640px` breakpoint anyway, matching the layout breakpoint it's paired with rather than adding a third, narrower one just for this. That means a little extra (harmless) whitespace above the heading between 375-640px, where the header hasn't visually wrapped yet but the larger offset still applies. Verified via a real headless-browser click-and-measure test at both 1280px and 320px: heading top stays clear of the header bottom by ~40px in both cases, not just barely clearing.

- [ ] **Step 10: Create the scroll-reveal script**

Create `src/assets/js/scroll-reveal.js`:

```js
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var sections = document.querySelectorAll("#experience, #skills, #education");

  if (!("IntersectionObserver" in window)) {
    sections.forEach(function (section) {
      section.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
```

Three fallback paths, each deliberate: if `prefers-reduced-motion: reduce` is set, skip entirely (the CSS's `opacity: 0` initial state only applies inside the `no-preference` media query, so sections are already visible by default — nothing to reveal). If `IntersectionObserver` isn't supported, mark everything visible immediately rather than leaving sections permanently hidden. `unobserve` after the first trigger — this is a one-time reveal per section, not a repeat-on-every-scroll-past animation.

- [ ] **Step 11: Add a no-JS fallback so sections aren't stuck invisible**

In `src/_layouts/base.njk` (Task 4), the reduced-motion CSS's `opacity: 0` initial state depends on `scroll-reveal.js` actually running to reveal it — a visitor with JavaScript disabled would see `#experience`/`#skills`/`#education` permanently invisible, since nothing ever adds `.is-visible`. Add a `<noscript>` override right after the `<link rel="stylesheet" href="/assets/css/style.css">` line:

```njk
<noscript>
  <style>
    #experience, #skills, #education { opacity: 1 !important; transform: none !important; }
  </style>
</noscript>
```

And add the script tag itself, alongside the existing `theme-toggle.js` reference at the end of `<body>`:

```njk
<script src="/assets/js/scroll-reveal.js"></script>
```

- [ ] **Step 12: Verify Stylelint/ESLint pass, the build succeeds, the header doesn't break narrow, and sections actually reveal on scroll**

`scripts/` doesn't exist yet at this point (Task 7 creates it) — same hazard already documented for Task 1/2's `lint` script; don't include it here:

```bash
npx stylelint "src/assets/css/**/*.css"
npx eslint src/assets/js .eleventy.js eslint.config.js
npm run build
npm run serve
```

Expected: stylelint, eslint, and build all exit 0. With the dev server running: resize down to ~375px width and confirm the header still wraps correctly (Step 9's check, unchanged); scroll down and confirm Experience/Skills/Education each fade in as they enter the viewport, not all at once on load, and the Hero is visible immediately without any fade; disable JavaScript (devtools) and reload — confirm all sections are visible immediately with no permanently-invisible content; open the browser's print preview (Ctrl+P) immediately after page load, without scrolling first — confirm Experience/Skills/Education all render fully, not blank (this specifically tests the `@media print` override above, since without it a print/PDF-save on landing would silently drop everything the scroll-reveal hadn't triggered yet). Stop the server (Ctrl+C) when done.

- [ ] **Step 13: Commit**

```bash
git add src/assets/css/style.css src/assets/js/scroll-reveal.js src/_layouts/base.njk
git commit -m "feat(design): implement the modern/distinctive visual system

Instrument-panel direction: three type registers (Space Grotesk
display, Inter body, IBM Plex Mono labels), a single indigo accent
(light/dark variants) budgeted to six resting marks rather than
applied throughout, and CSS custom properties driving the data-theme
attribute contract Task 6's JS toggles. Sticky header content aligned
to the same measure as main via a shared --measure/--gutter token
pair, a tick-marked Experience rail with styled bullet content, and a
narrow-viewport/print breakpoint set — matching the spec's Visual
design system and mobile-first requirements. No CSS framework,
hand-written throughout.

Experience/Skills/Education fade in as each is scrolled into view
(IntersectionObserver, one-time per section), matching the spec's
'fade-in on section entry' requirement — the original CSS-only
@keyframes approach faded every section in simultaneously on page
load instead, which wasn't actually scroll-triggered. Respects
prefers-reduced-motion (skips the effect entirely, sections render
visible immediately) and degrades gracefully with JS disabled (a
<noscript> override in base.njk) or without IntersectionObserver
support. The Hero stays immediately visible — it's above the fold on
load, so a scroll reveal doesn't apply to it.

Consists of:
- src/assets/css/style.css: full theme system, page styling, and the
  hidden/.is-visible states scroll-reveal.js toggles
- src/assets/js/scroll-reveal.js: IntersectionObserver-based
  scroll-triggered fade-in for Experience/Skills/Education
- src/_layouts/base.njk: adds the scroll-reveal.js script tag and a
  noscript fallback so sections aren't stuck invisible without JS

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Theme toggle interactivity

**Files:**
- Create: `src/assets/js/theme-toggle.js`

**Interfaces:**
- Consumes: `[data-theme-toggle]` buttons (Task 4's templates — both header and footer instances, statically marked `aria-pressed="false"`), `:root[data-theme]` attribute contract (Task 5's CSS).
- Produces: click-to-toggle behavior with `localStorage` persistence, and `aria-pressed` state kept in sync on both buttons — on load (correcting the static markup default against whatever theme the inline head script already applied) and after every click.

- [ ] **Step 1: Write the toggle script**

Create `src/assets/js/theme-toggle.js`:

```js
(function () {
  var toggles = document.querySelectorAll("[data-theme-toggle]");

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateToggleState() {
    var pressed = currentTheme() === "dark" ? "true" : "false";
    toggles.forEach(function (button) {
      button.setAttribute("aria-pressed", pressed);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateToggleState();
  }

  toggles.forEach(function (button) {
    button.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });

  // Sync aria-pressed with whatever theme the inline head script already
  // applied to <html> before this file loaded — the buttons themselves
  // didn't exist yet when that script ran, so their static aria-pressed="false"
  // markup attribute needs correcting here if the real theme is "dark".
  updateToggleState();
})();
```

Note: `aria-pressed` is what exposes the toggle's state to screen readers — clicking it previously changed the visible glyph and the theme but gave no indication via the accessibility tree that anything changed, since the button itself never communicated a state at all. `updateToggleState()` runs both on click and once on load, since the buttons don't exist yet when the inline FOUC-prevention script (Task 4) sets the initial theme on `<html>` — by the time this file loads, the real theme is already applied, but the button's static `aria-pressed="false"` markup may not match it (e.g. if the system preference or a stored choice was actually dark).

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

Open the printed local URL. Click either theme-toggle button (header or footer): confirm the page switches theme instantly and clicking the *other* button reflects the same state (both read/write the same `data-theme` attribute), and both buttons' `aria-pressed` value updates (inspect via devtools). Reload the page: confirm the theme choice persisted via `localStorage` and `aria-pressed` matches on load. Stop the server (Ctrl+C) when done.

- [ ] **Step 4: Commit**

```bash
git add src/assets/js/theme-toggle.js
git commit -m "feat: wire up the theme toggle click handler

Both header and footer toggle buttons share one data-theme-toggle
hook and one localStorage-persisted state, so clicking either updates
both — matches the spec's 'one logical control, two visual instances'
requirement. Deliberately separate from base.njk's inline FOUC-
prevention script (Task 4), which only sets the initial theme before
first paint. Buttons also expose their state via aria-pressed, synced
on load and on every click — previously the toggle changed the theme
with no indication via the accessibility tree that anything happened.

Consists of:
- src/assets/js/theme-toggle.js: click handler + localStorage sync +
  aria-pressed state sync

Co-Authored-By: Claude <noreply@anthropic.com>"
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
  <rect width="32" height="32" rx="6" fill="#4a35c9"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">MF</text>
</svg>
```

SVG favicons are broadly supported by browsers, so no rasterization needed here — unlike the OG image below, which specifically needs to work with social-platform crawlers.

Note: `#4a35c9` is Task 5's `--accent` and `#ffffff` its `--accent-contrast`, hardcoded here because an SVG asset can't read the page's CSS custom properties. These two literals (and the same pair in Step 2's OG image) are the *only* places the accent color is duplicated outside `style.css` — if the accent is ever changed, these are the files that must change with it, or the favicon and social card will silently keep rendering the old brand color.

- [ ] **Step 2: Create the OG share-card source image**

Create `src/assets/og-image.svg` (1200×630, the standard OG image dimension):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#4a35c9"/>
  <text x="80" y="300" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff">Markus Luis Flores</text>
  <text x="80" y="370" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="36" fill="#ffffff">Software Developer</text>
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
  "lint": "eslint src/assets/js .eleventy.js scripts eslint.config.js && stylelint \"src/assets/css/**/*.css\"",
  "prepare": "husky",
  "prebuild": "node scripts/generate-og-image.js"
}
```

Note: `scripts` couldn't be added to `lint` back in Task 1/2 — at that point in the build order, the `scripts/` directory didn't exist yet, and `eslint` errors out (not just warns) on a path pattern matching zero files. Confirmed empirically: `npx eslint nonexistent-dir` exits with "No files matching the pattern... were found," not a silent no-op.

- [ ] **Step 4: Point Task 4's og:image meta tag at the PNG**

In `src/_layouts/base.njk` (written in Task 4), change:

```njk
<meta property="og:image" content="{{ siteUrl }}/assets/og-image.svg">
```

to:

```njk
<meta property="og:image" content="{{ siteUrl }}/assets/og-image.png">
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
- src/assets/resume.pdf: real downloadable resume

Co-Authored-By: Claude <noreply@anthropic.com>"
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
  workflow_dispatch:

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
      - run: npx eslint src/assets/js .eleventy.js scripts eslint.config.js
      - run: npx stylelint "src/assets/css/**/*.css"
      - run: npm run build
      - run: npx html-validate "_site/**/*.html"
      - run: npx linkinator _site --recurse --skip "https://www.linkedin.com/*" --skip "^https://markusluisflores.github.io/"
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

Note: the LinkedIn `--skip` is **defence-in-depth, not a load-bearing fix** — don't remove it, but don't believe it's what keeps CI green either. LinkedIn blocks automated requests from CI bots, answering HTTP `999` to non-browser clients. Measured against the current `linkinator` (v7.6.1): the LinkedIn URL is reported `SKIPPED 999` and the run exits 0 **even with no `--skip` flag at all**, because linkinator now special-cases bot-protection responses itself (`999`, and `403` carrying a `cf-mitigated` header) as skipped rather than broken. So the flag is currently redundant; it's kept because it costs nothing and pins the behaviour if that built-in handling ever changes or LinkedIn switches to a different blocking status. The practical consequence either way is that **LinkedIn is never actually validated** — which is why the manual click-check in the Post-implementation checklist below is the only real coverage for it.

`--skip` takes a regular expression, not a glob — `https://www.linkedin.com/*` happens to work here since `.` and `*` are valid (if slightly loose) regex syntax against this specific URL shape, but don't read the trailing `*` as glob wildcard syntax if reusing this pattern elsewhere.

A second skip is required for a different reason: `linkinator` resolves any URL that parses as absolute (including `og:image`/`og:url`'s meta tag values, which the ogp.me fix earlier in this plan deliberately made absolute) by actually fetching it — from the **live site**, not from the local `_site/` build. Before the first deploy, `https://markusluisflores.github.io/assets/og-image.png` 404s (nothing's been deployed yet), which would permanently fail this required CI check on the very first PR — a genuine chicken-and-egg deadlock, confirmed empirically (`[404]` on the live URL, exit 1 without the skip; exit 0 with it). `--skip "^https://markusluisflores.github.io/"` treats the site's own absolute URLs as already-covered by the local build/render checks (html-validate, the grep assertions) rather than re-fetching them externally.

Note: the `build` job doesn't upload `_site/` as an artifact — nothing downloads it (the `lighthouse` job re-runs its own `npm ci` + `npm run build` rather than consuming an upload, since it needs the full `node_modules` context to run `@lhci/cli` anyway, not just the built output). An unused `upload-artifact` step was cut rather than wiring up a consumer for a few seconds of build-time savings that isn't worth the added YAML complexity.

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

- [ ] **Step 3: Install the remaining CI-only tooling used by the workflow**

`html-validate` was already installed in Task 4 (needed there first) — just the remaining two:

```bash
npm install --save-dev linkinator @lhci/cli
```

`@lhci/cli`'s own dependency tree pulls in a version of `tmp` with a real high-severity advisory (GHSA-52f5-9888-hmc6) — confirmed empirically: `npm audit --audit-level=high` exits 1 on this exact dependency set out of the box, which would permanently fail the `quality` CI job (a required status check per Task 9) starting with the very first push. Force a patched `tmp` version via npm's `overrides` field rather than downgrading `@lhci/cli` (the only alternative `npm audit fix --force` offers is `@lhci/cli@0.1.0`, a breaking downgrade) or skipping dev-dependency auditing entirely (`--omit=dev` would audit nothing at all, since every dependency in this project is a devDependency — that's not a fix, it's turning the check off). Add to `package.json`:

```json
"overrides": {
  "tmp": "^0.2.6"
}
```

Then **re-run `npm install` to regenerate `package-lock.json`** — this is not optional bookkeeping, and editing `package.json` alone is not enough:

```bash
npm install
```

An `overrides` block only takes effect once the lockfile is resolved against it. Confirmed empirically, adding the block without reinstalling: `npm audit --audit-level=high` still exits 1 on the same `tmp` advisory (npm audits the lockfile's resolved tree, not `package.json`'s intent), and — worse — `package.json` and `package-lock.json` are now out of sync, so `npm ci` hard-fails with `npm error code EUSAGE` / `Invalid: lock file's tmp@0.1.0 does not satisfy tmp@0.2.7`. Since **all three `ci.yml` jobs and `deploy.yml` start with `npm ci`**, committing that state would fail every required status check on the first PR and block the deploy — not just the `quality` job's audit step.

Verified after the reinstall: the lockfile resolves `tmp@0.2.7`, `npm audit --audit-level=high` exits 0 (two remaining moderate-severity `uuid` advisories stay below the `high` threshold, consistent with the quality baseline's stated policy of starting audits at `high` severity), and `npm ci` exits 0.

- [ ] **Step 4: Copy CodeQL workflow verbatim from github-setup templates**

Use `"$HOME/..."`, not a quoted `"~/..."` — bash does not expand `~` inside double quotes (confirmed empirically: `cp "~/nonexistent"` fails with "No such file or directory" even when the real file exists at that path; `$HOME` expands correctly in both quoted and unquoted form). Every `cp` in this task and Task 9 uses this form for the same reason.

```bash
mkdir -p .github/workflows
cp "$HOME/.claude/skills/github-setup/templates/workflows/codeql.yml" ".github/workflows/codeql.yml"
```

- [ ] **Step 5: Write deploy.yml**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

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
npx eslint src/assets/js .eleventy.js scripts eslint.config.js
npx stylelint "src/assets/css/**/*.css"
npm run build
npx html-validate "_site/**/*.html"
npx linkinator _site --recurse --skip "https://www.linkedin.com/*" --skip "^https://markusluisflores.github.io/"
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
- lighthouserc.json: accessibility >= 0.9 assertion

Co-Authored-By: Claude <noreply@anthropic.com>"
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
cp "$HOME/.claude/skills/github-setup/templates/ISSUE_TEMPLATE/bug_report.yml" ".github/ISSUE_TEMPLATE/bug_report.yml"
cp "$HOME/.claude/skills/github-setup/templates/ISSUE_TEMPLATE/feature_request.yml" ".github/ISSUE_TEMPLATE/feature_request.yml"
cp "$HOME/.claude/skills/github-setup/templates/ISSUE_TEMPLATE/config.yml" ".github/ISSUE_TEMPLATE/config.yml"
cp "$HOME/.claude/skills/github-setup/templates/pull_request_template.md" ".github/pull_request_template.md"
cp "$HOME/.claude/skills/github-setup/templates/dependabot.yml" ".github/dependabot.yml"
cp "$HOME/.claude/skills/github-setup/templates/SECURITY.md" "SECURITY.md"
cp "$HOME/.claude/skills/github-setup/templates/CONTRIBUTING.md" "CONTRIBUTING.md"
```

- [ ] **Step 2: Fill in the template placeholders**

The real templates (`~/.claude/skills/github-setup/templates/SECURITY.md` and `CONTRIBUTING.md`) don't actually contain a `[PROJECT_NAME]` placeholder in `SECURITY.md` — only `[CONTACT_EMAIL]`, `[OWNER]`, and `[REPO]`. Every placeholder in both files needs an explicit replacement:

Edit `SECURITY.md`:
- `[CONTACT_EMAIL]` → `markuslsflores@gmail.com`
- `[OWNER]` → `markusluisflores`
- `[REPO]` → `markusluisflores.github.io`

Edit `CONTRIBUTING.md`:
- `[PROJECT_NAME]` (title, line 1) → `markusluisflores.github.io`
- `[OWNER]` (git clone URL) → `markusluisflores`
- `[REPO]` (git clone URL and the `cd` line) → `markusluisflores.github.io`
- `npm run dev` (Development Setup block) → `npm run serve` — this project's actual script name (Task 1), not the template's generic placeholder command
- `Write or update tests for any logic changes` (Workflow section, step 2) → `Update resume.json or templates for content/markup changes` — the template's step assumes a project with a test suite; this one has neither logic nor tests to update, found during a full self-sweep after round 4 caught the adjacent step 3 issue but not this one
- `Run \`npm test\` — all tests must pass before opening a PR` (Workflow section, step 3) → `Run \`npm run lint\` and \`npm run build\` — both must succeed before opening a PR` — this project has no `test` script; per the design spec, there's no unit-test suite (presentational markup driven by data), so the template's generic testing step needs replacing, not just leaving as dead text that errors if anyone actually runs it
- **Example content carried over from another project** — the template's illustrative examples are all from the `calculator` project's domain and name tooling this repo doesn't use. These aren't `[BRACKETED]` placeholders so a placeholder scan won't catch them, but this repo *is* the public-facing resume: a CONTRIBUTING.md telling readers to `chore: update Vite to v6` in an Eleventy project reads as unreviewed copy-paste to exactly the audience this site is for. Replace:
  - Branch Naming table, Bug fix row: `fix/decimal-input` → `fix/timeline-overflow`
  - Branch Naming table, Docs row: `docs/api-reference` → `docs/resume-content` (this project has no API)
  - Commit Messages example block — replace all four lines with project-real examples:

    ```
    feat: add projects section to the resume page
    fix: correct chip wrapping on narrow viewports
    docs: update CONTRIBUTING with the lint workflow
    chore: update Eleventy to v3.2
    ```

  (`feat/dark-mode` and `chore/update-deps` in the table are already apt for this project — leave those two alone.)

Edit `.github/ISSUE_TEMPLATE/config.yml`: replace `[SECURITY_URL]` with `https://github.com/markusluisflores/markusluisflores.github.io/security/policy`.

Edit `.github/pull_request_template.md`: the Checklist section has the same "assumes a test suite" issue as `CONTRIBUTING.md` did — `- [ ] Tests pass (\`npm test\` or equivalent)` isn't broken (the "or equivalent" keeps it non-erroring, it's checklist text a human checks off, not a command), but replace it with `- [ ] \`npm run lint\` and \`npm run build\` pass` for consistency with the actual project.

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
- index.html: removed (superseded by _site/index.html via deploy.yml)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Post-implementation checklist

- [ ] Push the implementation branch and open a PR against `main` (per the global workflow — never push directly to `main`).
- [ ] Confirm `ci.yml`'s three jobs and CodeQL all pass on the PR.
- [ ] Run this plan's own Self-Review (spec coverage, placeholder scan, type/interface consistency, sibling-reuse check) before requesting review.
- [ ] Follow `review-process-standard.md` for the PR review cycle (judgment-surface gate, fresh + resumed rounds, GitHub-mechanic for posting findings) — this plan's tasks are all authored decisions (template structure, CSS values, workflow design), so the skip-review exemption does not apply.
- [ ] After merge, verify the live site at `https://markusluisflores.github.io` actually reflects the new content (per the "check the live version as we go" practice established this session).
- [ ] Manually click the LinkedIn link on the live site and confirm it resolves correctly. `linkinator` skips LinkedIn entirely (it blocks automated requests from CI bots), so this is the one link named explicitly in the spec's link-check requirement that no automated check in this plan actually covers.
