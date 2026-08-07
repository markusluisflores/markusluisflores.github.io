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
