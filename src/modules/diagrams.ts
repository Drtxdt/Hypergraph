import { t } from "./i18n";
import { isDark, watchMode } from "./color-mode";
export async function mount(root: HTMLElement, signal: AbortSignal) {
  for (const element of root.querySelectorAll<HTMLElement>("[data-diagram]")) {
    if (element.dataset.mounted) continue;
    element.dataset.mounted = "true";
    const source = JSON.parse(
      element.querySelector("[data-source]")!.textContent!,
    );
    try {
      if (element.dataset.diagram === "mermaid") {
        const { default: mermaid } = await import("mermaid");
        if (signal.aborted) return;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark() ? "dark" : "neutral",
        });
        const result = await mermaid.render(
          "diagram-" + crypto.randomUUID(),
          source,
        );
        if (signal.aborted) return;
        element.querySelector("pre")!.innerHTML = result.svg;
        let svg = element.querySelector<SVGSVGElement>("pre svg")!;
        const controls = document.createElement("div");
        controls.className = "diagram-controls";
        let scale = 1;
        const icon = (path: string) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${path}"/></svg>`;
        const zoomButtons: HTMLButtonElement[] = [];
        const applyScale = () => {
          svg.style.width = scale * 100 + "%";
          svg.style.maxWidth = "none";
          svg.style.minWidth = "0";
          reset.textContent = Math.round(scale * 100) + "%";
          zoomButtons[0].disabled = scale <= 0.5;
          zoomButtons[1].disabled = scale >= 3;
        };
        for (const [path, delta] of [
          ["M5 12h14", -0.25],
          ["M5 12h14M12 5v14", 0.25],
        ] as const) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "icon-button";
          button.innerHTML = icon(path);
          const label = delta > 0 ? t("放大 / Zoom in") : t("缩小 / Zoom out");
          button.setAttribute("aria-label", label);
          button.title = label;
          button.addEventListener("click", () => {
            scale = Math.min(3, Math.max(0.5, scale + delta));
            applyScale();
          }, { signal });
          zoomButtons.push(button);
          controls.append(button);
        }
        const reset = document.createElement("button");
        reset.type = "button";
        reset.className = "diagram-scale";
        reset.setAttribute("aria-label", t("重置缩放 / Reset zoom"));
        reset.title = t("重置缩放 / Reset zoom");
        reset.addEventListener("click", () => { scale = 1; applyScale(); }, { signal });
        controls.append(reset);
        applyScale();
        const open = document.createElement("a");
        let url = URL.createObjectURL(
          new Blob([result.svg], { type: "image/svg+xml" }),
        );
        open.href = url;
        open.target = "_blank";
        open.rel = "noopener";
        open.className = "icon-button";
        open.innerHTML = icon("M14 3h7v7M21 3 11 13M10 5H4v15h15v-6");
        open.setAttribute("aria-label", t("打开 SVG / Open SVG"));
        open.title = t("打开 SVG / Open SVG");
        controls.append(open);
        element.prepend(controls);
        let revision = 0;
        watchMode(async (dark) => {
          const current = ++revision;
          mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "neutral" });
          try {
            const updated = await mermaid.render("diagram-" + crypto.randomUUID(), source);
            if (signal.aborted || current !== revision) return;
            element.querySelector("pre")!.innerHTML = updated.svg;
            svg = element.querySelector<SVGSVGElement>("pre svg")!;
            applyScale();
            URL.revokeObjectURL(url);
            url = URL.createObjectURL(new Blob([updated.svg], { type: "image/svg+xml" }));
            open.href = url;
          } catch { /* Preserve the last successfully rendered diagram. */ }
        }, signal);
        signal.addEventListener("abort", () => URL.revokeObjectURL(url), {
          once: true,
        });
      } else if (element.dataset.diagram === "chartjs") {
        const { default: Chart } = await import("chart.js/auto");
        if (signal.aborted) return;
        const canvas = document.createElement("canvas");
        element.querySelector("pre")!.replaceWith(canvas);
        const chart = new Chart(canvas, JSON.parse(source));
        const updateColors = (dark: boolean) => {
          chart.options.color = dark ? "#e6e8dd" : "#202421";
          chart.update("none");
        };
        updateColors(isDark());
        watchMode(updateColors, signal);
        signal.addEventListener("abort", () => chart.destroy(), { once: true });
      } else {
        const abc = await import("abcjs");
        if (signal.aborted) return;
        const target = document.createElement("div");
        element.querySelector("pre")!.replaceWith(target);
        const options = JSON.parse(
          element.querySelector("[data-options]")?.textContent || "{}",
        );
        abc.renderAbc(target, source, { responsive: "resize", ...options });
      }
    } catch {
      if (!signal.aborted)
        element.querySelector("[role=status]")!.textContent =
          t("无法渲染，保留原始内容 / Unable to render");
    }
  }
}
