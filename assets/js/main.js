(function () {
  "use strict";

  var toggle = document.querySelector(".menu-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  var form = document.querySelector("#contact-form");
  var errorBox = document.querySelector("#contact-form-error");
  if (form && errorBox) {
    form.addEventListener("submit", function (e) {
      var consent = form.querySelector('input[type="checkbox"]');
      if (consent && !consent.checked) {
        e.preventDefault();
        errorBox.hidden = false;
        errorBox.focus();
      }
    });
  }
})();
