(function () {
  // Always set up the observer regardless of prefers-reduced-motion: the
  // CSS's own @media (prefers-reduced-motion: no-preference) block is what
  // actually governs whether opacity/transform (and therefore is-visible)
  // has any visual effect. Checking the media query here once and bailing
  // out would leave no observer running to react if the visitor flips their
  // OS setting from reduce to no-preference mid-session (CSS media queries
  // re-evaluate live, but a one-time JS check does not), which would strand
  // sections at opacity: 0 with nothing to ever add is-visible back.
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
    { threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
