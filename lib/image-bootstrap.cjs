module.exports = function () {
  if (window.__hgImages) {
    window.__hgImages();
    return;
  }
  const system = matchMedia("(prefers-color-scheme:dark)");
  function refresh() {
    const mode = document.documentElement.dataset.mode;
    const dark = mode === "dark" || (mode !== "light" && system.matches);
    document.querySelectorAll("[data-responsive-image]").forEach((host) => {
      if (host.dataset.failed) return;
      const data = JSON.parse(host.dataset.responsiveImage);
      let picture = host.querySelector(":scope > picture");
      if (!picture) {
        picture = document.createElement("picture");
        picture.append(
          document.createElement("source"),
          document.createElement("img"),
        );
        const img = picture.querySelector("img");
        img.alt = data.alt || "";
        img.width = 1200;
        img.height = 800;
        img.loading = host.dataset.eager === "true" ? "eager" : "lazy";
        if (host.dataset.eager === "true") img.fetchPriority = "high";
        img.addEventListener("error", () => {
          if (host.dataset.failed) return;
          host.dataset.failed = "true";
          picture.querySelector("source").removeAttribute("srcset");
          if (data.fallback) {
            img.onerror = () => {
              host.hidden = true;
              host.closest(".site-masthead")?.classList.add("media-failed");
            };
            img.src = data.fallback;
          } else {
            host.hidden = true;
            host.closest(".site-masthead")?.classList.add("media-failed");
          }
        });
        host.prepend(picture);
      }
      const src = dark ? data.dark || data.src : data.src;
      const mobile = dark
        ? data.mobile_dark || data.mobile || data.dark || data.src
        : data.mobile || data.src;
      const source = picture.querySelector("source");
      source.media = "(max-width:1023px)";
      if (source.getAttribute("srcset") !== mobile) source.srcset = mobile;
      const img = picture.querySelector("img");
      if (img.getAttribute("src") !== src) img.src = src;
    });
  }
  window.__hgImages = refresh;
  new MutationObserver(refresh).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  system.addEventListener("change", refresh);
  refresh();
};
