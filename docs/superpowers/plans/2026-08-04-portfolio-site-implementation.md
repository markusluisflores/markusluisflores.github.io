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
        ResizeObserver: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
];
```

Two separate blocks, not one shared one: Node/CommonJS files (`.eleventy.js`, `scripts/**/*.js`, and `eslint.config.js` itself — otherwise the config can't lint itself once it's staged in Step 9's commit) need `require`/`module`/`__dirname`/`process` globals and no browser globals; browser-run files (`src/assets/js/**/*.js`) need the reverse. Mixing them into one globals list would let each file type reference the other's globals without ESLint catching a real mistake (e.g. `document` accidentally used inside a Node script). `ResizeObserver` is in the browser list because Task 5's `skill-filter.js` uses it to keep the sticky-chrome offset in sync with the filter bar's actual height; without it declared here, `npx eslint` fails that file on `no-undef`.

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
  "tagline": "Software Developer with more than 5 years of experience developing and maintaining large-scale SaaS applications, from full-stack work to quality engineering. Writes clean, efficient code and designs business-oriented software that caters to the needs of the user.",
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
        {
          "text": "Develop and execute comprehensive test strategies and technical solutions for Wealth Management Technology."
        },
        {
          "text": "Collaborate in Agile ceremonies to align QA efforts with project deliverables.",
          "skills": ["Agile Scrum Methodology"]
        },
        {
          "text": "Design optimized test cases for end-to-end and integration testing, using model-based design tools (ConformIQ, Hexawise) and, more recently, AI-assisted design with Copilot driven by Jira requirements.",
          "skills": ["ConformIQ", "Hexawise", "Copilot"]
        },
        {
          "text": "Automate and maintain regression suites using Playwright and internal testing tools.",
          "skills": ["Playwright"]
        },
        {
          "text": "Manage test execution and defect triage, providing test documentation and status updates to stakeholders.",
          "skills": ["Jira", "qTest"]
        },
        {
          "text": "Support QA environment deployments on Red Hat OpenShift using GitHub Actions and UrbanCode Deploy. Validate successful rollouts and check pod health and logs after each deployment.",
          "skills": ["Red Hat OpenShift", "GitHub Actions", "UrbanCode Deploy"]
        }
      ]
    },
    {
      "role": "Software Engineer",
      "company": "Infor PSSC, Inc.",
      "dates": "Dec 2018 – Jun 2023",
      "bullets": [
        {
          "text": "Designed and developed new features and enhancements for Infor's SaaS Human Capital Management (HCM) platform based on business requirements.",
          "skills": ["Landmark Pattern Language (LPL)"]
        },
        {
          "text": "Maintained and improved existing HCM modules using Agile and object-oriented programming (OOP) practices.",
          "skills": ["Agile Scrum Methodology", "Landmark Pattern Language (LPL)"]
        },
        {
          "text": "Led code reviews through meetings, Crucible, and GitLab. Maintained release versions code using AccuRev and Git.",
          "skills": ["Git", "AccuRev"]
        },
        {
          "text": "Authored functional and technical design documents, user documentation, and client knowledge transfer (KT) materials."
        },
        {
          "text": "Collaborated with Business Analysts and Product Owners to influence design decisions and deliver customer solutions.",
          "skills": ["Agile Scrum Methodology"]
        },
        {
          "text": "Supported QA teams by preparing detailed test cases, contributing to automation scripts, and ensuring coverage for functional and regression testing.",
          "skills": ["Business Logic Testing (BLT)"]
        }
      ]
    }
  ],
  "skills": [
    {
      "category": "Frontend",
      "items": ["HTML", "CSS", "Tailwind CSS", "React.js", "Next.js", "JavaScript", "TypeScript", "Mantine"]
    },
    {
      "category": "Backend",
      "items": ["Java", "PHP", "Node.js", "SQL", "NoSQL", "Docker", "Landmark Pattern Language (LPL)"]
    },
    { "category": "AI Tools", "items": ["Claude Code", "Copilot", "Cursor", "n8n"] },
    {
      "category": "Testing",
      "items": [
        "Playwright",
        "Selenium",
        "Postman",
        "qTest",
        "Business Logic Testing (BLT)",
        "ConformIQ",
        "Hexawise"
      ]
    },
    {
      "category": "DevOps",
      "items": ["Red Hat OpenShift", "GitHub Actions", "UrbanCode Deploy"]
    },
    {
      "category": "Others",
      "items": ["Git", "RESTful API", "Jira", "Trello", "Confluence", "Agile Scrum Methodology", "AccuRev"]
    },
    {
      "category": "Soft Skills",
      "items": ["Problem-solving", "Detail-oriented", "Critical thinking", "Adaptability", "Communication", "Collaboration/Teamwork"]
    }
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

**Experience bullets are objects, not strings.** Each is `{ "text": ..., "skills": [...] }`, and the `skills` array is what drives the Skills-to-Experience cross-filter built in Tasks 4 and 5: clicking a skill chip highlights every bullet tagged with that skill. `skills` is optional — a bullet with no defensible tag simply omits it and is treated as "matches nothing", which is correct behaviour rather than a gap to fill.

Two rules govern the tags, and both matter more than they look:

1. **A tag must exactly match a string that already exists in the `skills` array below it.** `"Agile Scrum Methodology"`, not `"Agile"`; `"Selenium"`, not `"Selenium WebDriver"`. Task 4's `isEvidenced` filter decides whether a chip is interactive by testing for exactly this string equality, so a paraphrased tag silently produces a bullet that no chip can ever reach.
2. **Soft skills are never tagged.** "Problem-solving", "Communication" and the rest are real skills but they are not falsifiable at the sentence level, and tagging them would dilute the filter into noise. They render as inert chips, which is the honest outcome.

**Tag provenance.** This table has been through two rounds of review with the site owner, who corrected every tag an earlier draft had guessed at. **There are no inferences left** — every tag below is either stated in the bullet text or confirmed directly by the owner, and there are no open questions for the owner to resolve before this task can be marked done.

| Bullet | Tag(s) | Basis |
|---|---|---|
| RBC 1 — "comprehensive test strategies and technical solutions" | *(none)* | No named technology |
| RBC 2 — "Collaborate in Agile ceremonies" | Agile Scrum Methodology | **Stated** — "Agile ceremonies" |
| RBC 3 — "model-based design tools (ConformIQ, Hexawise)... AI-assisted design with Copilot" | ConformIQ, Hexawise, Copilot | **Stated** — all three named in the rewritten bullet |
| RBC 4 — "regression suites using Playwright and internal testing tools" | Playwright | **Stated** — Playwright is the automation tool in use. The unnamed internal framework is believed to sit on Selenium underneath, but it is a distinct spreadsheet-style tool and is left as the generic phrase rather than tagged |
| RBC 5 — "test execution and defect triage" | Jira, qTest | **Owner-confirmed** — Jira for defect triage, qTest for test-execution tracking, with qTest results linked into Jira |
| RBC 6 — "QA environment deployments on Red Hat OpenShift using GitHub Actions and UrbanCode Deploy" | Red Hat OpenShift, GitHub Actions, UrbanCode Deploy | **Stated** — all three named in the rewritten bullet |
| Infor 1 — "new features... for Infor's SaaS HCM platform" | Landmark Pattern Language (LPL) | **Owner-confirmed, independently verified** — LPL is Infor's documented proprietary language for this platform |
| Infor 2 — "using Agile and object-oriented programming (OOP) practices" | Agile Scrum Methodology, Landmark Pattern Language (LPL) | **Stated** (Agile) / **Owner-confirmed** (LPL, which is itself an OOP language — a closer fit to "OOP practices" than the Java this originally guessed) |
| Infor 3 — "AccuRev and Git" | Git, AccuRev | **Stated** — both named |
| Infor 4 — "Authored functional and technical design documents" | *(none)* | Confluence not named; not inferred |
| Infor 5 — "Collaborated with Business Analysts and Product Owners" | Agile Scrum Methodology | **Stated** — "Product Owner" is a Scrum role |
| Infor 6 — "contributing to automation scripts... regression testing" | Business Logic Testing (BLT) | **Owner-confirmed** — BLT is Infor's internal spreadsheet-style automation tool for testing LPL logic. Not Selenium, which an earlier draft wrongly inferred |

**RBC 6's text was rewritten, not just retagged.** The original ("Support server deployments by configuring environments, validating builds, and performing post-deployment checks") claimed more ownership than is accurate — the owner verifies deployments that a developer has already configured rather than configuring containers themselves. The replacement names the actual platform and tooling and describes verification rather than configuration. `Docker` is consequently no longer tagged anywhere and renders as an inert chip.

**RBC 3's text was also rewritten rather than retagged.** It is a test-*design* bullet, not a test-execution one, so Selenium never belonged on it — the original "leveraging automation frameworks" wording invited exactly the wrong inference. The replacement names the model-based design tools actually used (ConformIQ, Hexawise) and the more recent AI-assisted design work with Copilot driven by Jira requirements. Selenium remains tagged on RBC 4, where the bullet does name it.

This tagging makes **14 of the 42 skills evidenced** — Agile Scrum Methodology, ConformIQ, Hexawise, Copilot, Playwright, Jira, qTest, Red Hat OpenShift, GitHub Actions, UrbanCode Deploy, Landmark Pattern Language (LPL), Business Logic Testing (BLT), Git, AccuRev — leaving **28 as inert chips**. 10 of the 12 bullets carry at least one tag.

**`Selenium` is deliberately inert.** No bullet tags it: RBC automates with Playwright, RBC 3 is a test-*design* bullet, and Infor 6 used BLT. The owner still has real Selenium exposure through the unnamed internal framework, so it stays in the Testing list as an honest, unclickable chip. `Playwright` is listed first in that category because it is the current primary tool.

**`Copilot` is tagged; `Claude Code`, `Cursor` and `n8n` deliberately are not.** Copilot is the only AI tool used in the professional work described here; the other three are personal-project tools and stay inert. This is also the only tag that points into the AI Tools category, which makes it the check that `isEvidenced` matches a skill by exact string regardless of which category it lives in — verified against a real build rather than assumed.

Only **one** skill, Agile Scrum Methodology, spans both roles; the other thirteen are scoped to a single job. That matters for Task 5's "hollow node" state, and both directions are reachable: filtering by LPL, BLT, Git or AccuRev hollows the RBC entry, and filtering by Playwright, ConformIQ, Hexawise, Copilot, Jira, qTest or any of the three DevOps tools hollows the Infor entry. Confirmed by recounting the data rather than estimating.

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

Experience bullets are objects with an optional skills[] array rather
than plain strings, so each bullet carries the skills it evidences.
That mapping is what the Skills-to-Experience cross-filter in Tasks 4
and 5 reads; tags are restricted to exact matches of existing skill
items, and soft skills are deliberately untagged.

Consists of:
- src/_data/resume.json: name/title/tagline, links, 2 experience
  entries with per-bullet skill tags, 7 skill categories, 2 education
  entries

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Base layout, head metadata, page content, and the cross-filter markup

**Files:**
- Create: `src/_includes/contact-links.njk`
- Create: `src/_layouts/base.njk`
- Modify: `src/index.njk` (replace placeholder with real content)
- Modify: `.eleventy.js` (add the `isEvidenced` filter)

**Interfaces:**
- Consumes: `resume` global data object (Task 3) — exact shape: `resume.name`, `resume.title`, `resume.tagline`, `resume.location`, `resume.links.{email,github,linkedin}`, `resume.experience[].{role,company,dates,bullets[]}` where each bullet is `{text, skills?}`, `resume.skills[].{category,items[]}`, `resume.education[].{degree,school,location,dates,note}` (note: `resume.location` and `edu.location` are unrelated fields on different objects — don't conflate them).
- Produces: page markup with hooks `data-theme-toggle` (button elements, consumed by Task 6's JS); `.contact-link` elements (icon + text, consumed by Task 5's CSS); `id="experience"` / `id="skills"` / `id="education"` (anchor targets for the nav, consumed by Task 5's CSS and by `nav-spy.js`); `li[data-skills="A|B"]` on tagged Experience bullets and `button.chip[data-skill][aria-pressed]` on evidenced skills (both consumed by Task 5's `skill-filter.js`); and the `[data-filter-bar]` / `[data-filter-skills]` / `[data-filter-count]` / `[data-filter-clear]` / `[data-filter-status]` hooks the same script writes into.

- [ ] **Step 1: Add the `isEvidenced` filter to `.eleventy.js`**

The Skills section needs to know, at build time, which skills have at least one Experience bullet tagged against them — evidenced skills render as interactive buttons, the rest as inert spans. Deriving that in the template would mean a nested loop per chip; deriving it in config means one pass over the data, cached.

Replace `.eleventy.js` (written in Task 1) with:

```js
const evidencedCache = new WeakMap();

function evidencedSkillSet(experience) {
  if (!Array.isArray(experience)) {
    return new Set();
  }
  if (evidencedCache.has(experience)) {
    return evidencedCache.get(experience);
  }
  const set = new Set();
  experience.forEach(function (job) {
    (job.bullets || []).forEach(function (bullet) {
      (bullet.skills || []).forEach(function (skill) {
        set.add(skill);
      });
    });
  });
  evidencedCache.set(experience, set);
  return set;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.setNunjucksEnvironmentOptions({
    trimBlocks: true,
    lstripBlocks: true,
  });

  eleventyConfig.addFilter("isEvidenced", function (skill, experience) {
    return evidencedSkillSet(experience).has(skill);
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

The `WeakMap` cache is keyed on the `experience` array itself, so the set is built once per build rather than once per chip (42 chips x 12 bullets otherwise). `evidencedSkillSet` tolerates a missing or malformed `experience` value by returning an empty set — every chip then renders inert, which degrades the feature rather than failing the build.

- [ ] **Step 2: Write the shared contact-links macro**

The spec requires contact links as icon+text in both the identity block and the footer — rather than duplicating three anchors twice (exactly the kind of repeated cross-cutting markup that drifts out of sync), write it once as a Nunjucks macro and call it from both places.

Create `src/_includes/contact-links.njk`:

```njk
{% macro contactLinks(links) %}
<a href="mailto:{{ links.email }}" class="contact-link">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 4h20v16H2V4zm2 2v.01L12 12l8-5.99V6H4zm16 12V8.24l-8 6-8-6V18h16z"/></svg>
  <span>Email</span>
</a>
<a href="{{ links.github }}" class="contact-link" target="_blank" rel="noopener noreferrer">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>
  <span>GitHub</span>
</a>
<a href="{{ links.linkedin }}" class="contact-link" target="_blank" rel="noopener noreferrer">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
  <span>LinkedIn</span>
</a>
{% endmacro %}
```

Icons use `fill="currentColor"` so they automatically inherit the surrounding link's text color — no separate icon-color CSS needed per theme.

The GitHub and LinkedIn links open in a new tab; the `mailto:` link deliberately does not, since handing a mail client off to a "new tab" isn't a meaningful distinction. `rel="noopener noreferrer"` is **required** alongside `target="_blank"`, not optional polish: without `noopener` the opened page receives a `window.opener` handle back to this one and can navigate it somewhere else, and `noreferrer` additionally withholds the referrer header. Because this is a macro called from both the identity block and the footer, the two attributes land on all four external anchors from one edit — verified in the build output rather than assumed.

- [ ] **Step 3: Write the base layout**

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
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
  <noscript>
    <style>
      #experience, #skills, #education { opacity: 1 !important; transform: none !important; }
      button.chip { cursor: default; }
      button.chip:hover { border-color: var(--border); color: var(--text-muted); }
    </style>
  </noscript>
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

  <div class="filter-bar" data-filter-bar hidden>
    <p class="filter-summary">Filtering Experience by <span class="filter-skills" data-filter-skills></span></p>
    <p class="filter-count" data-filter-count></p>
    <button type="button" class="filter-clear" data-filter-clear>Clear filter</button>
  </div>
  <p class="sr-only" role="status" data-filter-status></p>

  <main>
    {{ content | safe }}
  </main>

  <footer class="site-footer">
    <div class="footer-links">
      {{ contact.contactLinks(resume.links) }}
    </div>
    <a class="download-resume" href="/assets/resume.pdf" download target="_blank" rel="noopener noreferrer">Download Resume (PDF)</a>
    <button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false" aria-label="Toggle dark and light theme">🌓</button>
  </footer>

  <script src="/assets/js/theme-toggle.js"></script>
  <script src="/assets/js/scroll-reveal.js"></script>
  <script src="/assets/js/nav-spy.js"></script>
  <script src="/assets/js/skill-filter.js"></script>
</body>
</html>
```

Note: the theme-detection `<script>` in `<head>` is deliberately inline and unminified/unbundled — it must run synchronously before first paint to avoid a flash of the wrong theme (per the spec). The four files at the end of `<body>` are separate concerns and are created in later tasks (`theme-toggle.js` in Task 6; the other three in Task 5). They are referenced here so the layout is written once; until those tasks run, the browser simply 404s on them and the page still renders — the same pattern this plan already used for `theme-toggle.js`.

Note: the Google Fonts `<link>` loads **Fraunces and Inter only**. Task 5's visual system is a deliberate two-family pairing; there is no third mono register, so nothing else needs fetching. Without this `<link>` both faces silently fall back to `Georgia`/`system-ui`. The `preconnect` hints reduce connection-setup cost since these are the first cross-origin requests the page makes.

Note: the `.filter-bar` block sits **outside** `<main>`, between the header and the content, because Task 5 makes it a second sticky layer directly beneath the sticky header. It ships with the `hidden` attribute and is unhidden by `skill-filter.js` only when a filter is active.

Note: **`[data-filter-status]` is a separate `<p class="sr-only" role="status">` outside the filter bar, not inside it** — and that placement is load-bearing rather than stylistic. A live region inside a container that is `hidden` at page load is not reliably announced by screen readers when it is later revealed and populated in the same tick; keeping the region permanently in the DOM and permanently visible-to-AT (visually hidden via `.sr-only`) is what makes the announcement fire. It is also why the region must exist in the static HTML rather than being created by JS.

Note: the `<noscript>` block does two jobs. It reverses Task 5's scroll-reveal `opacity: 0` initial state, without which a visitor with JS disabled would see Experience/Skills/Education permanently invisible. It also strips the pointer cursor and hover state from `button.chip`, so the evidenced-skill chips don't advertise themselves as clickable when the script that makes them work will never load — without it, a no-JS visitor gets a row of buttons that silently do nothing.

Note: `og:image` and `og:url` use the absolute `siteUrl`, not a root-relative path. The [ogp.me spec](https://ogp.me/) requires both as absolute URLs — off-site crawlers (LinkedIn, Facebook) fetch `og:image` as a standalone resource, and a relative path is the single most common cause of a social share rendering with no image. `og:image:width`/`height` match the dimensions Task 7 generates (1200x630).

- [ ] **Step 4: Replace the placeholder page with real content**

Replace `src/index.njk` entirely:

```njk
---
layout: base.njk
---
{% import "contact-links.njk" as contact %}
<div class="hero">
  <h1>{{ resume.name }}</h1>
  <p class="hero-title">{{ resume.title }}</p>
  <p class="hero-location">{{ resume.location }}</p>
  <p class="hero-tagline">{{ resume.tagline }}</p>
  <div class="hero-links">
    {{ contact.contactLinks(resume.links) }}
  </div>
  <a class="download-resume" href="/assets/resume.pdf" download target="_blank" rel="noopener noreferrer">Download Resume (PDF)</a>
</div>

<section id="experience" class="experience">
  <h2>Experience</h2>
  <ol class="timeline">
    {% for job in resume.experience %}
    <li class="timeline-entry" data-company="{{ job.company }}">
      <h3>{{ job.role }}</h3>
      <p class="timeline-meta">{{ job.company }} · {{ job.dates }}</p>
      <ul>
        {% for bullet in job.bullets %}
        <li{% if bullet.skills %} data-skills="{{ bullet.skills | join('|') }}"{% endif %}>{{ bullet.text }}</li>
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
      {% if item | isEvidenced(resume.experience) %}
      <li><button type="button" class="chip" data-skill="{{ item }}" aria-pressed="false">{{ item }}</button></li>
      {% else %}
      <li><span class="chip">{{ item }}</span></li>
      {% endif %}
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

Note: `title`/`description` are deliberately absent from the front matter — both would otherwise hand-duplicate `resume.name`/`resume.title`/`resume.tagline`, violating this plan's own Global Constraint ("never hand-duplicated into templates"). `base.njk`'s `{{ title or ... }}` / `{{ description or ... }}` fallbacks already cover this page; a future page can still override either.

Note: **the identity block is a `<div class="hero">`, not a `<section>`.** Task 5's CSS uses `main > section` to address the three content sections (grid placement, section rules, scroll-reveal), and a `<section>` hero would be swept up by every one of those rules. Making it a `div` also keeps an unlabelled generic region out of the accessibility tree; the `<h1>` inside it does the semantic work either way.

Note: **`hero-title` and `hero-location` are two elements**, not the single `{{ title }} . {{ location }}` string an earlier draft used. In Task 5's sidebar layout they stack as two short lines in a 21rem column, where one centre-dotted line would wrap badly.

Note: **the identity block carries its own `Download Resume (PDF)` link, and the footer keeps one too.** Both point at the same asset, exactly like the two theme-toggle instances — on desktop the sidebar copy is the one that stays permanently reachable, while the footer copy is what a mobile visitor reaches at the end of the page.

Unlike the contact links, this CTA is **not** a shared macro, so the two instances are edited independently and can drift. Both carry `download` *and* `target="_blank" rel="noopener noreferrer"`. The `download` attribute alone is enough in conforming browsers — they save the file rather than navigating — but iOS Safari has historically ignored `download` for same-origin PDFs and opened them in place, which would take the visitor off the resume. `target="_blank"` covers that case; the two attributes are complementary, not redundant. The `rel` is carried here for the same reason it is on the external links: the rule this project follows is that *every* `target="_blank"` gets one, which is trivially checkable, rather than deciding per anchor whether the destination happens to be trustworthy today.

Note: `.timeline-entry` carries `data-company`. Task 5's `skill-filter.js` reads it to say *where* the matches are ("2 matches in Infor PSSC, Inc.") rather than just how many, so the wording follows the data instead of hardcoding company names.

Note: the bullet loop emits `data-skills="A|B"` **only when the bullet has tags** — pipe-separated because a skill name can contain spaces and commas would be ambiguous. The chip loop asks `isEvidenced` (Step 1) which element to render: a `<button>` carrying `data-skill` and `aria-pressed="false"` for skills with bullet evidence, a plain `<span>` otherwise. Both carry `class="chip"`, so Task 5 styles them identically at rest and splits only on interactivity. **The consequence worth stating plainly: a skill nobody can click is a skill with nothing to show, so the interaction can never lead to a dead end.**

- [ ] **Step 5: Build and verify the real content renders**

`html-validate` is used here for the first time, before Task 8 installs the rest of the CI-only tooling — install it now as a devDependency rather than relying on `npx` to auto-fetch an unpinned version from the network on every run:

```bash
npm install --save-dev html-validate
npm run build
grep -c "Royal Bank of Canada" _site/index.html
grep -c "data-theme-toggle" _site/index.html
grep -c "og:url" _site/index.html
grep -c "contact-link" _site/index.html
grep -c "Fraunces" _site/index.html
grep -o 'data-skill="' _site/index.html | wc -l
grep -o 'data-skills="' _site/index.html | wc -l
grep -o 'class="chip"' _site/index.html | wc -l
grep -c "data-filter-status" _site/index.html
npx html-validate "_site/**/*.html"
```

Expected, against the Task 3 data as written (all confirmed empirically from a real build of these exact files): build exits 0. `Royal Bank of Canada` = 1. `data-theme-toggle` = 2 (header + footer). `og:url` = 1. `contact-link` = 6 (3 links x 2 places — the macro is called from the identity block and the footer). `Fraunces` = 1 (the Google Fonts link). `data-skill="` = **14** — the evidenced skills, i.e. exactly the chips that render as buttons. `data-skills="` = **10** — the tagged bullets out of 12. `class="chip"` = **42** — every skill, buttons and spans together. `data-filter-status` = 1. `html-validate` exits 0.

If `data-skill="` comes back as 0, the `isEvidenced` filter isn't matching: check that the tag strings in `resume.json` are byte-identical to the entries in its `skills[].items` arrays (Task 3's rule 1). This is the one failure in this task that produces a page that looks completely correct and has a dead feature.

- [ ] **Step 6: Commit**

```bash
git add .eleventy.js src/_includes/contact-links.njk src/_layouts/base.njk src/index.njk package.json package-lock.json
git commit -m "feat: build the resume page from layout and real data

Implements the spec's content sections (identity block, Experience,
Skills, Education, footer) as Nunjucks templates consuming
resume.json. Head metadata (title, description, OG tags, favicon link,
Fraunces/Inter web fonts) lives in the shared layout so it doesn't
need repeating per page. Contact links render as icon+text via one
shared macro called from both the identity block and the footer
rather than duplicated markup.

Adds the markup contract for the Skills-to-Experience cross-filter
built in Task 5: tagged bullets carry data-skills, and an isEvidenced
Eleventy filter decides per chip whether to emit an interactive
button or an inert span, so a skill with no bullet-level evidence is
never clickable. The aria-live status region is deliberately a
permanent element outside the hidden filter bar, since a live region
revealed and populated in the same tick is not reliably announced.

Consists of:
- .eleventy.js: isEvidenced filter, WeakMap-cached per build
- src/_includes/contact-links.njk: shared icon+text contact-link macro
- src/_layouts/base.njk: head metadata, nav, header/footer, filter bar,
  status region, FOUC-safe inline theme script, noscript fallbacks
- src/index.njk: identity block, Experience/Skills/Education sections,
  replaces Task 1's placeholder

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Visual design system, sticky sidebar, and the skills cross-filter

**Files:**
- Create: `src/assets/css/style.css`
- Create: `src/assets/js/scroll-reveal.js`
- Create: `src/assets/js/nav-spy.js`
- Create: `src/assets/js/skill-filter.js`

**Interfaces:**
- Consumes: the class names, `id`s and data attributes Task 4's templates emit — `.site-header`, `.site-nav`, `.theme-toggle`, `.hero`, `.hero-title`, `.hero-location`, `.hero-tagline`, `.hero-links`, `.contact-link` **and the `<span>` inside it** (the label underline is styled on that span so the inline SVG icon isn't underlined), `.download-resume` (two instances — sidebar and footer), `[data-filter-bar]`/`[data-filter-skills]`/`[data-filter-count]`/`[data-filter-clear]`/`[data-filter-status]`, `#experience .timeline`, `.timeline-entry`, `.timeline-meta`, `li[data-skills]`, `#skills .skill-group`, `.skill-chips`, `.chip` (on a `<button data-skill aria-pressed>` for evidenced skills, on a `<span>` otherwise), `#education .education-entry`, `.education-note`, `.site-footer`, `.footer-links`. Also consumes the *document order* inside `.timeline-entry` (`h3`, then `.timeline-meta`, then `ul`) — Step 6 flips the first two visually with `order`, which only works against that exact order.
- Produces: the `data-theme` attribute contract — `:root[data-theme="dark"]` overrides the unqualified `:root` (light is the base state, not a separate `[data-theme="light"]` selector), consumed by Task 6's JS. Also produces three class contracts written by this task's own JS and consumed only by this task's own CSS: `.is-visible` on the three sections (`scroll-reveal.js`), `.is-match`/`.is-dim` on bullets and `.is-zero-match` on timeline entries (`skill-filter.js`), plus the `aria-current="location"` attribute on nav links (`nav-spy.js`).

Before writing CSS, invoke the `frontend-design` skill (per the global workflow — implementation-time UI code requires it). It has already been run for this task and its output is recorded as the design direction in Step 1; re-invoke it if any of those decisions are being changed.

- [ ] **Step 1: The design direction (already run through `frontend-design`)**

**Direction: Editorial Restraint** — chosen by the site owner from three explored options (see `docs/superpowers/specs/mockups/2026-08-04-task5-visual-options-mockup.md`) and validated against a working HTML/CSS/JS mockup (`2026-08-04-task5-sidebar-crossfilter-mockup.html`) before this task was written. Distinctiveness comes from typographic confidence and restraint, not from a gimmick or a literal profession metaphor — platform research found the latter has no good precedent in this genre and reads as gimmicky to a hiring manager.

**Type — two families, no third register.** Fraunces (display: the name, job roles, degrees) paired with Inter (everything else). The earlier draft of this task used a three-family system with an IBM Plex Mono "label" register; that is fully replaced here. Section headings, dates, chips and nav are Inter at small sizes with wide tracking and uppercase — the same job the mono register did, without a third font download.

**Color.** Warm paper in light (`#faf9f7`), warm ink in dark (`#151311`). One accent: deep amber.

**The accent is two tokens, not one — this is the single most important thing not to "simplify" later.** `--accent` (`#b5762a` light) is the *decorative* amber: the hero rule, timeline nodes, bullet ticks, the nav indicator underline, borders and focus rings. It is never used for text in light mode, because it measures **3.57:1** on the page background — fine for the 3:1 floor WCAG 1.4.11 sets for graphical objects, and a straight failure of the 4.5:1 floor for text. `--accent-strong` (`#915e22` light) is the same hue (32.8 degrees) and saturation (62.3%) darkened until it clears 4.5:1 everywhere it appears as text or as a fill behind white text: **5.21:1** on the page background, **5.49:1** on surfaces, **4.69:1** on `--accent-soft`, **5.49:1** for white-on-fill in the download CTA. In dark mode both tokens are the same value (`#e8a94d`), which already measures 9.01:1 — the split only does work in light mode. Every one of these numbers is a measured value, not an estimate; Step 15 re-runs the measurement.

**Layout: sticky identity sidebar, page scroll.** At >=68rem wide *and* >=40rem tall, `main` becomes a two-column grid — a sticky `.hero` column (name, title, location, tagline, contact links, download CTA) beside a column carrying Experience/Skills/Education. Below either threshold it is the untouched single-column mobile stack. Two deliberate rejections: there is **no nested `overflow-y: auto` scroll pane** (the sidebar is `position: sticky` inside normal page scroll, so Ctrl+F, print, scroll restoration and keyboard scrolling all behave natively), and **no tabbed sections** (tabs would hide resume content behind a click, break Ctrl+F across the whole document, and give one repeated panel-swap animation instead of a content-level interaction).

**Signature interaction: Skills cross-filters Experience.** Clicking a skill chip highlights the Experience bullets that skill is tagged against and dims the rest. It answers a question a hiring manager actually has ("where did they use Playwright?") at the sentence level, rather than being decorative motion. The emphasis is carried by the *match* (the neutral bullet tick turns amber and grows from 0.6rem x 1px to 0.95rem x 2px), not by crushing the misses (`opacity: 0.5`, still readable) — which is what keeps it quiet and sidesteps a contrast complaint about the dimmed text. An entry with no matches gets a hollow timeline node.

**Nav motion.** Anchor clicks scroll smoothly (`scroll-behavior: smooth`, inside a `prefers-reduced-motion: no-preference` query), and a scroll-spy marks the section currently in view with `aria-current="location"`, which scales a 1px amber underline in from the left under that nav link. Under reduced motion the scroll is an instant jump and the underline appears with no transition — but the spy still marks the current section, because *which section you are in* is information, not animation.

**Accent budget.** At rest the accent appears five times: the hero rule and two timeline nodes (decorative `--accent`), and the two honours tags plus the download CTA (`--accent-strong`). Everything else — chip borders, timeline rails, section rules, contact-link underlines — is a neutral hairline that turns accent on hover, focus, or filter match.

- [ ] **Step 2: Write the CSS custom-property theme system**

Create `src/assets/css/style.css`:

```css
:root {
  --measure: 45rem;
  --sidebar: 21rem;
  --gutter: 1.5rem;
  --radius: 6px;
  --header-h: 3.5rem;
  --chrome-h: 3.5rem;
  --font-display: "Fraunces", "Georgia", serif;
  --font-body: "Inter", system-ui, sans-serif;
  --bg: #faf9f7;
  --surface: #fff;
  --text: #1c1a17;
  --text-muted: #6b665f;
  --border: #e5e0d8;
  --border-strong: #8d8377;
  --accent: #b5762a;
  --accent-strong: #915e22;
  --accent-hover: #7c511d;
  --accent-soft: #f6ecdc;
  --accent-contrast: #fff;
}

:root[data-theme="dark"] {
  --bg: #151311;
  --surface: #1d1a17;
  --text: #ece7e0;
  --text-muted: #a8a097;
  --border: #2c2825;
  --border-strong: #8b8177;
  --accent: #e8a94d;
  --accent-strong: #e8a94d;
  --accent-hover: #f0bd6f;
  --accent-soft: #33281a;
  --accent-contrast: #151311;
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

```

Note on the token set. `--measure`, `--sidebar` and `--gutter` exist because the content column's width is needed in three places (`main`, the sticky header's padding, the filter bar's padding) and they must agree exactly or the header/content misalignment goes straight back the next time one is nudged. `--header-h` is consumed by the filter bar's `top` and by the sidebar's `top`/`max-height`, so the two sticky layers stack without overlapping. `--border` is decorative hairlines with no contrast floor; `--border-strong` is anything WCAG 1.4.11 governs (the theme-toggle boundary, the contact-link underlines) and measures above 3:1 on every surface it sits on in both themes.

Note on `"Georgia"` and `"Inter"` being quoted. Stylelint's `value-keyword-case` rule exempts the `font-family` *property*, but these values live inside custom properties, where it has no way to know they're font names and flags them as mis-cased keywords. Confirmed empirically — unquoted, `npx stylelint` fails with `Expected "Inter" to be "inter"`.

`scroll-behavior: smooth` is scoped to `@media (prefers-reduced-motion: no-preference)` rather than set unconditionally. This is what makes every in-page anchor click (the nav links) animate, and it is also the whole reduced-motion story for navigation — no JS is involved in the scrolling itself.

- [ ] **Step 3: Style the header, the nav scroll-spy indicator, and the theme toggle**

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
  min-height: var(--header-h);
  padding: 0.7rem calc(max(0px, (100% - var(--measure)) / 2) + var(--gutter));
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.site-nav {
  display: flex;
  gap: 1.75rem;
}

.site-nav a {
  position: relative;
  color: var(--text-muted);
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.site-nav a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -0.35rem;
  width: 100%;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
}

.site-nav a:hover {
  color: var(--accent-strong);
}

.site-nav a[aria-current="location"] {
  color: var(--accent-strong);
}

.site-nav a[aria-current="location"]::after {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: no-preference) {
  .site-nav a {
    transition: color 0.2s ease;
  }

  .site-nav a::after {
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }
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

The `padding` expression keeps the header full-bleed (it's sticky chrome; its background should span the viewport) while insetting its *contents* to exactly where `main`'s content starts. `100%` in a padding value resolves against the containing block's inline size, so header and content always agree; `max(0px, ...)` collapses the inset to zero once the viewport is narrower than the measure. Step 11 overrides both sides of this once the sidebar grid engages, because at that point the content is no longer centred on `--measure` alone.

The nav indicator is a `::after` underline that is always present but `scaleX(0)` at rest, scaled to 1 when `nav-spy.js` sets `aria-current="location"`. Driving it from the ARIA attribute rather than a separate class means the visual state and the accessibility state physically cannot drift apart — there is only one thing to set. `transform-origin: left center` makes it wipe in from the left rather than growing from the middle.

Both nav transitions live inside `@media (prefers-reduced-motion: no-preference)`, so under reduced motion the underline snaps rather than wipes. The `aria-current` attribute itself is still set — the spy keeps working, only its animation stops. Confirmed empirically under an emulated `prefers-reduced-motion: reduce`: `transition-duration` on the indicator measures `0s` while exactly one nav link still carries `aria-current`.

`.site-nav a:hover` and `[aria-current]` use `--accent-strong`, not `--accent` — they are text.

- [ ] **Step 4: Style the cross-filter bar**

Append to `style.css`:

```css
.filter-bar {
  position: sticky;
  top: var(--header-h);
  z-index: 9;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.9rem;
  align-items: baseline;
  padding: 0.55rem calc(max(0px, (100% - var(--measure)) / 2) + var(--gutter));
  background: var(--accent-soft);
  border-bottom: 1px solid var(--border);
  font-size: 0.8125rem;
}

.filter-bar[hidden] {
  display: none;
}

.filter-summary,
.filter-count {
  margin: 0;
}

.filter-count {
  color: var(--text-muted);
}

.filter-skills {
  color: var(--accent-strong);
  font-weight: 600;
}

.filter-clear {
  margin-left: auto;
  padding: 0;
  background: none;
  border: none;
  color: var(--text);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.filter-clear:hover {
  color: var(--accent-strong);
}

```

This is the strip that appears under the sticky header while a filter is active. It exists for a concrete reason: Skills sits *below* Experience in the scroll order, so clicking a chip changes content that has already scrolled off above it. Without a persistent bar, a visitor who scrolls back down to Skills has no visible indication that a filter is on and no way to clear it without hunting for the pressed chip. `top: var(--header-h)` parks it directly beneath the header; `z-index: 9` keeps it under the header (`z-index: 10`) but above content.

`.filter-bar[hidden] { display: none }` is load-bearing, not redundant. The bar is `display: flex`, and an explicit `display` value overrides the `hidden` attribute's UA default of `display: none` — without this rule the "hidden" bar renders as an empty amber strip on every page load.

**The filter bar is a *second* sticky layer, and its height is variable.** Everything that positions itself below the sticky chrome — the sidebar's `top` and `max-height` (Step 11), and the `scroll-margin-top` on both sections (Step 5) and timeline entries (Step 6) — is written against `--chrome-h` rather than `--header-h`, so all of it shifts together the moment the bar appears. `--chrome-h` defaults to the header's height in Step 2 and is **measured and rewritten at runtime by `skill-filter.js`** (Step 14).

**It has to be measured, not hardcoded, and this is worth stating plainly because a constant looks perfectly adequate right up until it isn't.** An earlier version of this task set `--chrome-h: 6rem` from a fixed rule, sized against a bar holding one or two chips. But the bar is `flex-wrap: wrap` and the filter is multi-select across 14 evidenced chips, so its height grows with the number of active chips and shrinks as the viewport widens. Measured on the real page: the bar is **67px with 3 chips active, 87px with 5, and 108px with all 14**. Against the old 96px constant, three or more active chips below the sidebar breakpoint put the bar's real bottom edge **21-46px past** where the headings had been offset to, and the heading sat behind it — reproducible at 768px, 900px and 1000px, and invisible at wider viewports because more chips fit per row there.

The runtime measurement removes the whole class of bug rather than re-tuning the constant: `--chrome-h` is always `header.offsetHeight + (bar.hidden ? 0 : bar.offsetHeight)`, kept current by a `ResizeObserver` on both elements. Verified across a 3x3 matrix (768/900/1000px x 3/5/14 active chips): no section heading is ever covered, with the tightest clearance at 15.3px.

`.filter-clear` is styled from a real `<button>` rather than a link because it performs an action rather than navigating; `font: inherit` is needed because buttons don't inherit typography.

- [ ] **Step 5: Style the content column, section headings, hero/sidebar, contact links, and the download CTA**

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

main > section > h2 {
  margin: 0 0 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

#experience,
#skills,
#education {
  scroll-margin-top: calc(var(--chrome-h) + 1rem);
}

.hero {
  padding: 3.5rem 0 4rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.125rem, 7vw, 3.5rem);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -0.025em;
}

.hero-title {
  margin: 1rem 0 0.2rem;
  color: var(--text-muted);
  font-size: 0.8125rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-location {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.hero-tagline {
  max-width: 52ch;
  margin: 1.75rem 0 2rem;
  font-size: 1.0625rem;
}

.hero-tagline::before {
  content: "";
  display: block;
  width: 3.25rem;
  height: 3px;
  margin-bottom: 1.5rem;
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

.contact-link span {
  border-bottom: 1px solid var(--border-strong);
  transition: border-color 0.15s ease;
}

.contact-link:hover {
  color: var(--accent-strong);
}

.contact-link:hover span {
  border-color: var(--accent);
}

.download-resume {
  display: inline-block;
  padding: 0.65rem 1.1rem;
  background: var(--accent-strong);
  border-radius: var(--radius);
  color: var(--accent-contrast);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.download-resume:hover {
  background: var(--accent-hover);
}

.hero .download-resume {
  margin-top: 1.75rem;
}

```

This step styles the hero as the **single-column mobile case only** — it is a normal block at the top of the page. Step 11 is what turns it into the sticky sidebar at wide-and-tall viewports. Writing it in this order is what makes the layout mobile-first in fact and not just in claim: the base stylesheet knows nothing about a sidebar.

**The section rule lives on the heading, not the section box.** A `border-bottom` on every `section` would put a rule under `#education` too, leaving a stray hairline floating above the footer attached to nothing. As a `border-top` on `h2` it renders exactly three times, always immediately above the label that explains it, and is structurally incapable of trailing — there is no fourth heading.

**The hero's accent is a mark, not a full-width rule** — a 3.25rem bar drawn by `.hero-tagline::before`, which is what lets it sit *between* the title/location lines and the tagline without needing a wrapper element.

**`.hero-title` and `.hero-location` are separate elements** (Task 4 splits them) rather than one `title . location` string. In the sidebar they stack as two short lines; a single centre-dotted line would wrap awkwardly in a 21rem column.

**The `h1` uses `clamp()`** so no media query is needed for it in the single-column case. Step 11 re-clamps it to a smaller range for the narrow sidebar column.

`.download-resume` appears twice in the DOM (sidebar and footer). Its base rule is defined here once; `.hero .download-resume` and `.site-footer .download-resume` only adjust placement. **These three rules must stay in this relative order** — the bare `.download-resume` (0,1,0) before both descendant forms (0,2,0). Stylelint's `no-descending-specificity` rule fails the build if a lower-specificity selector for the same element appears after a higher one.

The CTA's background is `--accent-strong`, not `--accent`: it carries white text, and white on `#b5762a` measures 3.76:1 — a failure. On `--accent-strong` it measures 5.49:1.

`.contact-link span` carries a permanent `--border-strong` underline so the links are identifiable without relying on colour (WCAG 1.4.1), and so hover has something to change rather than inventing an affordance.

- [ ] **Step 6: Style the Experience timeline**

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
  padding: 0 0 2.75rem 1.6rem;
  border-left: 1px solid var(--border);
  scroll-margin-top: calc(var(--chrome-h) + 1.5rem);
}

.timeline-entry:last-child {
  padding-bottom: 0;
}

.timeline-entry::before {
  content: "";
  position: absolute;
  top: 0.45rem;
  left: -4.5px;
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--bg);
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

.timeline-entry .timeline-meta {
  order: -1;
  margin: 0 0 0.3rem;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.timeline-entry h3 {
  margin: 0 0 1rem;
  font-size: 1.3125rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.timeline-entry ul {
  display: grid;
  gap: 0.65rem;
  max-width: 58ch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-entry ul li {
  position: relative;
  padding-left: 1.5rem;
  line-height: 1.6;
  transition: opacity 0.18s ease;
}

.timeline-entry ul li::before {
  content: "";
  position: absolute;
  top: 0.75em;
  left: 0;
  width: 0.6rem;
  height: 1px;
  background: var(--border-strong);
  transition: background-color 0.18s ease, width 0.18s ease, height 0.18s ease;
}

```

The bullet lists are the highest-content-density part of the page, so they get a real treatment rather than browser defaults: no disc, no 40px indent, a `grid` gap between items, a `58ch` measure, and a short horizontal tick as the marker. The tick is `--border-strong`, deliberately *not* the accent — twelve accent-coloured markers would put the accent back onto the highest-frequency element on the page. The tick being neutral at rest is also precisely what gives the cross-filter (Step 7) something quiet to change.

`.timeline-entry` keeps its left border on every entry including the last, so the rail is continuous. `left: -4.5px` centres the 8px node on the 1px border: for an absolutely-positioned child, `left` is measured from the containing block's *padding* box, so the border occupies -1px to 0px and its centre is at -0.5px. The `box-shadow` is a `--bg`-coloured ring that punches the rail out from behind the node.

`order: -1` on `.timeline-meta` puts company and dates above the role without touching Task 4's markup — the flex container reorders them visually while the DOM keeps the role first. This is safe here specifically because neither element is focusable, so there is no tab-order/visual-order mismatch (WCAG 2.4.3 is unaffected), and both sequences are meaningful readings of a resume entry (WCAG 1.3.2). It would **not** be safe on a group containing links or buttons.

The `transition` declarations on `li` and `li::before` are what make the cross-filter fade rather than snap; they are declared here, on the resting state, so both directions of the transition are covered.

`.timeline-entry` carries its own `scroll-margin-top` because Step 14 scrolls to an *entry*, not to a section — the section-level offset in Step 5 would not apply. Like every other chrome-relative offset in this file it is expressed against `--chrome-h`, so it tracks the filter bar's real height.

- [ ] **Step 7: Style the cross-filter states**

Append to `style.css`:

```css
.timeline-entry ul li.is-match::before {
  width: 0.95rem;
  height: 2px;
  background: var(--accent);
}

.timeline-entry ul li.is-dim {
  opacity: 0.5;
}

.timeline-entry.is-zero-match::before {
  background: var(--bg);
  box-shadow: 0 0 0 4px var(--bg), inset 0 0 0 1.5px var(--border-strong);
}

```

Three rules, and that is the entire visual weight of the signature interaction — which is the point. `skill-filter.js` (Step 14) only adds and removes these classes; all appearance lives here.

**Emphasis is on the match, not on the miss.** `.is-match` turns the neutral tick amber and grows it from 0.6rem x 1px to 0.95rem x 2px. `.is-dim` only drops to `opacity: 0.5` — enough to recede, not enough to become unreadable or to look like disabled content. The alternative (dimming hard, e.g. 0.25) would have made the un-matched two-thirds of the resume effectively unreadable while a filter is on, and would have invited a legitimate contrast objection about body text.

`.is-zero-match` hollows the entry's timeline node — background becomes `--bg` with an inset ring — so an entire job with no matching bullets reads as "nothing here" at a glance rather than making the visitor scan six dimmed bullets to work it out.

If these rules are ever reordered, re-check stylelint's `no-descending-specificity`: `.timeline-entry ul li.is-match::before` must not end up before the plain `.timeline-entry ul li::before` it overrides.

- [ ] **Step 8: Style Skills and Education**

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
  padding-top: 0.35rem;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
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
  display: inline-block;
  padding: 0.28rem 0.6rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  font: inherit;
  font-size: 0.8125rem;
  line-height: 1.4;
}

span.chip {
  cursor: default;
}

button.chip {
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
}

button.chip:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

button.chip[aria-pressed="true"] {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
  font-weight: 600;
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
  margin: 0 0 0.35rem;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.education-entry > p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.education-entry .education-note {
  display: inline-block;
  margin-top: 0.6rem;
  padding: 0.15rem 0.5rem;
  background: var(--accent-soft);
  border-radius: var(--radius);
  color: var(--accent-strong);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
}

```

`.chip` is a single class applied to **two different elements** — a `<button>` for skills with bullet-level evidence, a `<span>` for those without (Task 4 decides which). The shared `.chip` rule therefore has to neutralise button defaults: `font: inherit` (buttons do not inherit typography) and an explicit `display: inline-block`. `span.chip` and `button.chip` then split only on interactivity, so an inert chip is visually identical to an interactive one at rest but has no pointer cursor, no hover state, and no tab stop.

`button.chip[aria-pressed="true"]` styles the active state straight off the ARIA attribute, exactly like the nav indicator in Step 3 — one source of truth for visual and assistive state. Active chips use `--accent-strong` on `--accent-soft` (4.69:1), not `--accent` (3.21:1, a failure).

`.education-entry .education-note` uses **two class selectors deliberately**. `.education-entry > p` (0,1,1) would otherwise beat a single-class `.education-note` (0,1,0) and silently repaint the honours note as ordinary muted metadata — the note is a `<p>` inside `.education-entry`, so both selectors match it. The two-class form (0,2,0) is what makes the intended rule win. Anyone "simplifying" these two selectors needs to re-check that the honours tag still renders as a tinted tag.

Both lists use `+`-combinator separators (`.skill-group + .skill-group`, `.education-entry + .education-entry`) rather than a rule on every item, so — like the section headings in Step 5 — a trailing separator is structurally impossible rather than something to remember to suppress.

- [ ] **Step 9: Style the footer and the focus states**

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

.site-footer .download-resume {
  margin-left: auto;
}

.site-nav a:focus-visible,
.contact-link:focus-visible,
.theme-toggle:focus-visible,
.download-resume:focus-visible,
.filter-clear:focus-visible,
button.chip:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

```

The focus-visible list covers every interactive element on the page, including the two added by this task's interaction work (`.filter-clear` and `button.chip`). This matters more here than on a typical static page: chips are the primary interaction surface and are otherwise hover-only, so without a focus ring a keyboard user filtering the resume would have no idea which chip they are about to press. `outline-offset: 3px` clears the 6px radius — at 2px the ring visibly clipped the corners.

`.site-footer .download-resume` must stay after the bare `.download-resume` from Step 5 for `no-descending-specificity`; it is placed here rather than there because it is a footer-layout concern.

- [ ] **Step 10: Add the scroll-reveal states**

Append to `style.css`:

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

The spec calls for "fade-in on section entry" — triggered by scrolling a section into view, not a one-time page-load animation on every section at once. This CSS only declares the two states; `scroll-reveal.js` (Step 12) does the scroll-triggered class toggling via `IntersectionObserver`.

The whole block sits inside `@media (prefers-reduced-motion: no-preference)`, so under reduced motion the `opacity: 0` initial state never applies at all and the sections are simply visible — which is why `scroll-reveal.js` can safely bail out entirely in that case. Scoped to the three content sections, never `.hero`: the hero is above the fold on load, so a scroll reveal doesn't apply to it (and in the sidebar layout it must never be transparent).

- [ ] **Step 11: Add the sidebar grid, the responsive rules, and the print rules**

Append to `style.css`:

```css
@media (width >= 40rem) {
  .skill-group {
    grid-template-columns: 8rem 1fr;
    gap: 1.5rem;
    align-items: start;
  }
}

@media (width >= 68rem) and (height >= 40rem) {
  main {
    display: grid;
    grid-template-columns: var(--sidebar) minmax(0, var(--measure));
    grid-template-rows: repeat(3, auto);
    gap: 0 4rem;
    justify-content: center;
    max-width: none;
    padding-top: 2.5rem;
  }

  .hero {
    grid-column: 1;
    grid-row: 1 / -1;
    position: sticky;
    top: calc(var(--chrome-h) + 2rem);
    align-self: start;
    max-height: calc(100vh - var(--chrome-h) - 4rem);
    padding: 0;
    overflow-y: auto;
  }

  .hero h1 {
    font-size: clamp(2rem, 3.2vw, 2.75rem);
  }

  .hero-tagline {
    margin: 1.5rem 0;
    font-size: 0.9375rem;
  }

  .hero-links {
    flex-direction: column;
    gap: 0.6rem;
  }

  main > section {
    grid-column: 2;
  }

  .site-header,
  .filter-bar {
    padding-right: calc(max(0px, (100% - var(--measure) - var(--sidebar) - 4rem) / 2) + var(--gutter));
    padding-left: calc(max(0px, (100% - var(--measure) - var(--sidebar) - 4rem) / 2) + var(--gutter));
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
    scroll-margin-top: calc(var(--chrome-h) + 3rem);
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

  .timeline-entry ul li.is-dim {
    opacity: 1 !important;
    transition: none !important;
  }

  .timeline-entry.is-zero-match::before {
    background: var(--accent) !important;
    box-shadow: none !important;
  }

  .site-header,
  .filter-bar {
    display: none;
  }
}
```

**The sidebar breakpoint is a two-axis query: `(width >= 68rem) and (height >= 40rem)`.** The width clause is the obvious one — 21rem sidebar + 45rem measure + 4rem gap needs about 1120px before it stops squeezing the content column. The **height clause is the accessibility-critical one**: a sticky column taller than the viewport strands its lower content (the contact links and the download CTA) permanently out of reach. That is exactly what a user at 200% browser zoom, or on a short laptop viewport, would hit. Below 40rem tall the layout falls back to the single-column stack where everything scrolls normally. Confirmed empirically at 1400x560: `.hero` computes `position: static`.

**`grid-template-rows: repeat(3, auto)` is deliberate and is a maintenance hazard worth naming.** The sidebar spans the full height of the content column via `grid-row: 1 / -1`, and `-1` resolves against the **explicit** grid. Declaring the three rows explicitly is what guarantees the span reaches the bottom of Education. Confirmed empirically in Chromium that the sticky column also survives *without* this declaration (implicit tracks happen to satisfy `-1` there) — but that is engine-dependent behaviour, and the explicit form is the spec-guaranteed one. **If a Projects section is ever added, this count must go to 4**, or the sidebar will silently stop sticking partway down the new section. Measured with it in place at 1400x900: the hero pins at `top: 88px` and stays there through maximum scroll (`scrollY = 1449`), rather than scrolling away.

The sidebar's `top` and `max-height` are written against `--chrome-h`, not `--header-h`, so both shift down automatically while the filter bar is showing, by however much the bar actually measures — see Step 4 for why that value has to be measured rather than assumed.

The header and filter bar get a **different** padding expression inside this query than the one from Step 3 — once the sidebar exists, the content is centred on `sidebar + gap + measure`, not on `measure` alone, so the Step 3 expression would leave the nav orphaned from the column it navigates.

The `@media print` block does four things, and three of them are bug fixes rather than polish. Forcing the three sections opaque is necessary because the scroll-reveal's `opacity: 0` initial state applies under `print` too — `IntersectionObserver` fires against the scrolling viewport, not a print render, so a recruiter hitting Ctrl+P on landing without scrolling would otherwise get a document with Skills and Education silently blank. `transition: none !important` on both the sections and the dimmed bullets is load-bearing rather than decorative: confirmed empirically that without it a dimmed bullet still measures `opacity: 0.957` at print time because the 0.18s transition is mid-flight, and would race an actual print snapshot; with it the value is `1` immediately. Restoring `.is-dim` and `.is-zero-match` means **printing while a filter is active still produces the complete, un-faded resume** — the filter is a reading aid on screen, and must never silently ship a half-greyed PDF to a recruiter. The sticky chrome is hidden because a header and filter bar frozen across a printed page are noise.

- [ ] **Step 12: Create the scroll-reveal script**

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

Three fallback paths, each deliberate: under `prefers-reduced-motion: reduce`, skip entirely (Step 10's CSS leaves the sections visible in that case, so there is nothing to reveal). Without `IntersectionObserver`, mark everything visible immediately rather than leaving sections permanently hidden. `unobserve` after the first trigger — this is a one-time reveal per section, not a repeat-on-every-scroll-past animation.

- [ ] **Step 13: Create the nav scroll-spy script**

Create `src/assets/js/nav-spy.js`:

```js
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".site-nav a[href^='#']"));

  if (!links.length || !("IntersectionObserver" in window)) {
    return;
  }

  var targets = [];

  links.forEach(function (link) {
    var section = document.getElementById(link.getAttribute("href").slice(1));
    if (section) {
      targets.push({ link: link, section: section, visible: false });
    }
  });

  if (!targets.length) {
    return;
  }

  function refresh() {
    var current = null;
    targets.forEach(function (target) {
      if (target.visible && !current) {
        current = target;
      }
    });
    targets.forEach(function (target) {
      if (target === current) {
        target.link.setAttribute("aria-current", "location");
      } else {
        target.link.removeAttribute("aria-current");
      }
    });
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        targets.forEach(function (target) {
          if (target.section === entry.target) {
            target.visible = entry.isIntersecting;
          }
        });
      });
      refresh();
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: 0 }
  );

  targets.forEach(function (target) {
    observer.observe(target.section);
  });
})();
```

This script does **not** early-return under reduced motion, and that is intentional: it sets `aria-current`, which is information about where you are, not an animation. Step 3's CSS removes the transition instead, so the indicator still moves — it just doesn't glide.

It also does not scroll anything. Smooth scrolling on nav clicks is pure CSS (`scroll-behavior`, Step 2), so there is no click handler here to conflict with the browser's native anchor handling, no `preventDefault`, and no risk of breaking the URL hash or the back button.

`rootMargin: "-20% 0px -55% 0px"` shrinks the observation band to roughly the upper-middle of the viewport, so the "current" section is the one you're actually reading rather than whichever one has a pixel on screen. When several sections intersect that band, `refresh()` picks the first in document order, so exactly one link is ever marked. Verified: scrolling to `#skills` leaves exactly one `[aria-current]` link and it is the Skills link.

`aria-current="location"` rather than `"page"` — the links do not navigate to a different page, they mark a position within this one.

- [ ] **Step 14: Create the skills cross-filter script**

Create `src/assets/js/skill-filter.js`:

```js
(function () {
  var chips = Array.prototype.slice.call(document.querySelectorAll("button.chip[data-skill]"));
  var bullets = Array.prototype.slice.call(document.querySelectorAll(".timeline-entry ul li"));
  var entries = Array.prototype.slice.call(document.querySelectorAll(".timeline-entry"));
  var header = document.querySelector(".site-header");
  var bar = document.querySelector("[data-filter-bar]");
  var skillsLabel = document.querySelector("[data-filter-skills]");
  var countLabel = document.querySelector("[data-filter-count]");
  var clearButton = document.querySelector("[data-filter-clear]");
  var status = document.querySelector("[data-filter-status]");
  var root = document.documentElement;

  if (!chips.length || !bullets.length || !bar) {
    return;
  }

  var active = [];

  // The filter bar is a second sticky layer and it wraps, so its height depends
  // on how many chips are active and how wide the viewport is. Measure it rather
  // than assume: --chrome-h drives the sidebar's offset and every section's and
  // entry's scroll-margin-top, and a stale value hides headings behind the bar.
  function chromeHeight() {
    return (header ? header.offsetHeight : 0) + (bar.hidden ? 0 : bar.offsetHeight);
  }

  function syncChrome() {
    root.style.setProperty("--chrome-h", chromeHeight() + "px");
  }

  function skillsOf(li) {
    var raw = li.getAttribute("data-skills");
    return raw ? raw.split("|") : [];
  }

  function isActive(skill) {
    return active.indexOf(skill) !== -1;
  }

  function paint(previewSkill) {
    var effective = previewSkill ? [previewSkill] : active;
    var filtering = effective.length > 0;
    var matched = 0;

    bullets.forEach(function (li) {
      if (!filtering) {
        li.classList.remove("is-match", "is-dim");
        return;
      }
      var hit = skillsOf(li).some(function (skill) {
        return effective.indexOf(skill) !== -1;
      });
      li.classList.toggle("is-match", hit);
      li.classList.toggle("is-dim", !hit);
      if (hit) {
        matched += 1;
      }
    });

    entries.forEach(function (entry) {
      if (!filtering) {
        entry.classList.remove("is-zero-match");
        return;
      }
      entry.classList.toggle("is-zero-match", !entry.querySelector("li.is-match"));
    });

    return matched;
  }

  function matchedCompanies() {
    var names = [];
    entries.forEach(function (entry) {
      if (!entry.querySelector("li.is-match")) {
        return;
      }
      var name = entry.getAttribute("data-company");
      if (name && names.indexOf(name) === -1) {
        names.push(name);
      }
    });
    return names;
  }

  function joinNames(names) {
    if (names.length < 2) {
      return names[0] || "";
    }
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  function summarise(matched) {
    var where = joinNames(matchedCompanies());
    return matched + (matched === 1 ? " match" : " matches") + (where ? " in " + where : "");
  }

  function announce(matched) {
    if (!active.length) {
      bar.hidden = true;
      syncChrome();
      if (status) {
        status.textContent = "Filter cleared. Showing all " + bullets.length + " bullets.";
      }
      return;
    }
    var names = active.join(", ");
    var summary = summarise(matched);
    bar.hidden = false;
    if (skillsLabel) {
      skillsLabel.textContent = names;
    }
    if (countLabel) {
      countLabel.textContent = summary;
    }
    syncChrome();
    if (status) {
      status.textContent = "Filtering Experience by " + names + ". " + summary + ".";
    }
  }

  function commit() {
    announce(paint(null));
  }

  function clearAll() {
    active = [];
    chips.forEach(function (chip) {
      chip.setAttribute("aria-pressed", "false");
    });
    commit();
  }

  // Scroll to the first matching bullet's entry, not to the top of Experience.
  // Filtering by a skill that only appears in the lower entry used to land the
  // reader on the upper one, which by then is fully dimmed with a hollow node —
  // all of the negative signal and none of the positive.
  function revealFirstMatch() {
    var li = document.querySelector(".timeline-entry li.is-match");
    if (!li) {
      return;
    }
    var box = li.getBoundingClientRect();
    if (box.top >= chromeHeight() && box.bottom <= window.innerHeight) {
      return;
    }
    var entry = li.closest(".timeline-entry") || li;
    entry.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }

  chips.forEach(function (chip) {
    var skill = chip.getAttribute("data-skill");

    chip.addEventListener("pointerenter", function () {
      if (!active.length) {
        paint(skill);
      }
    });

    chip.addEventListener("pointerleave", function () {
      if (!active.length) {
        paint(null);
      }
    });

    chip.addEventListener("click", function () {
      if (isActive(skill)) {
        active = active.filter(function (name) {
          return name !== skill;
        });
        chip.setAttribute("aria-pressed", "false");
      } else {
        active = active.concat([skill]);
        chip.setAttribute("aria-pressed", "true");
      }
      commit();
      if (active.length) {
        revealFirstMatch();
      }
    });
  });

  if (clearButton) {
    clearButton.addEventListener("click", clearAll);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && active.length) {
      clearAll();
    }
  });

  if (typeof ResizeObserver === "function") {
    var observer = new ResizeObserver(syncChrome);
    observer.observe(bar);
    if (header) {
      observer.observe(header);
    }
  } else {
    window.addEventListener("resize", syncChrome);
  }

  syncChrome();
})();
```

**`bullets` selects every `.timeline-entry ul li`, not only `li[data-skills]`.** This is the one place where the validated mockup was actually wrong and the difference is user-visible: if untagged bullets are excluded from the collection they never receive `.is-dim`, so while a filter is active they sit at full opacity next to the genuine matches and read as matches themselves. Selecting all of them means an untagged bullet correctly dims, and it also makes the announced denominator honest — "1 of 12", where 12 is every bullet in Experience.

**Filtering is OR (union) across multiple active chips.** Bullets carry one to three tags, so AND would hit the empty set on the second click and read as broken; OR answers the question a visitor is actually asking ("show me everywhere they used any of these").

**Hover previews only when nothing is committed.** `paint(previewSkill)` renders a transient state without touching `active`, `aria-pressed`, the filter bar or the live region — so a mouse user gets a free look at what a chip would do, while a touch or keyboard user (who cannot hover) loses nothing but the preview. Once a filter is committed, previews are suppressed, so hovering another chip can never appear to silently change a filter the visitor deliberately set.

**`revealFirstMatch()` scrolls to the first matching bullet's entry, not to the top of Experience — and this distinction is the whole point.** Scrolling to the section looked correct and tested fine, because with a skill that matches the first entry the two land in the same place. It fails on exactly the case the feature is for: filtering by a skill that only appears in the *lower* entry scrolled the reader to the top of Experience, where the upper entry was by then fully dimmed with a hollow node. The reader was shown all of the negative signal and none of the positive, with the highlighted bullets below the fold. Scrolling to the matched entry puts the amber ticks on screen instead.

**It also skips the scroll entirely when the first match is already visible**, measured against the live chrome height rather than the viewport top, so filtering something already on screen doesn't lurch the page.

**The status text names where the matches are, not just how many.** "2 matches in Infor PSSC, Inc." answers the question a bare count leaves open, and it is what makes the interaction legible even when a match is off-screen. `matchedCompanies()` reads `data-company` off each entry that contains a match (Task 4 emits it), so the wording follows the data rather than hardcoding company names. Both the visible bar and the live region use the same sentence.

**`syncChrome()` is why the filter bar can wrap freely.** It writes `--chrome-h` as the measured header plus bar height on every state change, and a `ResizeObserver` on both elements keeps it current through viewport resizes and chip toggles. A `window.resize` listener stands in where `ResizeObserver` is unavailable. See Step 4 for the bug this replaced.

**Escape clears from anywhere**, which is the keyboard equivalent of the bar's Clear button and means a visitor can always get back to the unfiltered resume without hunting for the pressed chip.

The early `return` when there are no chips, no bullets, or no filter bar keeps the script inert rather than throwing if the markup ever changes — relevant because `resume.json` could legitimately end up with no tagged bullets at all, in which case Task 4 renders zero `<button class="chip">` elements and this whole feature correctly disappears instead of erroring.

Note that `aria-pressed` is toggled on the chip itself and the CSS in Step 8 keys off that attribute, so there is no separate "active" class to keep in sync.

- [ ] **Step 15: Verify lint, build, contrast, and the interaction behaviour**

`scripts/` doesn't exist yet at this point (Task 7 creates it) — same hazard already documented for Task 1/2's `lint` script; don't include it here:

```bash
npx stylelint "src/assets/css/**/*.css"
npx eslint src/assets/js .eleventy.js eslint.config.js
npm run build
npx html-validate "_site/**/*.html"
npm run serve
```

Expected: all five exit 0. With the dev server running, verify each of the following — these are the behaviours this task exists to produce, and several of them caught real defects during authoring, so none of them are ceremonial:

**Sidebar.** At a wide, tall window (at least 1120x640), confirm the identity column sits left and stays pinned while Experience/Skills/Education scroll past it — scroll all the way to the bottom of Education and confirm the sidebar is *still* on screen, not scrolled away. Then shorten the window to under ~640px tall and confirm the layout drops to a single column with everything scrolling normally. Then narrow to 375px and confirm no horizontal scrollbar appears.

**Cross-filter.** Hover a chip with a border (e.g. Playwright) without clicking: matching bullets' ticks turn amber, the rest dim, and no filter bar appears. Move away: everything returns to normal. Now click it: the amber filter bar appears reading "1 match in Royal Bank of Canada (RBC)", and the chip stays visibly active. Click a second chip (e.g. Landmark Pattern Language (LPL)): the count rises to 3 rather than dropping to zero — that confirms OR, not AND — and the bar now names both companies. Click Playwright again to release it: LPL alone matches only Infor, so the RBC entry's timeline node goes hollow. Press Escape: everything clears and the bar disappears. Confirm a chip with no border (e.g. Postman, Trello, Java, Docker, Selenium) is not clickable and shows no pointer cursor.

**Scroll target.** From the top of the page, click a skill that only matches the *lower* Experience entry (Landmark Pattern Language (LPL) or Business Logic Testing (BLT)). The page must land on the Infor entry with its amber-ticked bullets visible below the sticky chrome — **not** on the top of Experience showing the dimmed, hollow-noded RBC entry. Then, with those bullets already on screen, click another chip: the page must not jump.

**Wrapped filter bar.** Narrow the window to ~900px (below the sidebar breakpoint) and activate 5 or more chips so the filter bar wraps to two or three lines. Click each nav link in turn: every section heading must land clear of the bar, not behind it. This is the case a fixed `--chrome-h` got wrong.

**Keyboard and screen reader.** Tab to a chip and press Enter — it must activate exactly as a click does. Inspect the chip in devtools and confirm `aria-pressed` flips `false` to `true`. Confirm the `[data-filter-status]` paragraph's text content updates to a full sentence naming the skill and the counts. **Lighthouse will not catch a broken `aria-pressed` or a live region that never fires**, so this check is not covered by the CI gate in Task 8 and has to be done by eye here.

**Nav.** Click each nav link and confirm the page glides rather than jumping, and that the amber underline moves to the clicked link and then tracks the section you scroll into. Enable "Emulate prefers-reduced-motion" in devtools and repeat: navigation must jump instantly and the underline must appear without animating, but it must still mark the correct section.

**Degraded paths.** Disable JavaScript and reload: all sections visible, all 12 bullets present and undimmed, no filter bar, and the chip buttons must not show a pointer cursor (Task 4's `<noscript>` block handles that last one). With JS back on, apply a filter and then open print preview (Ctrl+P) **without clearing it**: the printed document must show every bullet at full opacity with no header or filter bar.

Stop the server (Ctrl+C) when done.

Note for anyone automating this check: `scroll-behavior: smooth` interferes with headless-browser hover tests, because the driver computes an element's box before the scroll animation settles and then moves the pointer to a stale position. Scroll with `behavior: "instant"` and settle before hovering, or the hover-preview assertions will fail spuriously against working code.

- [ ] **Step 16: Commit**

```bash
git add src/assets/css/style.css src/assets/js/scroll-reveal.js src/assets/js/nav-spy.js src/assets/js/skill-filter.js
git commit -m "feat(design): add editorial visual system, sticky sidebar, skills filter

Implements the Editorial Restraint direction chosen by the site owner:
Fraunces display paired with Inter, a warm paper/ink palette, and one
amber accent split into two tokens - a decorative --accent for rules,
nodes and ticks, and a darker --accent-strong for anything rendering
text or sitting behind white text. The split is not cosmetic: the
approved amber measures 3.57:1 on the page background, which clears
the 3:1 floor for graphical objects and fails the 4.5:1 floor for
text.

On viewports at least 68rem wide and 40rem tall, main becomes a
two-column grid with the identity block as a sticky sidebar and the
content sections scrolling beside it. The height clause is
deliberate - a sticky column taller than the viewport would strand
its own contact links out of reach at 200% zoom. Below either
threshold the layout is the untouched single-column mobile stack.
Page scroll throughout; no nested scroll pane.

Skills chips cross-filter the Experience timeline: clicking a skill
highlights the bullets tagged with it and dims the rest, with the
emphasis carried by the matched bullet's tick rather than by crushing
the misses. Multiple chips union rather than intersect. Chips for
skills with no bullet-level evidence render as inert spans, so no
click can reach a dead end. Nav links scroll smoothly and a scroll-spy
tracks the current section with aria-current, both honouring
prefers-reduced-motion - the spy keeps marking the section, only its
animation stops.

Consists of:
- src/assets/css/style.css: theme tokens, sticky-sidebar grid, timeline,
  cross-filter states, nav indicator, responsive and print rules
- src/assets/js/scroll-reveal.js: IntersectionObserver section fade-in
- src/assets/js/nav-spy.js: aria-current scroll-spy for the header nav
- src/assets/js/skill-filter.js: OR-semantics multi-select cross-filter
  with hover preview, live-region announcements and Escape-to-clear

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
  <rect width="32" height="32" rx="6" fill="#915e22"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">MF</text>
</svg>
```

SVG favicons are broadly supported by browsers, so no rasterization needed here — unlike the OG image below, which specifically needs to work with social-platform crawlers.

Note: `#915e22` is Task 5's `--accent-strong` and `#ffffff` its `--accent-contrast`, hardcoded here because an SVG asset can't read the page's CSS custom properties. **It is deliberately `--accent-strong` and not the decorative `--accent` (`#b5762a`).** Both assets render white text directly on that fill, and white on `#b5762a` measures 3.76:1 — the same ratio Task 5's own CTA note calls a failure, which is why the download button uses `--accent-strong` too. White on `#915e22` measures 5.49:1. The rule that `--accent` is never used behind text has to hold in the generated assets as well as in the stylesheet, or the principle is only half true. These two literals (and the same pair in Step 2's OG image) are the *only* places the accent color is duplicated outside `style.css` — if the accent is ever changed, these are the files that must change with it, or the favicon and social card will silently keep rendering the old brand color.

- [ ] **Step 2: Create the OG share-card source image**

Create `src/assets/og-image.svg` (1200×630, the standard OG image dimension):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#915e22"/>
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
