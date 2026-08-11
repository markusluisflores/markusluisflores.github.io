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
  var lastChip = null;

  // The filter bar is a second sticky layer and it wraps, so its height depends
  // on how many chips are active and how wide the viewport is. Measure it rather
  // than assume: --chrome-h drives the sidebar's offset and the global
  // scroll-padding-top rule on <html>, and a stale value hides headings behind the bar.
  function chromeHeight() {
    return (header ? header.offsetHeight : 0) + (bar.hidden ? 0 : bar.offsetHeight);
  }

  function syncChrome() {
    var headerHeight = header ? header.offsetHeight : 0;
    root.style.setProperty("--header-measured", headerHeight + "px");
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
      var tail = /\.$/.test(summary) ? "" : ".";
      status.textContent = "Filtering Experience by " + names + ". " + summary + tail;
    }
  }

  function commit() {
    announce(paint(null));
  }

  // Clearing hides the bar. If focus was inside it AND that focus is the kind
  // a keyboard user relies on (:focus-visible) that focus would be destroyed
  // and fall to <body>, stranding a keyboard user at the top of the document.
  // Return it to the chip they last toggled. Checking :focus-visible, not just
  // document.activeElement, matters: a mouse click on Clear also sets
  // activeElement to the button (without a visible ring), and without this
  // check that mouse click would trigger the same restore-focus-and-scroll
  // behavior meant only for keyboard users, jumping the page unexpectedly.
  function clearAll() {
    var focusWasInBar =
      bar.contains(document.activeElement) &&
      typeof document.activeElement.matches === "function" &&
      document.activeElement.matches(":focus-visible");
    active = [];
    chips.forEach(function (chip) {
      chip.setAttribute("aria-pressed", "false");
    });
    commit();
    if (focusWasInBar && lastChip) {
      lastChip.focus();
    }
  }

  // Scroll to the first matching bullet itself, not just its entry. Scrolling
  // to the entry only guarantees the company/role heading is visible - on a
  // short viewport with a long bullet list, the actual matched (amber-ticked)
  // bullet can still land below the fold, which defeats the point of the
  // interaction (the visitor sees the entry but not the evidence). Scrolling
  // to the li directly, relying on the global scroll-padding-top rule on
  // <html> for the sticky-chrome offset, keeps the match itself on screen.
  function revealFirstMatch() {
    var li = document.querySelector(".timeline-entry li.is-match");
    if (!li) {
      return;
    }
    var box = li.getBoundingClientRect();
    if (box.top >= chromeHeight() && box.bottom <= window.innerHeight) {
      return;
    }
    li.scrollIntoView({
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
      lastChip = chip;
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
