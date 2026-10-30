import { t } from "./i18n";
import { openModal, releasePanel } from "./panels";
type Entry = { title: string; path: string; text: string; tags: string[] };
export function mount(
  root: string,
  signal: AbortSignal,
  external?: {
    enable: boolean;
    app_id: string;
    search_key: string;
    index: string;
  },
) {
  const dialog = document.querySelector<HTMLDialogElement>("#search-dialog")!;
  const input = dialog.querySelector<HTMLInputElement>("input")!;
  const results = dialog.querySelector<HTMLElement>("[data-results]")!;
  let entries: Entry[] | undefined;
  let pending: Promise<Entry[]> | undefined;
  const status = dialog.querySelector<HTMLElement>("[role=status]")!;
  let currentPage = 0,
    requestId = 0;
  const previous = document.createElement("button"),
    next = document.createElement("button");
  previous.textContent = "←";
  previous.setAttribute("aria-label", t("← Previous"));
  previous.title = t("← Previous");
  next.textContent = "→";
  next.setAttribute("aria-label", t("Next →"));
  next.title = t("Next →");
  previous.dataset.searchPagination = next.dataset.searchPagination = "";
  previous.hidden = next.hidden = true;
  const pagination = document.createElement("div");
  pagination.className = "search-pagination";
  pagination.append(previous, next);
  results.after(pagination);
  previous.addEventListener(
    "click",
    () => {
      currentPage = Math.max(0, currentPage - 1);
      void search();
    },
    { signal },
  );
  next.addEventListener(
    "click",
    () => {
      currentPage++;
      void search();
    },
    { signal },
  );
  async function search() {
    const id = ++requestId;
    const term = input.value.trim().toLocaleLowerCase();
    results.replaceChildren();
    previous.hidden = next.hidden = true;
    if (!term) {
      status.textContent = t("输入关键词 / Type to search");
      return;
    }
    try {
      status.textContent = t("Loading…");
      let matches: Entry[],
        total = 0;
      const pageSize = 10;
      if (external?.enable) {
        const response = await fetch(
          `https://${external.app_id}-dsn.algolia.net/1/indexes/${encodeURIComponent(external.index)}/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Algolia-Application-Id": external.app_id,
              "X-Algolia-API-Key": external.search_key,
            },
            body: JSON.stringify({
              query: term,
              hitsPerPage: pageSize,
              page: currentPage,
            }),
            signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
          },
        );
        if (!response.ok) throw Error("Search unavailable");
        const data = await response.json();
        matches = data.hits.map((hit: Record<string, any>) => ({
          title: hit.title || hit.hierarchy?.lvl1 || hit.hierarchy?.lvl0 || "",
          path: hit.url || hit.path || "",
          text: hit.text || hit.content || "",
          tags: [],
        }));
        total = data.nbHits ?? matches.length;
      } else {
        pending ??= fetch(root + "search.json", {
          signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
        })
          .then((r) => {
            if (!r.ok) throw Error();
            return r.json();
          })
          .catch((e) => {
            pending = undefined;
            throw e;
          });
        entries ??= await pending;
        const all = entries!.filter((e) =>
          (e.title + " " + e.text + " " + e.tags.join(" "))
            .toLocaleLowerCase()
            .includes(term),
        );
        total = all.length;
        matches = all.slice(
          currentPage * pageSize,
          (currentPage + 1) * pageSize,
        );
      }
      if (id !== requestId || term !== input.value.trim().toLocaleLowerCase())
        return;
      status.textContent = `${total} ${t("条结果 / results")} · ${currentPage + 1} / ${Math.max(1, Math.ceil(total / pageSize))}`;
      previous.hidden = currentPage === 0;
      next.hidden = (currentPage + 1) * pageSize >= total;
      for (const entry of matches) {
        const li = document.createElement("li"),
          a = document.createElement("a"),
          p = document.createElement("p");
        const url = new URL(
          /^https?:\/\//.test(entry.path)
            ? entry.path
            : root + entry.path.replace(/^\//, ""),
          location.origin,
        );
        if (!["http:", "https:"].includes(url.protocol)) continue;
        a.href = url.href;
        a.textContent = entry.title;
        const pos = entry.text.toLocaleLowerCase().indexOf(term);
        p.textContent = entry.text
          .replace(
            /&(quot|amp|lt|gt|nbsp|#39);/g,
            (_, entity: string) =>
              ({
                quot: '"',
                amp: "&",
                lt: "<",
                gt: ">",
                nbsp: " ",
                "#39": "'",
              })[entity] || "",
          )
          .slice(Math.max(0, pos - 35), Math.max(0, pos - 35) + 130);
        li.append(a, p);
        results.append(li);
      }
    } catch (e) {
      if (!signal.aborted && id === requestId)
        status.textContent = t(
          "加载失败，请重新输入以重试 / Retry by typing again",
        );
    }
  }
  document.querySelector("[data-search]")?.addEventListener(
    "click",
    () => {
      openModal(dialog);
      input.focus();
      if (!input.value.trim())
        status.textContent = t("输入关键词 / Type to search");
    },
    { signal },
  );
  dialog
    .querySelector("[data-close]")
    ?.addEventListener("click", () => releasePanel(dialog), { signal });
  dialog.addEventListener(
    "click",
    (e) => {
      if ((e.target as HTMLElement).closest("a")) releasePanel(dialog);
    },
    { signal },
  );
  input.addEventListener(
    "input",
    () => {
      currentPage = 0;
      previous.hidden = next.hidden = true;
      void search();
    },
    { signal },
  );
}
