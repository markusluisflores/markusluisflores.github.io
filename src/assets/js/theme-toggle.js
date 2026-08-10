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
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Storage may be unavailable (e.g. "Block all cookies", sandboxed
      // iframes). The theme should still visually change and the toggle
      // buttons should still reflect it correctly, even if the choice
      // won't persist across reloads in that browsing context.
    }
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
