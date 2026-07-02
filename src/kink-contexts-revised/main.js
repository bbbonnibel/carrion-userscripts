const mainCss = $import("./main.scss");

/**
 * @param {string} html The template element. Must be only one root element.
 */
function template(html) {
  const t = document.createElement("div");
  t.innerHTML = html;
  return t.firstElementChild;
}

/**
 * Install a style sheet into the document.
 * @param {string} css The CSS content of this style element.
 * @param {string} origin The origin of this style sheet. That's this script's name.
 * @param {string} filename The name of this style sheet, e.g. "main.css"
 */
function installStyle(css, origin, filename) {
  const e = document.createElement("style");
  e.setAttribute("data-origin", origin);
  e.setAttribute("data-filename", filename);
  e.innerText = css;
  document.head.appendChild(e);
}

installStyle(mainCss, "kink-contexts", "main.css");

function createButton() {
  return template(`
  <button type="button" class="bbb-kc-button">
    <i class="fa-solid fa-gear"></i>
    <div class="indicator"></div>
  </button>
`);
}

const kinks = document.querySelectorAll(".kink-item");

for (const kink of kinks) {
  const button = createButton();
  const target = kink.querySelector(".kink-info-icon");
  target.insertAdjacentElement("afterend", button);

  button.addEventListener("click", () => {
    kink.classList.toggle("bbb-force-kc");
  });
}
