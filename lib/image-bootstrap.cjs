module.exports = function () {
  if (window.__hgImages) {
    window.__hgImages();
    return;
  }
  const system = matchMedia("(prefers-color-scheme:dark)");
  const compact = matchMedia("(max-width:1023px)");
  const states = new WeakMap();
  function refresh() {
    const mode = document.documentElement.dataset.mode;
    const dark = mode === "dark" || (mode !== "light" && system.matches);
    document.querySelectorAll("[data-responsive-image]").forEach((host) => {
      if (host.closest(".environment") && document.querySelector("#content")?.dataset.backgroundActive !== "true") return;
      const data = JSON.parse(host.dataset.responsiveImage);
      const desktop = dark ? data.dark || data.src : data.src;
      const mobile = dark
        ? data.mobile_dark || data.mobile || data.dark || data.src
        : data.mobile || data.src;
      const candidate = compact.matches ? mobile : desktop;
      let state = states.get(host);
      if (!state) {
        state = {
          candidate: null,
          generation: 0,
          failures: new Set(),
          exhausted: new Set(),
        };
        states.set(host, state);
      }
      if (state.candidate === candidate) return;
      state.candidate = candidate;
      const generation = ++state.generation;
      host.hidden = false;
      delete host.dataset.failed;
      const masthead = host.classList.contains("masthead-media")
        ? host.closest(".site-masthead")
        : null;
      masthead?.classList.remove("media-failed");
      host.dispatchEvent(
        new Event("hypergraph:media-change", { bubbles: true }),
      );
      const picture = document.createElement("picture");
      const img = document.createElement("img");
      img.alt = data.alt || "";
      img.width = 1200;
      img.height = 800;
      img.loading = host.dataset.eager === "true" ? "eager" : "lazy";
      if (host.dataset.eager === "true") img.fetchPriority = "high";
      picture.append(img);
      const current = () => state.generation === generation && host.isConnected;
      const hide = () => {
        if (!current()) return;
        host.hidden = true;
        host.dataset.failed = "true";
        masthead?.classList.add("media-failed");
      };
      let fallback = state.failures.has(candidate);
      img.addEventListener("error", () => {
        if (!current()) return;
        if (!fallback && data.fallback && data.fallback !== candidate) {
          state.failures.add(candidate);
          fallback = true;
          img.src = data.fallback;
        } else {
          state.failures.add(candidate);
          state.exhausted.add(candidate);
          hide();
        }
      });
      // Set only the selected candidate: a failed source cannot remain selected by picture.
      if (!state.exhausted.has(candidate))
        img.src = fallback && data.fallback ? data.fallback : candidate;
      const previous = host.querySelector(":scope > picture");
      if (previous) previous.replaceWith(picture);
      else host.prepend(picture);
      if (state.exhausted.has(candidate) || (fallback && !data.fallback))
        hide();
    });
  }
  window.__hgImages = refresh;
  new MutationObserver(refresh).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  system.addEventListener("change", refresh);
  compact.addEventListener("change", refresh);
  refresh();
};
