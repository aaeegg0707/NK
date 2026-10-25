"use strict";

const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeLabel = document.querySelector(".theme-label");
const themeIcon = document.querySelector(".theme-icon");
const menuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector(".site-navigation");
const navigationLinks = document.querySelectorAll(".site-navigation a");
const currentYear = document.querySelector("#current-year");
const lightbox = document.querySelector("#image-lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxCaption = document.querySelector(".lightbox-caption");
const lightboxClose = document.querySelector(".lightbox-close");
const themeStorageKey = "rpdc-theme";
let imageToRestoreFocus = null;

function getTextContent(element) {
  return element?.innerText.replace(/\s+/g, " ").trim() ?? "";
}

function applyTheme(theme, savePreference) {
  const selectedTheme = theme === "light" ? "light" : "dark";
  root.dataset.theme = selectedTheme;

  if (themeToggle && themeLabel && themeIcon) {
    const isLightTheme = selectedTheme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLightTheme));
    themeToggle.setAttribute(
      "aria-label",
      isLightTheme ? "Ativar tema escuro" : "Ativar tema claro"
    );
    themeLabel.textContent = isLightTheme ? "Tema escuro" : "Tema claro";
    themeIcon.textContent = isLightTheme ? "☾" : "☼";
  }

  const themeColor = selectedTheme === "light" ? "#F5F2EB" : "#111111";
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", themeColor);
  }

  if (savePreference) {
    localStorage.setItem(themeStorageKey, selectedTheme);
  }
}

const savedTheme = localStorage.getItem(themeStorageKey);
applyTheme(savedTheme === "light" ? "light" : "dark", false);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });
}

function setMenuOpen(isOpen) {
  if (!menuToggle || !siteNavigation) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  siteNavigation.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

if (menuToggle && siteNavigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      setMenuOpen(false);
    }
  });

  themeToggle?.addEventListener("click", () => setMenuOpen(false));
}

function getImageContext(image) {
  const article = image.closest("article");
  const section = image.closest("section");
  const articleHeading = article?.querySelector("h3");
  const sectionHeading = section?.querySelector("h1, h2");
  const figureCaption = image.closest("figure")?.querySelector("figcaption");

  return {
    articleTitle: getTextContent(articleHeading),
    sectionTitle: getTextContent(sectionHeading),
    figureCaption: getTextContent(figureCaption)
  };
}

function getImageDescription(image) {
  const context = getImageContext(image);
  const ownDescription = image.dataset.lightboxCaption?.trim();
  const alternativeText = image.alt.trim();
  const description = ownDescription || alternativeText || context.figureCaption;
  const sectionTitle = context.articleTitle || context.sectionTitle;

  if (!description) {
    if (sectionTitle) {
      return `Imagem da seção “${sectionTitle}”. Esta composição integra a apresentação visual da República Popular Democrática da Coreia e evoca, em tom solene, sua história, cultura e identidade nacional.`;
    }

    return "Imagem integrante da apresentação visual da República Popular Democrática da Coreia, em uma composição solene dedicada à história, à cultura e à identidade nacional.";
  }

  const normalizedDescription = /[.!?]$/.test(description)
    ? description
    : `${description}.`;
  const contextDescription = sectionTitle
    ? `Na seção “${sectionTitle}”, a imagem compõe uma apresentação visual solene de aspectos históricos, culturais e sociais da RPDC.`
    : "A imagem compõe uma apresentação visual solene de aspectos históricos, culturais e sociais da RPDC.";

  return `${normalizedDescription} ${contextDescription}`;
}

function prepareImage(image) {
  if (lightbox?.contains(image) || image.dataset.lightboxEnabled === "true") {
    return;
  }

  image.dataset.lightboxEnabled = "true";

  if (!image.hasAttribute("tabindex")) {
    image.tabIndex = 0;
  }

  if (!image.closest("a, button") && !image.hasAttribute("role")) {
    image.setAttribute("role", "button");
  }

  if (!image.hasAttribute("aria-label")) {
    const label = image.alt.trim()
      ? `Ampliar imagem: ${image.alt.trim()}`
      : "Ampliar imagem";
    image.setAttribute("aria-label", label);
  }
}

function prepareImages(container = document) {
  container.querySelectorAll("img").forEach(prepareImage);
}

function openLightbox(image) {
  if (!lightbox || !lightboxImage || !lightboxCaption || !image.src) {
    return;
  }

  imageToRestoreFocus = image;
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt.trim();
  lightboxCaption.textContent = getImageDescription(image);
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!lightbox || lightbox.hidden) {
    return;
  }

  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  lightboxImage?.removeAttribute("src");

  if (imageToRestoreFocus?.isConnected) {
    imageToRestoreFocus.focus();
  }

  imageToRestoreFocus = null;
}

prepareImages();

const imageObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLImageElement) {
        prepareImage(node);
      } else if (node instanceof Element) {
        prepareImages(node);
      }
    });
  });
});

imageObserver.observe(document.body, {
  childList: true,
  subtree: true
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const clickedImage = event.target.closest("img");
  if (clickedImage && !lightbox?.contains(clickedImage)) {
    event.preventDefault();
    event.stopPropagation();
    openLightbox(clickedImage);
    return;
  }

  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const focusedImage = target instanceof HTMLImageElement
    ? target
    : target instanceof Element
      ? target.closest("a, button")?.querySelector("img")
      : null;

  if (
    focusedImage
    && !lightbox?.contains(focusedImage)
    && (event.key === "Enter" || event.key === " ")
  ) {
    event.preventDefault();
    openLightbox(focusedImage);
    return;
  }

  if (event.key === "Escape") {
    if (lightbox && !lightbox.hidden) {
      closeLightbox();
      return;
    }

    setMenuOpen(false);
  }
});

lightboxClose?.addEventListener("click", closeLightbox);

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}