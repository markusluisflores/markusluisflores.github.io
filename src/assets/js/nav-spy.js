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

  function atBottom() {
    var scrollable = document.documentElement.scrollHeight > window.innerHeight;
    return (
      scrollable && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    );
  }

  function refresh() {
    var current = null;
    if (atBottom()) {
      current = targets[targets.length - 1];
    } else {
      targets.forEach(function (target) {
        if (target.visible) {
          current = target;
        }
      });
    }
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

  window.addEventListener("scroll", refresh, { passive: true });
})();
