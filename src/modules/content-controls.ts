export function mount(root: HTMLElement, signal: AbortSignal) {
  for (const spoiler of root.querySelectorAll<HTMLElement>(".spoiler")) {
    if (spoiler.dataset.bound) continue;
    spoiler.dataset.bound = "true";
    const toggle = () => {
      const expanded = spoiler.getAttribute("aria-expanded") !== "true";
      spoiler.setAttribute("aria-expanded", String(expanded));
      spoiler.querySelector<HTMLElement>(".spoiler-label")!.hidden = expanded;
      spoiler.querySelector<HTMLElement>(".spoiler-content")!.hidden =
        !expanded;
    };
    spoiler.addEventListener("click", toggle, { signal });
    spoiler.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      },
      { signal },
    );
  }
  for (const group of root.querySelectorAll<HTMLElement>(".content-tabs")) {
    if (group.dataset.bound) continue;
    group.dataset.bound = "true";
    const panels = [
      ...group.querySelectorAll<HTMLDetailsElement>(":scope > details"),
    ];
    if (!panels.length) continue;
    const nav = document.createElement("div");
    nav.className = "tab-list";
    nav.setAttribute("role", "tablist");
    const buttons: HTMLButtonElement[] = [];
    const select = (index: number) => {
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
        buttons[i].setAttribute("aria-selected", String(i === index));
        buttons[i].tabIndex = i === index ? 0 : -1;
      });
    };
    panels.forEach((panel, index) => {
      const label = panel.querySelector("summary")!;
      const button = document.createElement("button");
      button.textContent = label.textContent;
      button.id = "tab-" + crypto.randomUUID();
      panel.id = "panel-" + crypto.randomUUID();
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", button.id);
      panel.open = true;
      label.hidden = true;
      buttons.push(button);
      nav.append(button);
      button.addEventListener("click", () => select(index), { signal });
      button.addEventListener(
        "keydown",
        (e) => {
          let target = index;
          if (e.key === "ArrowRight") target = (index + 1) % panels.length;
          else if (e.key === "ArrowLeft")
            target = (index + panels.length - 1) % panels.length;
          else if (e.key === "Home") target = 0;
          else if (e.key === "End") target = panels.length - 1;
          else return;
          e.preventDefault();
          select(target);
          buttons[target].focus();
        },
        { signal },
      );
    });
    group.prepend(nav);
    select(0);
  }
}
