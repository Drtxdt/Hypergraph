type Panel = { element: HTMLElement; close: () => void; trigger?: HTMLElement };
let active: Panel | undefined;
export function dismissPanels(restore = false) {
  const previous = active;
  active = undefined;
  previous?.close();
  if (restore) {
    const target = previous?.trigger;
    if (target?.isConnected && target.getClientRects().length) target.focus();
    else {
      const menu = document.querySelector<HTMLElement>("[data-menu-toggle]");
      (menu?.getClientRects().length
        ? menu
        : document.querySelector<HTMLElement>(".brand")
      )?.focus();
    }
  }
}
export function activatePanel(
  element: HTMLElement,
  close: () => void,
  trigger?: HTMLElement,
) {
  const origin = trigger || (document.activeElement as HTMLElement);
  dismissPanels();
  active = {
    element,
    close,
    trigger: origin,
  };
}
export function releasePanel(element: HTMLElement) {
  if (active?.element === element) dismissPanels(true);
}
export function openModal(dialog: HTMLDialogElement) {
  if (dialog.open) return;
  activatePanel(dialog, () => {
    if (dialog.open) dialog.close();
  });
  dialog.addEventListener("close", () => releasePanel(dialog), { once: true });
  dialog.showModal();
}
export function mountShell(signal: AbortSignal) {
  const nav = document.querySelector<HTMLElement>("#site-nav")!;
  const header = document.querySelector<HTMLElement>(".site-header")!;
  const menu = document.querySelector<HTMLButtonElement>("[data-menu-toggle]")!;
  const rail = document.querySelector<HTMLButtonElement>("[data-rail-expand]")!;
  const mq = matchMedia("(max-width:1023px)");
  const close = () => {
    nav.classList.remove("is-open");
    header.classList.remove("rail-open");
    menu.setAttribute("aria-expanded", "false");
    rail.setAttribute("aria-expanded", "false");
    document
      .querySelectorAll<HTMLElement>("[data-shell-inert]")
      .forEach((el) => {
        el.inert = false;
        delete el.dataset.shellInert;
      });
    document.body.classList.remove("panel-lock");
  };
  const open = (trigger: HTMLButtonElement) => {
    if (trigger.getAttribute("aria-expanded") === "true") {
      releasePanel(nav);
      return;
    }
    activatePanel(nav, close, trigger);
    trigger.setAttribute("aria-expanded", "true");
    if (mq.matches) {
      nav.classList.add("is-open");
      document.body.classList.add("panel-lock");
      document
        .querySelectorAll<HTMLElement>("#content,.site-footer")
        .forEach((el) => {
          if (!el.inert) {
            el.inert = true;
            el.dataset.shellInert = "";
          }
        });
    } else header.classList.add("rail-open");
    nav.querySelector<HTMLElement>("a,summary")?.focus();
  };
  menu.addEventListener("click", () => open(menu), { signal });
  rail.addEventListener("click", () => open(rail), { signal });
  nav.addEventListener(
    "click",
    (e) => {
      if ((e.target as Element).closest("a")) dismissPanels();
    },
    { signal },
  );
  mq.addEventListener("change", () => dismissPanels(), { signal });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && active) {
        e.preventDefault();
        dismissPanels(true);
        return;
      }
      if (e.key !== "Tab" || !active) return;
      if (active.element === nav && !mq.matches) return;
      const nodes = [
        ...(active.element === nav ? [menu] : []),
        ...Array.from(
          active.element.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])',
          ),
        ),
      ].filter(
        (el) =>
          el.getClientRects().length &&
          getComputedStyle(el).visibility !== "hidden",
      );
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      if (!nodes.includes(document.activeElement as HTMLElement)) {
        e.preventDefault();
        nodes[0].focus();
        return;
      }
      if (e.shiftKey && document.activeElement === nodes[0]) {
        e.preventDefault();
        nodes.at(-1)?.focus();
      } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
        e.preventDefault();
        nodes[0].focus();
      }
    },
    { signal },
  );
  const update = () => {
    nav.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
      if (link.pathname === location.pathname)
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    const toc =
      document.querySelector<HTMLDetailsElement>(".toc-panel details");
    if (toc) toc.open = !mq.matches;
  };
  update();
  document.addEventListener("hypergraph:mount", update, { signal });
  signal.addEventListener("abort", () => dismissPanels(), { once: true });
}
