const LOG_PREFIX = "[Go to Trusted Images]";

/**
 * Get the URL to which the /go/ page will conitnue.
 * @returns {URL}
 */
function getTargetUrl() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get("url");
  return new URL(target);
}

/**
 * Get the listed of trusted image hosts.
 * @returns {string[]}
 */
function getTrustedImageHosts() {
  const json = document.body.getAttribute("data-trusted-image-hosts");
  return JSON.parse(json);
}

/**
 * Is this URL in our trusted hosts list?
 * @param {URL} url
 * @returns {boolean}
 */
function isTrustedHost(url) {
  const trustedImageHosts = getTrustedImageHosts();
  return trustedImageHosts.includes(url.host);
}

/**
 * Is this URL pointing to something with an image extension?
 * @param {URL} url
 * @returns {boolean}
 */
function isImageLink(url) {
  const imageExtension = /(jpe?g|jfif|pjpeg|pjp|a?png|gif|avif|webp)$/i;
  return imageExtension.test(url.pathname);
}

const processedId = "bbb-page-processed";

/**
 * Mark this page as processed.
 */
function markPageProcessed() {
  const form = document.createElement("form");
  form.id = processedId;
  document.appendChild(form);
}

/**
 * Have we already been on this page?
 * If this is true, the user got here by hitting browser back/forward, and we should do nothing.
 * @returns {Boolean}
 */
function isPageProcessed() {
  return Boolean(document.getElementById(processedId));
}

function main() {
  const target = getTargetUrl();
  const isTrusted = isTrustedHost(target);
  const isImage = isImageLink(target);
  const isProcessed = isPageProcessed();
  const shouldNavigate = isTrusted && isImage && !isProcessed;

  console.debug(LOG_PREFIX, "Evaluation:", {
    isTrusted,
    isImage,
    isProcessed,
    shouldNavigate,
  });

  if (shouldNavigate) {
    console.debug(LOG_PREFIX, "Navigating in 1 second.");
    setTimeout(() => {
      window.location = target.href;
    }, 1000);
  } else {
    console.debug(LOG_PREFIX, "Will not navigate this time.");
  }
}

main();
