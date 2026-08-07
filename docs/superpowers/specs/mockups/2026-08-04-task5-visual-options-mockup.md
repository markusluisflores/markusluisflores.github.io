# Task 5 — Visual Design: Three Options

Palette swatches (rendered, not just hex labels): `2026-08-04-task5-visual-options-palette.html` / `.pdf`, same folder.

Design-process steps run: consistency-audit → platform-research → `ui-ux-pro-max`. Findings that shaped these three:

- The most-copied, best-regarded reference in this exact genre (personal dev portfolios) is restraint executed well — one accent, disciplined type, no decorative gimmicks — not maximalism.
- A literal profession-metaphor (a "testing/verification" visual theme) has no good precedent in this genre and risks reading as gimmicky to a hiring manager — so none of the three options below build the page around a literal QA metaphor. Distinctiveness comes from typography, color discipline, and layout confidence instead.
- Three-family type systems (display + body + a mono "label" register) ARE a recognized, well-executed pattern specifically for developer portfolios — not automatically overdesign — provided the mono stays confined to short functional strings (dates, tags, nav), never body copy.
- Neutral-at-rest with the accent reserved mostly for interaction is the more common, more effective pattern at resume/single-page scale (vs. accent-at-rest everywhere).
- Avoid: purple/indigo gradient orbs, glassmorphism, default blue (spec already excludes this), badge-above-headline.

All three keep the DOM structure Task 4 already locked in (same class names, same `.timeline-entry` → `h3`/`.timeline-meta`/`ul` order, same two-instance theme toggle) — only the visual system changes.

---

## Option A — Editorial Restraint

**Type:** Fraunces (display) + Inter (body). Two families only, no mono register.
**Accent:** deep amber `#b5762a` light / `#e8a94d` dark — reserved mostly for hover/CTA, one resting mark in the hero.
**Radius:** 6px, soft.
**Feel:** confident serif display, generous whitespace, closest to "editorial magazine" — distinctiveness comes from typographic voice and restraint, the lowest-risk option relative to the genre's most-respected reference points.

```
┌──────────────────────────────────────────────────┐
│  Experience  Skills  Education            ◐        │  <- slim sticky nav, Inter, plain
│                                                     │
│  Markus Luis Flores                                │  <- Fraunces, 56px, warm ink
│  Software Developer                                │  <- Inter, muted, no accent color
│                                                     │
│  SDET focused on reliable, well-tested systems     │
│  and clean automation.                             │
│  ────  (single 3rem accent rule, amber)            │
│  ✉ Email   ⌥ GitHub   in LinkedIn                  │
│                                                     │
│  ─────────────────────────────────────────────    │
│  Experience                                        │
│  │ SDET — Quality Engineer          RBC · 2025–    │
│  │ • Built and maintained end-to-end test suites   │
│  │ • Reduced flake rate across the regression pack │
│  │                                                  │
│  │ Software Engineer          Infor · 2018–2023    │
│  │ • ...                                            │
│                                                     │
│  Skills                                            │
│  [TypeScript] [Playwright] [Cypress] [CI/CD]       │  <- soft-radius outline chips
└──────────────────────────────────────────────────┘
```

---

## Option B — Technical Precision

**Type:** Space Grotesk (display) + Inter (body) + JetBrains Mono (label register — nav, dates, tags, section headings only). Three families, well-precedented for this genre.
**Accent:** deep teal `#1b7a72` light / `#5edcd0` dark — the closest to the genre's most-respected reference (Brittany Chiang's single-teal-accent portfolio), reserved for hover/interaction.
**Radius:** 4px.
**Feel:** distinctiveness comes from the mono label register itself (uppercase, tracked-out, small) doing real work — not from an illustrated metaphor. This is closest in spirit to the already-drafted candidate in the plan, minus its literal "instrument panel"/tick-mark conceit.

```
┌──────────────────────────────────────────────────┐
│  EXPERIENCE  SKILLS  EDUCATION            ◐        │  <- mono, uppercase, tracked, small
│                                                     │
│  Markus Luis Flores                                │  <- Space Grotesk, 60px, tight tracking
│  SOFTWARE DEVELOPER                                │  <- mono label, teal-muted
│                                                     │
│  SDET focused on reliable, well-tested systems     │
│  and clean automation.                             │  <- Inter body
│  ✉ Email   ⌥ GitHub   in LinkedIn                  │
│                                                     │
│  ─────────────────────────────────────────────    │
│  EXPERIENCE                                        │  <- mono section label
│  │ RBC · MAY 2025 — PRESENT     (mono eyebrow)     │
│  │ SDET — Quality Engineer      (Space Grotesk h3) │
│  │ – Built and maintained end-to-end test suites   │
│  │ – Reduced flake rate across the regression pack │
│                                                     │
│  SKILLS                                            │
│  [TYPESCRIPT] [PLAYWRIGHT] [CYPRESS] [CI/CD]       │  <- mono, small, neutral outline
└──────────────────────────────────────────────────┘
```

---

## Option C — Bold Statement

**Type:** Archivo or Inter Tight (display, oversized via `clamp()`) + Inter (body). Two families.
**Accent:** vermillion `#c7401f` light / `#ff6b45` dark — used only for interaction and a single underline CTA, never a fill.
**Radius:** 0px everywhere.
**Feel:** distinctiveness comes from scale and confidence — the name is genuinely large, whitespace is aggressive, everything else stays quiet. Highest visual "swing" of the three but the lowest craft complexity (fewer decorative rules to get wrong).

```
┌──────────────────────────────────────────────────┐
│  Experience  Skills  Education            ◐        │  <- plain, small, quiet
│                                                     │
│                                                     │
│  MARKUS LUIS                                       │  <- Archivo 800, ~80px, edge-to-edge
│  FLORES                                            │
│                                                     │
│  Software Developer                                │
│  SDET focused on reliable, well-tested systems.    │
│  Download Resume  (underline CTA, vermillion, 0    │
│  radius, no fill)                                  │
│                                                     │
│  ─────────────────────────────────────────────    │
│  Experience                                        │
│  │ SDET — Quality Engineer          RBC · 2025–    │
│  │ • Built and maintained end-to-end test suites   │
│                                                     │
│  Skills                                            │
│  TypeScript · Playwright · Cypress · CI/CD         │  <- plain text list, no chip borders
└──────────────────────────────────────────────────┘
```

---

## Where the already-drafted candidate fits

The CSS already written into the plan (indigo accent, three-register type including IBM Plex Mono, tick-mark bullets, calibration-rail metaphor) is closest to **Option B** in structure (three-family, mono labels) but goes further into a literal "instrument panel" conceit that platform research found no good precedent for. If Option B is chosen, that candidate becomes the starting point with the literal metaphor dropped — not a from-scratch rewrite.

## Decisions

| Question | Chosen | Why | Tradeoff accepted |
|---|---|---|---|
| Q1 — Which of the three visual directions? | **Option A — Editorial Restraint** | Fraunces + Inter, distinctiveness from typographic voice and restraint rather than an added family or a literal metaphor — closest to the genre's most-respected reference points. | Lower structural ambition than Option B's three-family label system; no mono register. |
| Q2 — If Option B: keep or drop the mono label register's uppercase+tracking treatment on section headings specifically (heaviest single use of it)? | **N/A — moot.** | Option A was chosen, not Option B, so this question about Option B's mono register never arises. | — |
| Q3 — Accent hue: keep as shown, or a different color entirely (all three avoid blue/purple/indigo per spec + research; pick a specific hue if none of the three shown fit)? | **Kept as shown — deep amber**, `#b5762a` light / `#e8a94d` dark, later split into `--accent` (decorative) and `--accent-strong` (text/CTA, fixing a contrast failure in the original single-token version). | Matches Option A as presented; no alternative hue was requested. | Accent reserved mainly for interaction/emphasis rather than applied broadly at rest, per platform research into comparable sites. |
