const mainCss = $import("./main.scss");
const starEmpty = $import("./star-empty.svg");
const starFilled = $import("./star-filled.svg");

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

installStyle(mainCss, "pinned-characters", "main.css");

/**
 * Add a character to the pin list.
 * @param {HTMLDivElement} card The character's card
 */
function removePin(card) {}
/**
 * Remove a character from the pin list.
 * @param {HTMLDivElement} card The character's card
 */
function addPin(card) {}

const cards = document.querySelectorAll(".character-card");
for (const card of cards) {
  const pinBtn = template(`
    <div class="bbb-pin-character-button">
      <div class="halo"></div>
      <div class="star hide-when-pinned">${starEmpty}</div>
      <div class="star hide-unless-pinned">${starFilled}</div>
    </div>
  `);
  card.insertBefore(pinBtn, card.firstChild);

  const pinClass = "bbb-pinned";

  pinBtn.addEventListener("click", () => {
    if (card.classList.contains(pinClass)) {
      card.classList.remove(pinClass);
      removePin(card);
    } else {
      card.classList.add(pinClass);
      addPin(card);
    }
  });
}
