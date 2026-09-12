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

installStyle(mainCss, "profile-lists", "main.css");

const links = document.querySelector(".character-list-links");
const stats = document.querySelector(".profile-stats-grid");
if (links) {
  if (links.firstChild.nodeName === "#text") {
    const header = template(`
      <div class="text-muted" style="font-size: 13px; margin-bottom: 4px;">
        ${links.firstChild.textContent.replaceAll(":", "")}
      </div>
    `);
    links.firstChild.replaceWith(header);
  }
  stats.appendChild(links);
}

console.log("[BBB Hotfix] Profile Lists running");
