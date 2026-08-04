# ADR-001: Use Eleventy as the static site generator

**Date:** 2026-08-03
**Status:** Accepted

## Context and Problem Statement

This repo publishes a personal resume/portfolio site via GitHub Pages. The site needs a modern, distinctive, hand-designed visual identity (not a generic template look), and the design explicitly keeps the door open for a future "Projects" section without restructuring what's built now. We need to choose how the site is built: no generator, GitHub's native generator, or a separate tool run in CI.

## Decision Drivers

* Repo must stay public (GitHub Pages Free-plan constraint — see the project's `CLAUDE.md`), and the build must produce static output GitHub Pages can serve.
* Must support template reuse (shared nav/footer) so adding a future page doesn't mean hand-duplicating markup.
* Must not fight a fully custom, hand-written CSS design.
* Should use tooling the user is already comfortable with, since this is a solo-maintained project.

## Considered Options

* Plain HTML/CSS/JS, no build step
* Jekyll (GitHub Pages' native, zero-config generator)
* Eleventy (11ty), built via GitHub Actions

## Decision Outcome

**Chosen: Eleventy, built via GitHub Actions** — it's the only option that satisfies both the template-reuse driver and the custom-design driver at once. Plain HTML fails the reuse driver (a future Projects page would require hand-copying nav/footer). Jekyll satisfies reuse but its Ruby/Liquid templating fights a fully custom, hand-designed look, and it's the least familiar tooling of the three for this user. Eleventy is JS-based, matching the tooling already used across this user's other projects (Vite/React, Next.js), and outputs plain static HTML/CSS/JS with no framework runtime shipped to the browser.

### Consequences

* ✅ Templating/partials avoid duplicating nav/footer when a Projects section is added later.
* ✅ Full design control — output is hand-written CSS/HTML, not fighting a templating system's defaults.
* ✅ Familiar JS/npm-based dev loop, consistent with the user's other projects.
* ⚠️ Requires a GitHub Actions build step (`ci.yml` / `deploy.yml`) rather than GitHub's zero-config Jekyll pipeline — one more moving part that must succeed for the site to deploy, though this is a standard, well-documented pattern (`actions/upload-pages-artifact` + `actions/deploy-pages`).
* ⚠️ ~20-30 minute one-time setup cost (config file, workflow file) that plain HTML or Jekyll wouldn't require.
