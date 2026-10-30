type Panel = {
  element: HTMLElement;
  close: (animate?: boolean) => void | Promise<void>;
  trigger?: HTMLElement;
};
let active: Panel | undefined;
let finishClosing: (() => void) | undefined;
// The covered page keeps its exact geometry, but need not repaint thousands of
// lines while a full-screen menu or search dialog makes it unavailable.
function reservePageGeometry() {
  if (
    document.body.classList.contains("panel-lock") ||
    document.querySelector("#search-dialog[open]")
  )
    return;
  const content = document.querySelector<HTMLElement>("#content");
  if (!content) return;
  const style = getComputedStyle(content);
  const height =
    content.clientHeight -
    parseFloat(style.paddingTop) -
    parseFloat(style.paddingBottom);
  content.style.setProperty("--covered-page-height", `${height}px`);
}
export function dismissPanels(restore = false) {
  const previous = active;
  active = undefined;
  const closing = previous?.close(restore);
  const restoreFocus = () => {
    if (restore && !active) {
      const target = previous?.trigger;
      // CSS visibility remains visible until the exit transition ends. A closed
      // mobile navigation is already semantically unavailable during that interval.
      const parentNav = target?.closest<HTMLElement>("#site-nav");
      const closedMobileNav =
        parentNav &&
        matchMedia("(max-width:1023px), (hover:none)").matches &&
        !parentNav.classList.contains("is-open");
      if (
        target?.isConnected &&
        !closedMobileNav &&
        target.getClientRects().length &&
        getComputedStyle(target).visibility !== "hidden"
      )
        target.focus();
      else {
        const menu = document.querySelector<HTMLElement>("[data-menu-toggle]");
        (menu?.getClientRects().length
          ? menu
          : document.querySelector<HTMLElement>(".brand")
        )?.focus();
      }
    }
  };
  if (closing) void closing.then(restoreFocus);
  else restoreFocus();
}
export function activatePanel(
  element: HTMLElement,
  close: (animate?: boolean) => void | Promise<void>,
  trigger?: HTMLElement,
) {
  finishClosing?.();
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
  reservePageGeometry();
  activatePanel(dialog, (animate) => {
    if (!dialog.open) return;
    if (
      !animate ||
      dialog.id !== "search-dialog" ||
      document.hidden ||
      document.documentElement.dataset.motion === "off" ||
      matchMedia("(prefers-reduced-motion:reduce)").matches
    ) {
      dialog.close();
      return;
    }
    return new Promise<void>((resolve) => {
      const animation = dialog.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-6px)" },
        ],
        { duration: 100, easing: "ease-out", fill: "forwards" },
      );
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (finishClosing === finish) finishClosing = undefined;
        if (dialog.open) dialog.close();
        animation.cancel();
        resolve();
      };
      finishClosing = finish;
      void animation.finished.then(finish, finish);
    });
  });
  dialog.addEventListener("close", () => releasePanel(dialog), { once: true });
  dialog.showModal();
}
export function mountShell(signal: AbortSignal) {
  const nav = document.querySelector<HTMLElement>("#site-nav")!;
  const header = document.querySelector<HTMLElement>(".site-header")!;
  const menu = document.querySelector<HTMLButtonElement>("[data-menu-toggle]")!;
  const rail = document.querySelector<HTMLAnchorElement>(".brand")!;
  const mq = matchMedia("(max-width:1023px), (hover:none)");
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)");
  let hovering = false;
  let suppressAuto = false;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;
  const clearLeave = () => {
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
  };
  const close = () => {
    clearLeave();
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
  const open = (trigger: HTMLElement, automatic = false) => {
    if (
      automatic &&
      (mq.matches || suppressAuto || (active && active.element !== nav))
    )
      return;
    clearLeave();
    if (mq.matches) reservePageGeometry();
    if (active?.element !== nav) activatePanel(nav, close, trigger);
    suppressAuto = false;
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
      nav.querySelector<HTMLElement>("a,summary")?.focus();
    } else header.classList.add("rail-open");
  };
  const maybeClose = () => {
    clearLeave();
    leaveTimer = setTimeout(() => {
      if (
        !hovering &&
        !header.contains(document.activeElement) &&
        active?.element === nav
      )
        dismissPanels();
    }, 160);
  };
  menu.addEventListener(
    "click",
    () => {
      if (active?.element === nav) releasePanel(nav);
      else open(menu);
    },
    { signal },
  );
  header.addEventListener(
    "pointerenter",
    (event) => {
      if (mq.matches || !finePointer.matches || event.pointerType === "touch")
        return;
      hovering = true;
      suppressAuto = false;
      open(rail, true);
    },
    { signal },
  );
  header.addEventListener(
    "pointerleave",
    () => {
      hovering = false;
      suppressAuto = false;
      maybeClose();
    },
    { signal },
  );
  header.addEventListener("focusin", () => open(rail, true), { signal });
  header.addEventListener(
    "focusout",
    (event) => {
      if (!header.contains(event.relatedTarget as Node | null)) {
        suppressAuto = false;
        maybeClose();
      }
    },
    { signal },
  );
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        !mq.matches &&
        active?.element === nav &&
        !header.contains(event.target as Node)
      )
        dismissPanels();
    },
    { signal },
  );
  finePointer.addEventListener(
    "change",
    () => {
      hovering = false;
      dismissPanels();
    },
    { signal },
  );
  nav.addEventListener(
    "click",
    (e) => {
      if (mq.matches && (e.target as Element).closest("a")) dismissPanels();
    },
    { signal },
  );
  mq.addEventListener("change", () => dismissPanels(), { signal });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && active) {
        e.preventDefault();
        suppressAuto = true;
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
  };
  const reconcile = () => {
    hovering = header.matches(":hover") && finePointer.matches;
    if (!mq.matches && (hovering || header.contains(document.activeElement)))
      open(rail, true);
  };
  header.addEventListener("pointermove", reconcile, { signal });
  document.addEventListener("hypergraph:intro-end", reconcile, { signal });
  document.addEventListener("hypergraph:mount", reconcile, { signal });
  reconcile();
  update();
  document.addEventListener("hypergraph:mount", update, { signal });
  signal.addEventListener(
    "abort",
    () => {
      clearLeave();
      dismissPanels();
    },
    { once: true },
  );
}
