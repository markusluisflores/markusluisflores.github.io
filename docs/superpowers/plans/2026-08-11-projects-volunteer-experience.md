# Projects & Volunteer Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Projects section (card grid, 3 entries) and a Volunteer Experience section (timeline, 2 entries) to the resume site, reorder the nav to `Experience → Skills → Projects → Education → Volunteer`, and extend the existing Skills click-to-filter interaction to work across all three bulleted sections instead of just Experience.

**Architecture:** Static Eleventy site, data-driven from `src/_data/resume.json`, rendered by Nunjucks templates. No build step beyond `eleventy`; no client-side framework. The filter extension generalizes an existing vanilla-JS interaction (`skill-filter.js`) by introducing a shared `filter-entry` class so both the timeline's `<li>` shape and the new grid's `<article>` card shape can be selected uniformly.

**Tech Stack:** Eleventy 3.x, Nunjucks templates, vanilla JS (no framework, no bundler), hand-written CSS with custom properties.

## Global Constraints

- No TypeScript, no unit test framework — this project is presentational markup driven by data (established in the 2026-08-03 site design). "Tests" here mean: `npm run build` exits 0, `npm run lint` (ESLint + Stylelint) exits 0, `html-validate` passes, and the manual/browser verification steps in each task actually get run, not skipped.
- Every skill tag used in a `resume.json` bullet must exactly string-match an entry in the `skills` array — `isEvidenced` does exact-string matching, not fuzzy matching.
- Follow existing code style: 2-space indent, double quotes in JS, trailing commas per Prettier defaults (already enforced by `lint-staged`).
- Commit after every task using this repo's commit message convention (see recent `git log` — `type: description`, e.g. `feat: add Projects and Volunteer Experience sections`). The commit-msg hook enforces `commitlint.config.mjs`'s `header-max-length` at **72 characters** (including the `type: ` prefix) — count before committing, since this hook rejects the commit outright rather than warning.

---

## File Structure

| File | Change |
|---|---|
| `src/_data/resume.json` | Add `projects` and `volunteer` arrays; add 7 new entries across existing `skills` categories |
| `src/index.njk` | Add `<section id="projects">` and `<section id="volunteer">`; add `filter-entry`/`data-source` to all three bulleted sections' entries; update the Skills chip-rendering call site for the combined `isEvidenced` source |
| `src/_layouts/base.njk` | Reorder nav links; generalize `<noscript>` fallback's hardcoded section-ID list; generalize the filter-bar's "Filtering Experience by" copy |
| `src/assets/css/style.css` | New `.project-grid`/`.project-card` rules; update `main`'s `grid-template-rows` from 3 to 5 tracks; add `flex-wrap` to `.site-nav`'s mobile rule; generalize `.timeline-entry ul`/`ul li` bullet rules to `.filter-entry`; add a `.project-card.is-zero-match h3` rule (cards have no rail-dot to hollow out); extend the reduced-motion and `@media print` section-ID lists |
| `src/assets/js/scroll-reveal.js` | Extend hardcoded section-ID list |
| `src/assets/js/skill-filter.js` | Generalize selectors from `.timeline-entry` to `.filter-entry`; rename `data-company`/`matchedCompanies()` to `data-source`/`matchedSources()`; generalize the "Filtering Experience by" status copy |
| `.eleventy.js` | `isEvidenced`'s backing set now scans `experience` + `projects` + `volunteer` combined, not just `experience` |

**Task order rationale:** data before templates before the cross-cutting filter/evidence changes, so no intermediate task ever leaves the site in a state where a Skills chip looks "evidenced" (clickable) but clicking it silently finds nothing. Task 5 (which makes new-section skills evidenced/clickable) is deliberately last among the code tasks, after Task 4 has already made the filter mechanism work across all three sections.

---

### Task 1: Add Projects, Volunteer, and new Skills data to `resume.json`

**Files:**
- Modify: `src/_data/resume.json`

**Interfaces:**
- Produces: `resume.projects` (array of `{title, subtitle, dates, builtWith, links: [{label, url}], bullets: [{text, skills?}]}`), `resume.volunteer` (array of `{role, org, dates, bullets: [{text, skills?}]}`), and 7 new strings added across `resume.skills[].items`. These are the exact field names Task 2/3/4/5's templates and filters read.

- [ ] **Step 1: Add the `projects` array**

In `src/_data/resume.json`, find the closing of the `skills` array (the line `],` immediately followed by `"education": [`) and insert a new `"projects"` key **before** `"education"`, right after `skills` closes. The relevant region currently reads:

```json
    {
      "category": "Soft Skills",
      "items": [
        "Problem-solving",
        "Detail-oriented",
        "Critical thinking",
        "Adaptability",
        "Communication",
        "Collaboration/Teamwork"
      ]
    }
  ],
  "education": [
```

Change it to:

```json
    {
      "category": "Soft Skills",
      "items": [
        "Problem-solving",
        "Detail-oriented",
        "Critical thinking",
        "Adaptability",
        "Communication",
        "Collaboration/Teamwork"
      ]
    }
  ],
  "projects": [
    {
      "title": "The Fourth Official",
      "subtitle": "Personal Project",
      "dates": "Jul 2026 – Present",
      "builtWith": "Next.js, Supabase Postgres + pgvector, Voyage embeddings, Claude Haiku 4.5, Vitest, Railway",
      "links": [
        {
          "label": "GitHub repo",
          "url": "https://github.com/markusluisflores/the-fourth-official"
        },
        {
          "label": "Live demo (password on request)",
          "url": "https://the-fourth-official-production.up.railway.app/"
        }
      ],
      "bullets": [
        {
          "text": "Built a hybrid retrieval pipeline over the IFAB Laws of the Game, fusing pgvector similarity search and Postgres full-text search with Reciprocal Rank Fusion in a single SQL query.",
          "skills": ["pgvector", "Supabase", "SQL", "RAG"]
        },
        {
          "text": "Generated grounded answers with Claude using native citations, streaming claim-to-passage links alongside a panel showing every retrieved passage, its similarity score, and whether the answer used it.",
          "skills": ["Claude API", "Next.js", "RAG"]
        },
        {
          "text": "Tuned retrieval against measured evals (recall@8, MRR) and calibrated a relevance gate that abstains on off-topic questions before any generation spend.",
          "skills": ["RAG", "Vitest"]
        },
        {
          "text": "Built solo using Claude Code as the primary development tool, running a structured spec, plan, implementation, and review workflow backed by design docs and ADRs.",
          "skills": ["Claude Code"]
        }
      ]
    },
    {
      "title": "Orbit Inventory Management System",
      "subtitle": "Team Capstone Project",
      "dates": "Sep 2024 – May 2025",
      "builtWith": "Next.js, React.js, TypeScript, Mantine, Firebase",
      "links": [{ "label": "GitHub repo", "url": "https://github.com/ragustinesantos/orbit-ims" }],
      "bullets": [
        {
          "text": "Designed and developed core application features and workflows based on team requirements, from UI components to business logic.",
          "skills": ["Next.js", "React.js", "TypeScript", "Mantine", "HTML", "CSS", "JavaScript"]
        },
        {
          "text": "Set up Playwright test automation from scratch and wrote the initial test suite covering core CRUD flows.",
          "skills": ["Playwright"]
        },
        {
          "text": "Contributed to CI/CD and code-quality tooling.",
          "skills": ["GitHub Actions"]
        }
      ]
    },
    {
      "title": "Infor Carpool Project",
      "subtitle": "Volunteer",
      "dates": "Feb 2019 – May 2022",
      "builtWith": "Laravel, MySQL",
      "links": [],
      "bullets": [
        {
          "text": "Built a mobile carpool booking application with Infor's Community of Business Analysts, as part of a 5-person team.",
          "skills": ["Laravel", "PHP", "SQL"]
        },
        {
          "text": "Won Infor's Innovation Flight Central Shark Tank competition and Habi Team of the Year at Infor's Sinagtala Awards."
        }
      ]
    }
  ],
  "education": [
```

- [ ] **Step 2: Add the `volunteer` array after `education`**

Find the end of the `education` array (the closing `]` immediately followed by the final `}` that closes the whole file) and insert `"volunteer"` between them. The current end of the file reads:

```json
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

Change it to:

```json
    {
      "degree": "Bachelor of Science in Information Technology",
      "school": "De La Salle University",
      "location": "Manila, Philippines",
      "dates": "May 2014 – Aug 2018",
      "note": "5x Dean's Lister"
    }
  ],
  "volunteer": [
    {
      "role": "Quality Assurance Tester",
      "org": "Empowered Futures",
      "dates": "June 2024",
      "bullets": [
        { "text": "Performed end-to-end testing for the Empowered Futures Connect platform." },
        {
          "text": "Documented scenarios, steps to replicate, and test evidence on issues and concerns found during software testing."
        },
        {
          "text": "Provided feedback on the usability of the application for different roles and perspectives.",
          "skills": ["Communication"]
        }
      ]
    },
    {
      "role": "Treasurer",
      "org": "SAIT Beekeeping Club",
      "dates": "June 2024 – April 2025",
      "bullets": [
        {
          "text": "Participated in hive inspections, honey jarring, and other club activities as an active member."
        },
        {
          "text": "Served as treasurer, auditing all financial transactions and managing the club's finances."
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Add the 7 new skill entries to existing categories**

Still in `src/_data/resume.json`, within the `skills` array added earlier in the site's history:

Find the `"Backend"` category:
```json
    {
      "category": "Backend",
      "items": [
        "Java",
        "PHP",
        "Node.js",
        "SQL",
        "NoSQL",
        "Docker",
        "Landmark Pattern Language (LPL)"
      ]
    },
```
Change to (adds `Laravel` next to `PHP`, `pgvector` and `Supabase` next to `SQL`):
```json
    {
      "category": "Backend",
      "items": [
        "Java",
        "PHP",
        "Laravel",
        "Node.js",
        "SQL",
        "NoSQL",
        "pgvector",
        "Supabase",
        "Docker",
        "Landmark Pattern Language (LPL)"
      ]
    },
```

Find the `"Testing"` category:
```json
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
```
Change to (adds `Vitest`):
```json
    {
      "category": "Testing",
      "items": [
        "Playwright",
        "Vitest",
        "Selenium",
        "Postman",
        "qTest",
        "Business Logic Testing (BLT)",
        "ConformIQ",
        "Hexawise"
      ]
    },
```

Find the `"DevOps"` category:
```json
    {
      "category": "DevOps",
      "items": ["Red Hat OpenShift", "GitHub Actions", "UrbanCode Deploy"]
    },
```
Change to (adds `Railway`):
```json
    {
      "category": "DevOps",
      "items": ["Red Hat OpenShift", "GitHub Actions", "UrbanCode Deploy", "Railway"]
    },
```

Find the `"AI Tools"` category:
```json
    { "category": "AI Tools", "items": ["Claude Code", "Copilot", "Cursor", "n8n"] },
```
Change to (adds `RAG` and `Claude API`):
```json
    {
      "category": "AI Tools",
      "items": ["Claude Code", "Claude API", "RAG", "Copilot", "Cursor", "n8n"]
    },
```

- [ ] **Step 4: Verify the JSON is valid and Eleventy picks it up**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/_data/resume.json', 'utf8')); console.log('valid JSON')"
npm run build
```
Expected: both exit 0, printing `valid JSON` and then a successful Eleventy build. The site's visible output doesn't change yet — no template reads `resume.projects` or `resume.volunteer` until Task 2/3, and the new skill strings just sit as additional un-rendered `items` entries. This step only confirms the data file itself is well-formed.

- [ ] **Step 5: Commit**

```bash
git add src/_data/resume.json
git commit -m "feat: add Projects, Volunteer Experience, and new skills data"
```

---

### Task 2: Add the Projects section (card grid) with its own CSS

**Files:**
- Modify: `src/index.njk`
- Modify: `src/assets/css/style.css`

**Interfaces:**
- Consumes: `resume.projects` (Task 1)
- Produces: `<section id="projects">` in the rendered page; `.project-grid`/`.project-card`/`.project-meta`/`.project-tech`/`.project-link` CSS classes that Task 4 will later extend for filtering.

- [ ] **Step 1: Add the Projects section markup**

In `src/index.njk`, find the end of the `#skills` section and the start of `#education`:

```njk
</section>

<section id="education">
```

Change to:

```njk
</section>

<section id="projects">
  <h2>Projects</h2>
  <div class="project-grid">
    {% for project in resume.projects %}
    <article class="project-card" data-source="{{ project.title }}">
      <h3>{{ project.title }}</h3>
      <p class="project-meta">{{ project.subtitle }} · {{ project.dates }}</p>
      {% if project.builtWith %}<p class="project-tech">Built with {{ project.builtWith }}</p>{% endif %}
      <ul role="list">
        {% for bullet in project.bullets %}
        <li{% if bullet.skills %} data-skills="{{ bullet.skills | join('|') }}"{% endif %}>{{ bullet.text }}</li>
        {% endfor %}
      </ul>
      {% for link in project.links %}
      <a class="project-link" href="{{ link.url }}" target="_blank" rel="noopener noreferrer">{{ link.label }} →</a>
      {% endfor %}
    </article>
    {% endfor %}
  </div>
</section>

<section id="education">
```

Note: the `filter-entry` class is deliberately **not** added yet — Task 4 adds it everywhere at once, alongside the JS/CSS that actually reads it, so this task doesn't ship a half-wired attribute. `data-source`, by contrast, **is** included above, in this task — it's harmless dead markup until Task 4 (no CSS or JS reads it yet), and adding it now avoids touching this exact template line twice.

- [ ] **Step 2: Add CSS for the project card grid**

In `src/assets/css/style.css`, find the end of the `.timeline-entry.is-zero-match::before` rule (just before the `.skill-group` block):

```css
.timeline-entry.is-zero-match::before {
  background: var(--bg);
  box-shadow:
    0 0 0 4px var(--bg),
    inset 0 0 0 1.5px var(--border-strong);
}

.skill-group {
```

Insert the new rules between them:

```css
.timeline-entry.is-zero-match::before {
  background: var(--bg);
  box-shadow:
    0 0 0 4px var(--bg),
    inset 0 0 0 1.5px var(--border-strong);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  align-items: start;
  gap: 1.25rem;
}

.project-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.project-card h3 {
  margin: 0 0 0.3rem;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  transition: opacity 0.18s ease;
}

.project-meta {
  margin: 0 0 0.75rem;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.project-tech {
  margin: 0 0 1rem;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-style: italic;
}

.project-card ul {
  display: grid;
  gap: 0.65rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}

.project-link {
  margin-top: 0.5rem;
  color: var(--accent-strong);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.project-link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.project-link + .project-link {
  margin-top: 0.35rem;
}

.skill-group {
```

`align-items: start` on `.project-grid` matters more than it looks: CSS Grid items stretch to the tallest row's height by default, and this grid's cards have very different content lengths (The Fourth Official's 4 bullets vs. Infor Carpool's 2). Without `align-items: start`, every card in a row stretches to match its tallest sibling — combined with the original `margin-top: auto` on `.project-link` (since removed), that stretch would leave the shorter cards' links pushed hundreds of pixels down into a large empty gap at the bottom of the card, rather than sitting close to the bullets above them. `align-items: start` makes each card size to its own content instead, so `.project-link` can just use a normal `margin-top` and follow directly after the bullets. The Infor Carpool card (zero links) simply renders no `.project-link` at all — the `{% for link in project.links %}` loop over an empty array produces nothing, no conditional needed.

Project-card bullets deliberately have **no bullet marker or `is-match`/`is-dim` styling yet** — that's the shared `.filter-entry ul li` treatment Task 4 introduces. Right now they're plain `<li>` text in a `<ul role="list">`.

- [ ] **Step 3: Build and verify the section renders**

Run:
```bash
npm run build
grep -c 'id="projects"' _site/index.html
grep -c 'class="project-card"' _site/index.html
```
Expected: build exits 0; first grep returns `1`; second grep returns `3` (one per project).

- [ ] **Step 4: Visual check in the browser**

Run:
```bash
npm run serve
```
Open `http://localhost:8080/` and scroll to the Projects section (it's between Skills and Education, before the nav is updated in Task 3 — reach it by scrolling, not by nav click yet). Confirm:
- Three cards render in a responsive grid (resize the window narrower than ~500px and confirm they stack to one column).
- Each card shows title, subtitle · dates, the "Built with" line, bullets, and (for The Fourth Official and Orbit IMS only) link(s) at the bottom.
- The Infor Carpool card has no link row and doesn't leave obvious empty space where one would be.
- Clicking "GitHub repo →" or "Live demo (password on request) →" opens the correct URL in a new tab.

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 5: Commit**

```bash
git add src/index.njk src/assets/css/style.css
git commit -m "feat: add Projects section with card grid layout"
```

---

### Task 3: Add the Volunteer Experience section, reorder nav, and wire up scroll-reveal for both new sections

**Files:**
- Modify: `src/index.njk`
- Modify: `src/_layouts/base.njk`
- Modify: `src/assets/js/scroll-reveal.js`
- Modify: `src/assets/css/style.css`

**Interfaces:**
- Consumes: `resume.volunteer` (Task 1)
- Produces: `<section id="volunteer">` in the rendered page; nav links for both new sections; both sections participate in the existing scroll-fade-in behavior and are visible without JS/with `prefers-reduced-motion`/when printed.

- [ ] **Step 1: Add the Volunteer Experience section markup**

In `src/index.njk`, find the end of the `#education` section (the very end of the file):

```njk
<section id="education">
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

Append a new section immediately after it (end of file):

```njk
<section id="education">
  <h2>Education</h2>
  {% for edu in resume.education %}
  <div class="education-entry">
    <h3>{{ edu.degree }}</h3>
    <p>{{ edu.school }} · {{ edu.location }} · {{ edu.dates }}</p>
    {% if edu.note %}<p class="education-note">{{ edu.note }}</p>{% endif %}
  </div>
  {% endfor %}
</section>

<section id="volunteer">
  <h2>Volunteer Experience</h2>
  <ol class="timeline" role="list">
    {% for entry in resume.volunteer %}
    <li class="timeline-entry" data-source="{{ entry.org }}">
      <h3>{{ entry.role }}</h3>
      <p class="timeline-meta">{{ entry.org }} · {{ entry.dates }}</p>
      <ul role="list">
        {% for bullet in entry.bullets %}
        <li{% if bullet.skills %} data-skills="{{ bullet.skills | join('|') }}"{% endif %}>{{ bullet.text }}</li>
        {% endfor %}
      </ul>
    </li>
    {% endfor %}
  </ol>
</section>
```

(Same note as Task 2 Step 1: `filter-entry` and the Experience section's own `data-company` → `data-source` rename land together in Task 4.)

- [ ] **Step 2: Reorder the nav**

In `src/_layouts/base.njk`, find:

```njk
    <nav class="site-nav">
      <a href="#experience">Experience</a>
      <a href="#skills">Skills</a>
      <a href="#education">Education</a>
    </nav>
```

Change to:

```njk
    <nav class="site-nav">
      <a href="#experience">Experience</a>
      <a href="#skills">Skills</a>
      <a href="#projects">Projects</a>
      <a href="#education">Education</a>
      <a href="#volunteer">Volunteer</a>
    </nav>
```

`nav-spy.js` needs no changes — it derives its targets from `.site-nav a[href^='#']` at runtime, so both new links are picked up automatically.

- [ ] **Step 2a: Update the sidebar grid's row count**

`src/assets/css/style.css`'s desktop sidebar layout (`@media (min-width: 68rem) and (min-height: 40rem) { main { ... grid-template-rows: repeat(3, auto); ... } }`) hardcodes the number of top-level sections in `<main>` as an explicit grid track count, and `.hero`'s `grid-row: 1 / -1` spans that explicit grid to keep the sidebar pinned alongside all of them. This repo's original implementation plan (`docs/superpowers/plans/2026-08-04-portfolio-site-implementation.md`) documents this as a must-update invariant: *"If a Projects section is ever added, this count must go to 4, or the sidebar will silently stop sticking partway down the new section."* This PR adds two sections (Projects and Volunteer), taking the total from 3 to 5.

In `src/assets/css/style.css`, find:

```css
  main {
    display: grid;
    grid-template-columns: var(--sidebar) minmax(0, var(--measure));
    grid-template-rows: repeat(3, auto);
```

Change to:

```css
  main {
    display: grid;
    grid-template-columns: var(--sidebar) minmax(0, var(--measure));
    grid-template-rows: repeat(5, auto);
```

- [ ] **Step 2b: Fix nav overflow on narrow viewports**

Growing the nav from 3 links to 5 makes it too wide to fit on a phone screen, and `.site-nav` has no `flex-wrap` anywhere in the stylesheet — only its parent `.site-header` wraps (`@media (max-width: 640px) { .site-header { flex-wrap: wrap; ... } }`), which doesn't help the nav's own 5 links wrap onto a second line. Left unfixed, this produces a horizontal scrollbar on the whole page at common phone widths (measured ~94-108px of overflow at 375-390px), with the "Volunteer" link rendered fully off-screen — a real, user-facing defect, not a theoretical one.

In `src/assets/css/style.css`, find the existing mobile breakpoint's `.site-nav` rule:

```css
  .site-nav {
    gap: 1.1rem;
  }
```

Change to:

```css
  .site-nav {
    flex-wrap: wrap;
    gap: 0.5rem 1.1rem;
  }
```

Note the two-value `gap` shorthand (`row-gap column-gap`) rather than a separate `row-gap` declaration alongside `gap: 1.1rem` — declaring `row-gap` first and then `gap` as a single value resets `row-gap` back to `normal`, since `gap: <value>` is shorthand for *both* axes at once and always overrides whatever came before it in the same rule. Caught by running `stylelint` (`declaration-block-no-shorthand-property-overrides`) against this exact edit; the two-value form sets both axes explicitly in one declaration and has nothing after it to override.

- [ ] **Step 3: Extend the `<noscript>` fallback in `base.njk`**

Still in `src/_layouts/base.njk`, find:

```njk
    <style>
      #experience, #skills, #education { opacity: 1 !important; transform: none !important; }
      button.chip { cursor: default; }
      button.chip:hover { border-color: var(--border); color: var(--text-muted); }
    </style>
```

Change to:

```njk
    <style>
      #experience, #skills, #projects, #education, #volunteer { opacity: 1 !important; transform: none !important; }
      button.chip { cursor: default; }
      button.chip:hover { border-color: var(--border); color: var(--text-muted); }
    </style>
```

Without this, a no-JS visitor would see `#projects` and `#volunteer` permanently stuck at `opacity: 0` — `scroll-reveal.js` never runs to add `.is-visible`, and this `<noscript>` block is the only thing that overrides the CSS's default hidden state for that visitor.

- [ ] **Step 4: Extend `scroll-reveal.js`'s section list**

In `src/assets/js/scroll-reveal.js`, find:

```js
  var sections = document.querySelectorAll("#experience, #skills, #education");
```

Change to:

```js
  var sections = document.querySelectorAll(
    "#experience, #skills, #projects, #education, #volunteer"
  );
```

- [ ] **Step 5: Extend the two CSS section-ID lists**

In `src/assets/css/style.css`, find the reduced-motion block:

```css
@media (prefers-reduced-motion: no-preference) {
  #experience,
  #skills,
  #education {
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity 0.4s ease-in,
      transform 0.4s ease-in;
  }

  #experience.is-visible,
  #skills.is-visible,
  #education.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Change to:

```css
@media (prefers-reduced-motion: no-preference) {
  #experience,
  #skills,
  #projects,
  #education,
  #volunteer {
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity 0.4s ease-in,
      transform 0.4s ease-in;
  }

  #experience.is-visible,
  #skills.is-visible,
  #projects.is-visible,
  #education.is-visible,
  #volunteer.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Then find the `@media print` block:

```css
  #experience,
  #skills,
  #education {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
```

Change to:

```css
  #experience,
  #skills,
  #projects,
  #education,
  #volunteer {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
```

A printed resume should never show the fade-in's pre-animation state or a filtered/dimmed view — this block already existed to guarantee that for the first three sections; it silently wouldn't have covered the two new ones without this change.

- [ ] **Step 6: Build and verify**

Run:
```bash
npm run build
grep -c 'id="volunteer"' _site/index.html
grep -c 'href="#projects"' _site/index.html
grep -c 'href="#volunteer"' _site/index.html
```
Expected: build exits 0; all three greps return `1`.

- [ ] **Step 7: Manual browser verification**

Run `npm run serve`, open `http://localhost:8080/`.
- Click each of the 5 nav links (Experience, Skills, Projects, Education, Volunteer) and confirm each scrolls to the correct section.
- Scroll slowly from top to bottom and confirm every section (including Projects and Volunteer) fades in (translateY + opacity transition) as it enters the viewport — not just the original three.
- Scroll back up and confirm the nav link for the currently-centered section gets `aria-current="location"` (inspect via DevTools, or just watch for the visual "current" nav styling) for all 5 sections, not just the original 3.
- In DevTools, enable "Emulate CSS media feature prefers-reduced-motion: reduce" and reload — confirm all 5 sections are immediately visible with no fade-in animation.
- Print-preview the page (Ctrl+P) and confirm Projects and Volunteer both appear fully visible in the preview, not blank/faded.
- Using DevTools device emulation, check the page at 320px, 375px, 390px, and 412px wide. At each width, confirm: no horizontal scrollbar on the page; all 5 nav links are visible (wrapped onto a second line is fine, cut off or scrolled-away is not); "Volunteer" specifically is not pushed off-screen. This is the check for Step 2b's fix — verify it actually holds at all four widths, not just one.
- **Known, accepted tradeoff — verify it stays within bounds, don't try to eliminate it.** Wrapping 5 nav links onto 2 lines makes the sticky header taller at narrow widths (measured going from ~56-78px to ~107px at 320-412px, since `.site-header` itself also wraps, pushing the theme-toggle button below the now-2-line nav). This is a real, visible side effect of fitting 5 links where 3 used to fit — accepted as reasonable rather than fixed with further layout changes, since a deeper mobile-header redesign (e.g. hiding the header's theme-toggle on narrow widths, since the footer already has one) is out of scope for this feature and risks introducing yet another subtle bug in an area this plan has already touched multiple times. Confirm only that it stays bounded: the header still doesn't overlap page content below it, and with an active filter (`.filter-bar` visible, `max-height: 40vh`) there's still visible content below the combined chrome at 320×568 (iPhone SE), the shortest common mobile viewport — if the combined header+filter-bar chrome ever pushes real content fully off-screen, that's a real bug worth fixing; a taller-but-still-bounded header is not.

Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add src/index.njk src/_layouts/base.njk src/assets/js/scroll-reveal.js src/assets/css/style.css
git commit -m "feat: add Volunteer section, reorder nav, extend scroll-reveal"
```

---

### Task 4: Extend the click-to-filter interaction to Projects and Volunteer

**Files:**
- Modify: `src/index.njk`
- Modify: `src/_layouts/base.njk`
- Modify: `src/assets/css/style.css`
- Modify: `src/assets/js/skill-filter.js`

**Interfaces:**
- Consumes: `.project-card` (Task 2), `.timeline-entry` for Experience and Volunteer (existing + Task 3)
- Produces: a `.filter-entry` class and `data-source` attribute present on every filterable entry (Experience, Projects, Volunteer); `skill-filter.js` operates on all three; filter-bar copy no longer assumes Experience is the only filtered section. Task 5 depends on this being complete — it's what makes evidencing Projects/Volunteer skills safe to do.

- [ ] **Step 1: Add `filter-entry` class and rename `data-company` to `data-source` in `index.njk`**

In `src/index.njk`, find the Experience section's entry:

```njk
    <li class="timeline-entry" data-company="{{ job.company }}">
```

Change to:

```njk
    <li class="timeline-entry filter-entry" data-source="{{ job.company }}">
```

Find the Volunteer section's entry (added in Task 3):

```njk
    <li class="timeline-entry" data-source="{{ entry.org }}">
```

Change to:

```njk
    <li class="timeline-entry filter-entry" data-source="{{ entry.org }}">
```

Find the Projects section's card (added in Task 2):

```njk
    <article class="project-card" data-source="{{ project.title }}">
```

Change to:

```njk
    <article class="project-card filter-entry" data-source="{{ project.title }}">
```

- [ ] **Step 2: Generalize the filter-bar copy in `base.njk`**

In `src/_layouts/base.njk`, find:

```njk
  <section class="filter-bar" data-filter-bar hidden aria-label="Active filters">
    <p class="filter-summary">Filtering Experience by <span class="filter-skills" data-filter-skills></span></p>
```

Change to:

```njk
  <section class="filter-bar" data-filter-bar hidden aria-label="Active filters">
    <p class="filter-summary">Filtering by <span class="filter-skills" data-filter-skills></span></p>
```

- [ ] **Step 3: Generalize the bullet/tick-mark/filter-state CSS**

In `src/assets/css/style.css`, find the block from `.timeline-entry ul` through `.timeline-entry ul li.is-dim` (five rules — the container, the base `li`, its `::before` tick mark, the `.is-match::before` variant, and `.is-dim`):

```css
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
  transition:
    background-color 0.18s ease,
    width 0.18s ease,
    height 0.18s ease;
}

.timeline-entry ul li.is-match::before {
  width: 0.95rem;
  height: 2px;
  background: var(--accent);
}

.timeline-entry ul li.is-dim {
  opacity: 0.62;
}
```

Change every selector in this block from `.timeline-entry ul` to `.filter-entry ul` (5 selectors: the container, the base `li`, its `::before`, `.is-match::before`, `.is-dim`):

```css
.filter-entry ul {
  display: grid;
  gap: 0.65rem;
  max-width: 58ch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.filter-entry ul li {
  position: relative;
  padding-left: 1.5rem;
  line-height: 1.6;
  transition: opacity 0.18s ease;
}

.filter-entry ul li::before {
  content: "";
  position: absolute;
  top: 0.75em;
  left: 0;
  width: 0.6rem;
  height: 1px;
  background: var(--border-strong);
  transition:
    background-color 0.18s ease,
    width 0.18s ease,
    height 0.18s ease;
}

.filter-entry ul li.is-match::before {
  width: 0.95rem;
  height: 2px;
  background: var(--accent);
}

.filter-entry ul li.is-dim {
  opacity: 0.62;
}
```

Every `.timeline-entry` already carries `filter-entry` too (Step 1), so this is a pure rename with no visual change for Experience/Volunteer — it just also makes `.project-card ul li` pick up the same tick-mark/match/dim treatment for free, since `.project-card` also carries `filter-entry` now. Remove the `.project-card ul` override rule added in Task 2 Step 2 (`margin: 0 0 1rem; padding: 0; list-style: none;` without the tick marks) — it's now superseded by this shared rule. Find in `.project-card`'s CSS block:

```css
.project-card ul {
  display: grid;
  gap: 0.65rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}
```

Change to:

```css
.project-card ul {
  margin: 0 0 1rem;
}
```

(keeps only the bottom margin `.filter-entry ul` doesn't set — `.filter-entry ul` already provides `display: grid`, `gap`, `list-style: none`, and zero top/side margin/padding).

Leave `.timeline-entry::before` (the rail-dot pseudo-element, lines ~381-394) and `.timeline-entry.is-zero-match::before` (lines ~451-456) **unchanged** — both stay scoped to `.timeline-entry` specifically. That rail dot is positioned relative to the timeline's left border line (`left: -4.5px`), a structural feature `.project-card` doesn't have, so there's nothing to generalize there.

- [ ] **Step 4: Add a zero-match treatment for project cards**

Cards have no rail dot to hollow out, so they need their own "no bullets matched" visual. **Do not** dim the whole `.project-card` via a single `opacity` rule — its bullets already get `opacity: 0.62` individually from the `.filter-entry ul li.is-dim` rule (Step 3), and CSS opacity compounds down the tree, so an additional card-level `opacity: 0.62` would render those bullets at an effective ~0.62 × 0.62 ≈ 0.38, visibly more washed-out than a zero-match Experience/Volunteer entry's bullets (which stay at a clean 0.62, since timeline entries have no equivalent parent-level opacity rule).

**Also do not dim `.project-meta`, `.project-tech`, or `.project-link` — only `h3`.** All three already use `color: var(--text-muted)` (Task 2 Step 2), which measures roughly 5.7:1 against the card background on its own — comfortably above WCAG AA's 4.5:1 floor for normal text, but with almost no headroom left. Multiplying that by a further `opacity: 0.62` drops all three to ~2.6:1 in light mode (and `.project-link` to ~4.0:1 even in dark mode) — a real accessibility regression that passes every automated gate in this repo (`stylelint` has no contrast rule, and Lighthouse's default a11y run only audits the page's unfiltered resting state, never the filtered/dimmed state a visitor produces by actually using the feature). `h3` uses the much higher-contrast `var(--text)` and stays comfortably above 4.5:1 even at 0.62 opacity (measured ~4.9:1 light, ~6.1:1 dark), so it's the only one of the four safe to dim. Dimming just the title, combined with the bullets already dimming individually, still reads clearly as "this card didn't match" — the meta/tech/link lines staying at full brightness is a feature, not a gap: a visitor should still be able to read the tech stack and follow the repo link on a card that happens not to match their current filter.

**Placement matters here, not just content.** In `src/assets/css/style.css`, find:

```css
button.chip:focus-visible {
  outline-color: var(--text);
}

@media (prefers-reduced-motion: no-preference) {
```

Change to:

```css
button.chip:focus-visible {
  outline-color: var(--text);
}

.project-card.is-zero-match h3 {
  opacity: 0.62;
}

@media (prefers-reduced-motion: no-preference) {
```

Do **not** insert this rule immediately after `.timeline-entry.is-zero-match::before` (i.e., up near line 451, alongside the rest of the `.project-card` block from Task 2) even though that placement would read more naturally next to the other zero-match rule — it breaks `npm run lint`. `stylelint-config-standard`'s `no-descending-specificity` rule (active in this repo's `.stylelintrc.json`) flags a two-class-plus-tag selector like `.project-card.is-zero-match h3` appearing *before* lower-specificity selectors targeting overlapping elements later in the same file — and at that position it sits above `.project-card h3` (added later in this same task) as well as the unrelated `.skill-group h3` and `.education-entry h3` further down. Confirmed by actually running `stylelint` against both placements: the near-line-451 placement produces errors; placing it here — after all base component styles, immediately before the file's first responsive/reduced-motion `@media` block — produces zero.

(`0.62` matches the existing `.filter-entry ul li.is-dim` opacity value, for visual consistency between "this bullet didn't match" and "this card's title is de-emphasized." This rule deliberately carries **no** `transition` of its own — the transition lives on the base `.project-card h3` rule from Task 2 Step 2 instead, exactly mirroring how `.filter-entry ul li`'s base rule carries the transition while `.filter-entry ul li.is-dim` itself carries only `opacity`. Putting the transition on the `.is-zero-match` variant instead — an earlier version of this step did — makes it one-directional: it'd animate the fade *in* when the class is added, but the class removal on filter-clear snaps straight back to full opacity with no transition at all, since the removed rule's `transition` disappears along with it. Declaring the transition on the always-present base rule makes both directions animate.)

Then find the `@media print` block — its exact line number shifts as earlier tasks in this plan add lines above it, so search for the block by its `@media print {` opening rather than a line number. It already references `.timeline-entry ul li.is-dim` and `.timeline-entry.is-zero-match::before`, both of which must stay force-reset to full visibility when printing (a printed resume shouldn't show whatever filter state happened to be active on screen). This is the **only** block in the stylesheet that needs updating here — there is no separate `@media (prefers-reduced-motion: reduce)` block in this codebase; the site only has `@media (prefers-reduced-motion: no-preference)` blocks, which opt *into* the fade-in animation rather than opting out of it, and neither of those references `is-dim`/`is-zero-match` at all (verify this against the real file before editing — don't search for a block that doesn't exist).

In the `@media print` block, find:
```css
  .timeline-entry ul li.is-dim {
    opacity: 1 !important;
    transition: none !important;
  }

  .timeline-entry.is-zero-match::before {
    background: var(--accent) !important;
    box-shadow: none !important;
  }
```
Change to:
```css
  .filter-entry ul li.is-dim {
    opacity: 1 !important;
    transition: none !important;
  }

  .timeline-entry.is-zero-match::before {
    background: var(--accent) !important;
    box-shadow: none !important;
  }

  .project-card.is-zero-match h3 {
    opacity: 1 !important;
    transition: none !important;
  }
```
(Rename `.timeline-entry ul li.is-dim` to `.filter-entry ul li.is-dim`, matching Step 3's rename; leave `.timeline-entry.is-zero-match::before` as-is, since it's still timeline-specific; add the new card-title override, with the same `opacity: 1 !important; transition: none !important;` pattern as the renamed `.filter-entry ul li.is-dim` rule above it, so printing forces it back to full opacity too. `.project-meta`/`.project-tech`/`.project-link` never dim in the first place — see Step 4's accessibility note — so there's nothing to reset for them here.)

- [ ] **Step 5: Generalize `skill-filter.js`**

In `src/assets/js/skill-filter.js`, find:

```js
  var bullets = Array.prototype.slice.call(document.querySelectorAll(".timeline-entry ul li"));
  var entries = Array.prototype.slice.call(document.querySelectorAll(".timeline-entry"));
```

Change to:

```js
  var bullets = Array.prototype.slice.call(document.querySelectorAll(".filter-entry ul li"));
  var entries = Array.prototype.slice.call(document.querySelectorAll(".filter-entry"));
```

Find `matchedCompanies()`:

```js
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
```

Change to:

```js
  function matchedSources() {
    var names = [];
    entries.forEach(function (entry) {
      if (!entry.querySelector("li.is-match")) {
        return;
      }
      var name = entry.getAttribute("data-source");
      if (name && names.indexOf(name) === -1) {
        names.push(name);
      }
    });
    return names;
  }
```

Find its one call site:

```js
  function summarise(matched) {
    var where = joinNames(matchedCompanies());
```

Change to:

```js
  function summarise(matched) {
    var where = joinNames(matchedSources());
```

Find the status-announcement string:

```js
    if (status) {
      var tail = /\.$/.test(summary) ? "" : ".";
      status.textContent = "Filtering Experience by " + names + ". " + summary + tail;
    }
```

Change to:

```js
    if (status) {
      var tail = /\.$/.test(summary) ? "" : ".";
      status.textContent = "Filtering by " + names + ". " + summary + tail;
    }
```

Find `revealFirstMatch()`'s query:

```js
  function revealFirstMatch() {
    var li = document.querySelector(".timeline-entry li.is-match");
```

Change to:

```js
  function revealFirstMatch() {
    var li = document.querySelector(".filter-entry li.is-match");
```

Note: `.project-card`'s bullets are inside a `<ul role="list">` just like `.timeline-entry`'s, so `.filter-entry li.is-match` finds a matching `<li>` in either shape identically — no card-specific branch needed.

- [ ] **Step 6: Build and verify**

Run:
```bash
npm run build
npm run lint
```
Expected: both exit 0.

- [ ] **Step 7: Manual browser verification of filtering across all three sections**

This is the highest-risk step in this task — `skill-filter.js` has a history of subtle bugs (see the plan's Global Constraints note on regression risk). Run `npm run serve`, open `http://localhost:8080/`.

Since no Projects/Volunteer skill chips are clickable yet (Task 5 hasn't run), filtering can currently only be *triggered* from an Experience-evidenced chip like Playwright — but its *effects* should now be visible across Projects too, because Playwright is tagged on an Orbit IMS bullet (Task 1 data) even though the Skills chip itself isn't evidenced yet:

- Click the "Playwright" chip (evidenced via the existing RBC Experience bullet). Confirm:
  - The RBC Experience bullet mentioning Playwright ticks amber and stays full-opacity; other RBC/Infor bullets dim.
  - The Orbit IMS project card's Playwright bullet **also** ticks amber and stays full-opacity, and the card itself does not get `.is-zero-match` styling (it has a match).
  - The Infor Carpool card and The Fourth Official card (neither has a Playwright-tagged bullet) both get `.is-zero-match` — their title dims to ~62% opacity, matching the ~62% their (already individually-dimmed) bullets show; the meta line, tech line, and link stay at full brightness (deliberately — see Task 4 Step 4's accessibility note on why those three don't dim).
  - The filter bar reads "Filtering by Playwright" (not "Filtering Experience by Playwright") and its match count/source list includes both "Royal Bank of Canada (RBC)" and "Orbit Inventory Management System".
  - Press Escape: filter clears, all dimming and card-opacity effects are removed, filter bar hides.
- Click the "GitHub Actions" chip (evidenced via both an RBC Experience bullet and the Orbit IMS bullet from Task 1). Confirm matches appear in both Experience and Projects, and the source list names both.
- Click the "Agile Scrum Methodology" chip (evidenced only via Experience bullets — RBC and Infor both use it, no Projects or Volunteer bullet does). This is the plan's Experience-only match case — one of the spec's four required coverage cases (Experience only, Projects only, Volunteer only, and mixed); the other three are exercised here and in Task 5 Step 4, once Projects/Volunteer-only skills become clickable. Confirm: the matching RBC and Infor Experience bullets tick amber; every Project card gets `.is-zero-match` (title dims to ~62%, meta/tech/link stay full-brightness); the Volunteer entries' bullets all dim and the Treasurer/QA Tester entries show the hollow rail-dot (no card-opacity rule applies to them, since they're `.timeline-entry` not `.project-card`); the source list names only the two Experience employers, no project or volunteer org.
- Resize to a narrow viewport and repeat the Playwright check — confirm the dimmed Infor Carpool/Fourth Official cards don't overlap or clip oddly in the single-column grid layout.

Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add src/index.njk src/_layouts/base.njk src/assets/css/style.css src/assets/js/skill-filter.js
git commit -m "feat: extend click-to-filter interaction to Projects and Volunteer"
```

---

### Task 5: Extend `isEvidenced` to cover Projects and Volunteer

**Files:**
- Modify: `.eleventy.js`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: `resume.experience`, `resume.projects`, `resume.volunteer` (all from Task 1); the `filter-entry`/`data-source` wiring from Task 4, which is what makes it safe for these newly-evidenced chips to actually be clickable.
- Produces: Skills chips for `Laravel`, `pgvector`, `Supabase`, `RAG`, `Claude API`, `Vitest`, and `Claude Code` render as interactive/evidenced buttons instead of inert spans.

- [ ] **Step 1: Update `evidencedSkillSet` to accept multiple bullet-source arrays**

In `.eleventy.js`, find:

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
```

Change to:

```js
const evidencedCache = new WeakMap();

function evidencedSkillSet(sources) {
  if (!Array.isArray(sources)) {
    return new Set();
  }
  if (evidencedCache.has(sources)) {
    return evidencedCache.get(sources);
  }
  const set = new Set();
  sources.forEach(function (entry) {
    (entry.bullets || []).forEach(function (bullet) {
      (bullet.skills || []).forEach(function (skill) {
        set.add(skill);
      });
    });
  });
  evidencedCache.set(sources, set);
  return set;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.setNunjucksEnvironmentOptions({
    trimBlocks: true,
    lstripBlocks: true,
  });

  eleventyConfig.addFilter("isEvidenced", function (skill, sources) {
    return evidencedSkillSet(sources).has(skill);
  });
```

The function body is unchanged (it already only cared about `.bullets`, never about job-specific fields like `company`), so `projects` entries (`title`/`bullets`) and `volunteer` entries (`role`/`bullets`) work through it identically to `experience` entries — only the parameter name changes, to stop implying it's Experience-specific.

- [ ] **Step 2: Update the call site in `index.njk`**

In `src/index.njk`, find the Skills section:

```njk
<section id="skills">
  <h2>Skills</h2>
  {% for group in resume.skills %}
  <div class="skill-group">
    <h3>{{ group.category }}</h3>
    <ul class="skill-chips" role="list">
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
```

Change to:

```njk
<section id="skills">
  <h2>Skills</h2>
  {% set evidenceSources = resume.experience.concat(resume.projects, resume.volunteer) %}
  {% for group in resume.skills %}
  <div class="skill-group">
    <h3>{{ group.category }}</h3>
    <ul class="skill-chips" role="list">
      {% for item in group.items %}
      {% if item | isEvidenced(evidenceSources) %}
      <li><button type="button" class="chip" data-skill="{{ item }}" aria-pressed="false">{{ item }}</button></li>
      {% else %}
      <li><span class="chip">{{ item }}</span></li>
      {% endif %}
      {% endfor %}
    </ul>
  </div>
  {% endfor %}
</section>
```

`evidenceSources` is computed once, outside the category/item loops, and reused for every `isEvidenced` call — the same array reference is passed each time, so `.eleventy.js`'s `WeakMap` cache still only computes the underlying `Set` once per build rather than once per skill chip.

- [ ] **Step 3: Build and verify chip counts**

Run:
```bash
npm run build
grep -o 'data-skill="[^"]*"' _site/index.html | sort -u
```
Expected: build exits 0, and the deduplicated list contains exactly 31 skills: the 14 pre-existing (Agile Scrum Methodology, ConformIQ, Hexawise, Copilot, Playwright, Jira, qTest, Red Hat OpenShift, GitHub Actions, UrbanCode Deploy, Landmark Pattern Language (LPL), Business Logic Testing (BLT), Git, AccuRev) plus 17 newly evidenced by this feature's bullets: pgvector, Supabase, SQL, RAG, Claude API, Next.js, Vitest, Claude Code, React.js, TypeScript, Mantine, HTML, CSS, JavaScript, Laravel, PHP, Communication. (`Playwright` and `GitHub Actions` also appear on the new Orbit IMS bullets, but were already evidenced via Experience, so they don't add to the count; `Communication` was already in the master Soft Skills list but had no evidencing bullet anywhere until the Volunteer Experience QA Tester entry's third bullet — see Task 1 Step 2 — gained the tag.) `Railway` is **not** in this list and stays an inert chip — none of this feature's bullets tag it; it only appears in The Fourth Official's "Built with" tech line. That leaves 18 of the master list's 49 skills still inert.

- [ ] **Step 4: Full manual verification — the interaction as a hiring manager would actually use it**

Run `npm run serve`, open `http://localhost:8080/`.

- Confirm `Laravel`, `pgvector`, `Supabase`, `RAG`, `Claude API`, `Vitest`, `Claude Code`, and `Communication` chips now render as buttons (cursor: pointer on hover, visible hover state) rather than plain inert text.
- Click `Claude Code`. Confirm: The Fourth Official's 4th bullet ("Built solo using Claude Code...") ticks amber; the card is not dimmed (it has a match); Orbit IMS and Infor Carpool cards both get `.is-zero-match` dimming (neither bullet is tagged `Claude Code`); Experience and Volunteer entries also dim (no match there either); filter bar reads "Filtering by Claude Code" with the source list naming only "The Fourth Official". This is also the plan's check for the spec's required "scroll-to-first-match lands inside a `.project-card`" case (a taller, differently-shaped container than a `.timeline-entry`) — since `Claude Code`'s only match anywhere on the page is this one bullet, confirm the page actually scrolled to bring that bullet into view (not just that it's ticked amber somewhere off-screen), landing below the sticky header/filter-bar chrome rather than behind it.
- Click `Laravel`. Confirm it matches only the Infor Carpool card's first bullet, and correctly dims everything else including the RBC/Infor **Experience** entries (which have no Laravel bullet) — this is the cross-section case that would have been silently broken before Task 4.
- Click `Communication`. This is the plan's one Volunteer-only match case (the spec's "Filter extension" regression-risk section explicitly requires testing a Volunteer-only match, and this is the only skill tagged on any Volunteer bullet). Confirm: the QA Tester entry's third bullet ("Provided feedback on the usability...") ticks amber and stays full-opacity; the QA Tester entry's other two (untagged) bullets dim; the Treasurer entry (no tagged bullets at all) gets its own bullets dimmed and, since it's a `.timeline-entry` not a `.project-card`, shows the hollow rail-dot `.is-zero-match::before` treatment rather than the card-specific opacity rule; every Experience entry and every Project card also dim/zero-match (no `Communication` tag anywhere else); filter bar reads "Filtering by Communication" with the source list naming only "Empowered Futures".
- Click `pgvector`, then also click `RAG` (multi-select, OR logic per the existing chip behavior). Confirm the match count includes multiple bullets within The Fourth Official's card, and the "N matches in The Fourth Official" wording reads correctly (source list de-duplicates repeated card names).
- Tab through the chips with keyboard only, activate one with Enter/Space, then Tab to and activate the "Clear filter" button. Confirm focus lands back on the chip you last toggled (existing focus-restore behavior — verify it still works for a chip whose only match is in Projects, not just Experience).
- Confirm an un-evidenced chip (e.g. `Java`, `Docker`, `Cursor`, `n8n`) still shows no pointer cursor and does nothing when clicked.

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add .eleventy.js src/index.njk
git commit -m "feat: evidence Projects and Volunteer skills in the Skills chip filter"
```

---

### Task 6: Full regression pass, `html-validate`, and accessibility check

**Files:** none (verification only — no code changes expected; if this task finds a real defect, fix it in the relevant file from Tasks 2-5 and re-run this task's checks, don't silently patch without re-verifying)

**Interfaces:** N/A — this task consumes the finished feature from Tasks 1-5 and produces a go/no-go signal for the branch.

- [ ] **Step 1: Run the full lint/build/validate suite**

```bash
npm run lint
npm run build
npx html-validate _site/index.html
```
Expected: all three exit 0.

- [ ] **Step 2: Run the link checker**

This is the project's real CI command (`.github/workflows/ci.yml`), not an invented one:
```bash
npx linkinator _site --recurse --skip "https://www.linkedin.com/*" --skip "^https://markusluisflores.github.io/"
```
Expected: no broken links reported, including the two new external links (`github.com/markusluisflores/the-fourth-official`, `the-fourth-official-production.up.railway.app`) and the existing Orbit IMS repo link.

- [ ] **Step 3: Full keyboard-only pass**

Run `npm run serve`. Starting from the page's first focusable element, Tab through the entire page in order. Confirm:
- Nav links, chips, and project links are all reachable and show a visible focus ring.
- The tab order through the Projects grid is left-to-right, top-to-bottom (DOM order matches visual order — confirm the CSS grid wasn't given an order-scrambling `grid-auto-flow` or similar).
- No element is reachable that shouldn't be (e.g. no phantom focus stop on non-interactive card text).

- [ ] **Step 4: Screen-reader spot check (if available) or ARIA structure review**

If a screen reader is available, turn it on and navigate the Projects and Volunteer sections; confirm section headings (`<h2>`, `<h3>`) are announced in a sensible hierarchy and the filter status announcements (`[data-filter-status]`) fire when filtering. If no screen reader is available, instead read the rendered HTML output (`_site/index.html`) for the two new sections and confirm: every `<img>` (none expected here, but check) has alt text, every interactive element is a real `<button>`/`<a>`, and heading levels don't skip (h2 → h3, never h2 → h4).

- [ ] **Step 5: Cross-browser/theme check**

In the running dev server, toggle dark mode (the 🌓 button) and confirm: `.project-card` background/border/text all use the theme-aware custom properties correctly (no hardcoded light-mode colors leaking through), and the `.project-card.is-zero-match` dimmed title is still legible (not illegibly faint) in **both** light and dark mode — check light mode too, not just dark; a dimmed-text contrast problem here would actually be worse in light mode (the theme with less headroom between `--text-muted` and `--bg`), so dark-mode-only spot checks can miss it.

- [ ] **Step 6: Final full build verification**

```bash
npm run build
```
Expected: exits 0, no warnings.

- [ ] **Step 7: Commit (only if Step 1-6 required a fix)**

If any step above found a real defect and you fixed it:
```bash
git add -A
git commit -m "fix: address regression-pass findings for Projects/Volunteer feature"
```
If no defects were found, skip this step — there's nothing to commit.

---

## Self-Review Notes

- **Spec coverage:** every section of the 2026-08-11 design spec has a corresponding task — data model (Task 1), Projects template/CSS (Task 2), Volunteer template + nav + scroll-reveal (Task 3), filter extension (Task 4), evidenced-skills extension (Task 5), and the spec's explicitly-called-out regression risk (Task 6).
- **Gaps found and fixed during planning, not present in the original spec:** the spec's "Filter extension" section only named `scroll-reveal.js` as needing its section-ID list extended; file inspection during planning found three more hardcoded copies of the same `#experience, #skills, #education` list (`base.njk`'s `<noscript>` fallback, and two blocks in `style.css` — the reduced-motion block and the `@media print` block) that would have silently left Projects/Volunteer broken for no-JS visitors, reduced-motion visitors, and printing. All four are covered in Task 3. Similarly, the spec described generalizing "the `is-match`/`is-dim`/`is-zero-match` rules" without noting that `.project-card` has no rail-dot `::before` element for the zero-match state to attach to — Task 4 Step 4 adds a card-specific `.project-card.is-zero-match` opacity rule instead of relying on a rule that would silently no-op for cards.
- **Type/naming consistency:** `data-source` (not `data-company`) and `matchedSources()` (not `matchedCompanies()`) are used consistently from Task 4 onward; `filter-entry` is the one shared class name used in templates (Task 4), CSS (Task 4), and JS selectors (Task 4) — no divergent naming introduced.
- **Sibling-reuse check:** Task 2's project-card bullets initially duplicated list-reset CSS already present on `.timeline-entry ul`; Task 4 Step 3 removes that duplication once the shared `.filter-entry ul` rule exists, rather than leaving two parallel copies of the same reset rules.
