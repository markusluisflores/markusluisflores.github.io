# Projects & Volunteer Experience — Design

**Date:** 2026-08-11
**Branch:** `docs/certifications-cocurricular-brainstorm`
**Status:** Approved, pending write-up review

## Purpose

Add two new sections to the resume site — **Projects** and **Volunteer Experience** — covering content that's on the real PDF resume but not yet on the live site. Certifications was considered and dropped from scope (see "Out of scope" below).

## Scope

**In scope:**
- New `Projects` section: three entries — The Fourth Official, Orbit Inventory Management System, Infor Carpool Project.
- New `Volunteer Experience` section: two entries — QA Tester at Empowered Futures, Treasurer at SAIT Beekeeping Club.
- New nav order: `Experience → Skills → Projects → Education → Volunteer`.
- Extending the existing Skills → Experience click-to-filter interaction to also cover Projects and Volunteer bullets (scope increase decided mid-session — see "Filter extension" below).
- New Skills entries: `Laravel`, `pgvector`, `Supabase` (Backend); `Vitest` (Testing); `Railway` (DevOps); `RAG`, `Claude API` (AI Tools). The existing `Claude Code` tag becomes evidenced for the first time.

**Out of scope:**
- Certifications. The user supplied 5 Infor/Landmark-specific certifications, all expired and tied to a job left in 2023, not listed on the real PDF resume. Dropped after discussion — recommended and agreed.
- Any further skills-to-evidence mapping pass beyond what's introduced by this feature's own bullets (currently 14/42 skills evidenced before this change; tracked as ongoing separate work).

## Content

### Projects (ordered most-recent-first, matching Experience convention)

**1. The Fourth Official** — Personal Project, Jul 2026 – Present
Built with: Next.js, Supabase Postgres + pgvector, Voyage embeddings, Claude Haiku 4.5, Vitest, Railway
Links: GitHub repo (`https://github.com/markusluisflores/the-fourth-official`), Live demo — password on request (`https://the-fourth-official-production.up.railway.app/`)

Bullets:
1. "Built a hybrid retrieval pipeline over the IFAB Laws of the Game, fusing pgvector similarity search and Postgres full-text search with Reciprocal Rank Fusion in a single SQL query." — skills: `pgvector`, `Supabase`, `SQL`, `RAG`
2. "Generated grounded answers with Claude using native citations, streaming claim-to-passage links alongside a panel showing every retrieved passage, its similarity score, and whether the answer used it." — skills: `Claude API`, `Next.js`, `RAG`
3. "Tuned retrieval against measured evals (recall@8, MRR) and calibrated a relevance gate that abstains on off-topic questions before any generation spend." — skills: `RAG`, `Vitest`
4. "Built solo using Claude Code as the primary development tool, running a structured spec, plan, implementation, and review workflow backed by design docs and ADRs." — skills: `Claude Code`

Rationale for this project's inclusion: the site's Skills → AI Tools list has carried a `Claude Code` chip since the original build with zero supporting evidence anywhere on the site. This project is the only real evidence available, and it also demonstrates RAG/vector-search engineering depth not represented anywhere else. Repo verified (created 2026-07-09, README reviewed) before drafting bullets. Bullet wording was drafted via a bounded consult with a stronger model (Opus), given directly to word technical bullets accurately from the README rather than inventing detail — the consult recommended splitting into 4 bullets (retrieval / generation / evals+gate / process) rather than the 3-bullet draft, so the evals/gate work — the strongest "real engineering" signal — gets its own line instead of being buried in a trailing clause.

**2. Orbit Inventory Management System** — Team Capstone Project, Sep 2024 – May 2025
Built with: Next.js, React.js, TypeScript, Mantine, Firebase
Links: GitHub repo (`https://github.com/ragustinesantos/orbit-ims`) — no live-demo link; the project's Vercel demo URL was verified dead (404) and is deliberately not linked.

Bullets:
1. "Designed and developed core application features and workflows based on team requirements, from UI components to business logic." — skills: `Next.js`, `React.js`, `TypeScript`, `Mantine`, `HTML`, `CSS`, `JavaScript`
2. "Set up Playwright test automation from scratch and wrote the initial test suite covering core CRUD flows." — skills: `Playwright`
3. "Contributed to CI/CD and code-quality tooling." — skills: `GitHub Actions`

Rationale: bullets are grounded in the user's actual commit history on the repo (verified via `gh api repos/.../commits?author=...`), not the generic PDF phrasing, which credited the whole team's work rather than the user's specific contribution. The first bullet was deliberately kept general (not naming the specific "ROR wizard" module) at the user's request, matching the phrasing style of the Experience section's bullets (action + scope, not module internals). User is the #2 contributor by commit count (130 of ~600, 5-person team) — confirmed via `gh api .../contributors`.

**3. Infor Carpool Project** — Volunteer, Feb 2019 – May 2022
Built with: Laravel, MySQL
Links: none (proprietary Infor-internal project; no public repo or demo exists)

Bullets:
1. "Built a mobile carpool booking application with Infor's Community of Business Analysts, as part of a 5-person team." — skills: `Laravel`, `PHP`, `SQL`
2. "Won Infor's Innovation Flight Central Shark Tank competition and Habi Team of the Year at Infor's Sinagtala Awards." — no skills tag

### Volunteer Experience

**1. Quality Assurance Tester** — Empowered Futures, June 2024
1. "Performed end-to-end testing for the Empowered Futures Connect platform."
2. "Documented scenarios, steps to replicate, and test evidence on issues and concerns found during software testing."
3. "Provided feedback on the usability of the application for different roles and perspectives." — skills: `Communication`

**2. Treasurer** — SAIT Beekeeping Club, June 2024 – April 2025
1. "Participated in hive inspections, honey jarring, and other club activities as an active member."
2. "Served as treasurer, auditing all financial transactions and managing the club's finances."

Rationale for inclusion: not industry work, but genuine soft-skill evidence (financial oversight, active club leadership) rather than pure trivia — decided worth a second Volunteer Experience entry rather than a separate "fun facts" section, since it fits the same role/org/dates shape and doesn't justify a new content category for one item.

The QA Tester entry's third bullet is tagged `Communication` (already present in the Skills → Soft Skills list) — without at least one Volunteer bullet carrying a real tag, a "Volunteer only" filter match is structurally impossible, which would leave the "Filter extension" section's own regression-testing requirement below (filtering with matches in Experience only, Projects only, Volunteer only, and mixed) unsatisfiable. Found and fixed during PR #16's review (round 3) — an earlier version of this spec added skills data to Projects but left every Volunteer bullet untagged.

## Data model (`src/_data/resume.json`)

Two new top-level arrays, following the existing `experience` array's `{bullets: [{text, skills}]}` shape:

```json
"projects": [
  {
    "title": "The Fourth Official",
    "subtitle": "Personal Project",
    "dates": "Jul 2026 – Present",
    "builtWith": "Next.js, Supabase Postgres + pgvector, Voyage embeddings, Claude Haiku 4.5, Vitest, Railway",
    "links": [
      { "label": "GitHub repo", "url": "https://github.com/markusluisflores/the-fourth-official" },
      { "label": "Live demo (password on request)", "url": "https://the-fourth-official-production.up.railway.app/" }
    ],
    "bullets": [
      { "text": "Built a hybrid retrieval pipeline over the IFAB Laws of the Game, fusing pgvector similarity search and Postgres full-text search with Reciprocal Rank Fusion in a single SQL query.", "skills": ["pgvector", "Supabase", "SQL", "RAG"] },
      { "text": "Generated grounded answers with Claude using native citations, streaming claim-to-passage links alongside a panel showing every retrieved passage, its similarity score, and whether the answer used it.", "skills": ["Claude API", "Next.js", "RAG"] },
      { "text": "Tuned retrieval against measured evals (recall@8, MRR) and calibrated a relevance gate that abstains on off-topic questions before any generation spend.", "skills": ["RAG", "Vitest"] },
      { "text": "Built solo using Claude Code as the primary development tool, running a structured spec, plan, implementation, and review workflow backed by design docs and ADRs.", "skills": ["Claude Code"] }
    ]
  },
  {
    "title": "Orbit Inventory Management System",
    "subtitle": "Team Capstone Project",
    "dates": "Sep 2024 – May 2025",
    "builtWith": "Next.js, React.js, TypeScript, Mantine, Firebase",
    "links": [
      { "label": "GitHub repo", "url": "https://github.com/ragustinesantos/orbit-ims" }
    ],
    "bullets": [
      { "text": "Designed and developed core application features and workflows based on team requirements, from UI components to business logic.", "skills": ["Next.js", "React.js", "TypeScript", "Mantine", "HTML", "CSS", "JavaScript"] },
      { "text": "Set up Playwright test automation from scratch and wrote the initial test suite covering core CRUD flows.", "skills": ["Playwright"] },
      { "text": "Contributed to CI/CD and code-quality tooling.", "skills": ["GitHub Actions"] }
    ]
  },
  {
    "title": "Infor Carpool Project",
    "subtitle": "Volunteer",
    "dates": "Feb 2019 – May 2022",
    "builtWith": "Laravel, MySQL",
    "links": [],
    "bullets": [
      { "text": "Built a mobile carpool booking application with Infor's Community of Business Analysts, as part of a 5-person team.", "skills": ["Laravel", "PHP", "SQL"] },
      { "text": "Won Infor's Innovation Flight Central Shark Tank competition and Habi Team of the Year at Infor's Sinagtala Awards." }
    ]
  }
],
"volunteer": [
  {
    "role": "Quality Assurance Tester",
    "org": "Empowered Futures",
    "dates": "June 2024",
    "bullets": [
      { "text": "Performed end-to-end testing for the Empowered Futures Connect platform." },
      { "text": "Documented scenarios, steps to replicate, and test evidence on issues and concerns found during software testing." },
      { "text": "Provided feedback on the usability of the application for different roles and perspectives.", "skills": ["Communication"] }
    ]
  },
  {
    "role": "Treasurer",
    "org": "SAIT Beekeeping Club",
    "dates": "June 2024 – April 2025",
    "bullets": [
      { "text": "Participated in hive inspections, honey jarring, and other club activities as an active member." },
      { "text": "Served as treasurer, auditing all financial transactions and managing the club's finances." }
    ]
  }
]
```

`links` is an array (0, 1, or 2 entries) rather than the single nullable `link` object considered earlier in the session, since The Fourth Official needs two links (repo + live demo) and Infor Carpool needs zero.

**Skills additions** to the existing `skills` array in `resume.json`:
- `Backend`: add `Laravel`, `pgvector`, `Supabase`
- `Testing`: add `Vitest`
- `DevOps`: add `Railway`
- `AI Tools`: add `RAG`, `Claude API` (existing `Claude Code` entry unchanged, but becomes evidenced by this change)

Every skill tag used in a bullet above matches a string added to (or already present in) this list, per the site's existing hard rule that `isEvidenced` matching is exact-string.

## Templates

**`src/index.njk`** gains two new sections, moved into the confirmed nav order (`Experience → Skills → Projects → Education → Volunteer`):

```html
<section id="projects">
  <h2>Projects</h2>
  <div class="project-grid">
    {% for project in resume.projects %}
    <article class="project-card filter-entry" data-source="{{ project.title }}">
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
```

```html
<section id="volunteer">
  <h2>Volunteer Experience</h2>
  <ol class="timeline" role="list">
    {% for entry in resume.volunteer %}
    <li class="timeline-entry filter-entry" data-source="{{ entry.org }}">
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

The Experience section's existing `<li class="timeline-entry">` also gains the `filter-entry` class and switches its `data-company` attribute to `data-source` (see "Filter extension" below).

**`src/_layouts/base.njk`** nav updated to:
```html
<nav class="site-nav">
  <a href="#experience">Experience</a>
  <a href="#skills">Skills</a>
  <a href="#projects">Projects</a>
  <a href="#education">Education</a>
  <a href="#volunteer">Volunteer</a>
</nav>
```
`nav-spy.js` needs no changes — it derives its targets dynamically from `.site-nav a[href^='#']`, so the new links are picked up automatically.

## Filter extension

Originally scoped to leave the Skills → Experience click-to-filter interaction untouched and let Projects/Volunteer bullets carry inert `skills` data for a future round. Revisited mid-session: the user opted to extend the filter now, accepting the added scope, after an explicit complexity/tradeoff discussion (this file's rationale sections above cover the "why" for that reversal).

Required changes:

1. **Shared hook class.** Both `.timeline-entry` (Experience, Volunteer) and `.project-card` (Projects) get an additional `filter-entry` class, used as the interaction's generic selector root instead of assuming one visual shape.
2. **Generic grouping attribute.** `data-company` is renamed to `data-source` everywhere (Experience entries too, for consistency) — holds the company name, org name, or project title depending on section.
3. **`src/assets/js/skill-filter.js`:**
   - `bullets` selector: `.filter-entry ul li` (was `.timeline-entry ul li`)
   - `entries` selector: `.filter-entry` (was `.timeline-entry`)
   - `matchedCompanies()` renamed to `matchedSources()`, reads `data-source` instead of `data-company`
   - `revealFirstMatch()`'s query becomes `.filter-entry li.is-match` (was `.timeline-entry li.is-match`)
4. **Copy.** The filter bar's summary text and the screen-reader status announcement both currently hardcode the word "Experience" ("Filtering Experience by X"). Both become "Filtering by X" — the `matchedSources()` list (e.g. "3 matches in RBC and The Fourth Official") already conveys where the matches are without needing the word "Experience" baked into the sentence.
5. **CSS (`src/assets/css/style.css`).** The base bullet rules and their `is-match`/`is-dim` variants (currently `.timeline-entry ul`, `.timeline-entry ul li`, `.timeline-entry ul li::before`, `.timeline-entry ul li.is-match::before`, `.timeline-entry ul li.is-dim`, including their `@media print` force-reset override) are generalized to target `.filter-entry` instead of `.timeline-entry`, so they apply equally to `.project-card`. `.timeline-entry.is-zero-match::before` (the rail-dot hollow state) is **not** generalized — it stays scoped to `.timeline-entry`, since that dot is positioned relative to the timeline's border-left line, a structural feature `.project-card` doesn't have. Cards instead get their own zero-match treatment: dimming `.project-card.is-zero-match h3` only (not the card's meta/tech/link text, which already sits close to the WCAG AA contrast floor and would fail it if dimmed further). There is no separate `prefers-reduced-motion` override for any of these rules to generalize — this codebase's only `prefers-reduced-motion` blocks govern the scroll-reveal fade-in, not the filter's dim/match state, and don't reference `is-dim`/`is-zero-match` at all.
6. **`.eleventy.js`.** The `isEvidenced` filter currently only scans `resume.experience`. It's updated to scan `resume.experience`, `resume.projects`, and `resume.volunteer` combined, so Skills chips accurately reflect evidence from all three sections. `src/index.njk`'s call site changes from `item | isEvidenced(resume.experience)` to pass a combined array (e.g. built once via `resume.experience.concat(resume.projects, resume.volunteer)` and reused across the chip-rendering loop for the WeakMap cache to hit consistently).
7. **`src/assets/js/scroll-reveal.js`.** Its hardcoded section list (`#experience, #skills, #education`) gains `#projects, #volunteer`, or those two sections never receive the `is-visible` class and stay at `opacity: 0`.

### Regression risk

`skill-filter.js` already went through 6 review rounds during PR #5 and had several non-obvious bugs fixed in PR #15 (focus-visible restore guard, chrome-height measurement via `ResizeObserver`, scroll-to-match targeting the bullet itself rather than its parent entry). This change doesn't touch that logic's *behavior*, only widens what it selects and how entries are labeled — but because it's the same fragile component, the implementation plan must include a full manual/Playwright re-verification pass covering: filtering with matches in Experience only, Projects only, Volunteer only, and mixed; the zero-match dimming state across all three section shapes; keyboard focus restore after Clear; and scroll-to-first-match landing correctly inside a `.project-card` (a taller, differently-shaped container than a `.timeline-entry`).

## Testing

- This project has no unit-test framework and no `test` script (`package.json` confirmed) — a deliberate choice from the original site design, since it's presentational markup driven by data, not application logic. "Tests" for `skill-filter.js` and `.eleventy.js`'s `isEvidenced` filter mean `npm run build` and `npm run lint` both exiting 0, plus the manual/browser regression pass this section already requires — not an automated test suite.
- Manual/Playwright browser verification of the filter's extended behavior (see "Regression risk" above) is required given the component's history — this is exactly the kind of real-browser testing this project's process notes call out as the correct use of that effort, not a case to skip.
- Visual QA of the new `.project-card` grid at the breakpoints already established for the rest of the site (the existing responsive rules for `.timeline` and `.skill-chips` should inform the grid's own breakpoints, not be redesigned from scratch).

## Out of scope (deferred, not part of this feature)

- The broader skills-to-evidence mapping pass beyond what this feature's own bullets contribute.
- Any further content sections (Certifications, explicitly dropped this session).
