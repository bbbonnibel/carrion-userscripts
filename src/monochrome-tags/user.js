const location = document.location;

const SEARCH_CARD_SELECTOR = ".character-card .character-meta + div";
const PROFILE_CARD_SELECTOR =
  "#filtered-profile-content .card-body :nth-child(2) h3 + div";
const TAG_SELECTOR = "span[title]";
const DATA_ATTR = "data-nth-category";

const INSERT_LABELS = false;

let isCharacterPage = false;
let isSearchPage = false;

if (location.pathname.startsWith("/character/")) {
  isCharacterPage = true;
} else if (location.pathname.startsWith("/search/")) {
  isSearchPage = true;
}

function main() {
  if (!isCharacterPage && !isSearchPage) {
    return;
  }

  const style = document.createElement("style");
  style.innerHTML = `{{CSS}}`;
  style.setAttribute("data-from", "monochrome-tags.user.js");
  document.head.appendChild(style);

  document.addEventListener("DOMContentLoaded", () => {
    stripeTags();
  });
}

function stripeTags() {
  const tagRows = [
    ...document.body.querySelectorAll(PROFILE_CARD_SELECTOR),
    ...document.body.querySelectorAll(SEARCH_CARD_SELECTOR),
  ]
    .flat()
    .filter(Boolean);

  console.log(tagRows);

  for (const row of tagRows) {
    const tags = [...row.getElementsByTagName("span")].filter((span) =>
      span.hasAttribute("title"),
    );

    if (tags.length === 0) {
      continue;
    }

    let alternate = true;
    tags.forEach((tag, index) => {
      const title = tag.getAttribute("title");
      const previous = index === 0 ? null : tags[index - 1];
      const previousTitle = previous?.getAttribute("title") ?? "";

      const firstInSection = title !== previousTitle;

      if (firstInSection) {
        alternate = !alternate;

        if (INSERT_LABELS) {
          const label = document.createElement("span");
          label.className = "tag-category-label";
          label.textContent = title;
          row.insertBefore(label, tag);
        }
      }

      tag.setAttribute(DATA_ATTR, alternate ? "1" : "0");
    });
  }
}

main();
