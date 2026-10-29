import { t } from "./i18n";
const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export function mount(
  root: HTMLElement,
  signal: AbortSignal,
  afterUnlock: () => void,
) {
  root.querySelectorAll<HTMLFormElement>("[data-unlock]").forEach((form) => {
    const section = form.closest<HTMLElement>(".encrypted")!;
    const payload = JSON.parse(
      section.querySelector("[data-cipher]")!.textContent!,
    );
    form.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        const input = form.querySelector("input")!,
          status = form.querySelector<HTMLElement>("[role=status]")!,
          button = form.querySelector("button")!;
        button.disabled = true;
        status.textContent = "…";
        try {
          const material = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(input.value),
            "PBKDF2",
            false,
            ["deriveKey"],
          );
          const key = await crypto.subtle.deriveKey(
            {
              name: "PBKDF2",
              salt: bytes(payload.salt),
              iterations: payload.iterations,
              hash: "SHA-256",
            },
            material,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"],
          );
          const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: bytes(payload.iv) },
            key,
            bytes(payload.data),
          );
          if (signal.aborted) return;
          section.querySelector("[data-plaintext]")!.innerHTML =
            new TextDecoder().decode(plain);
          input.value = "";
          form.remove();
          const toc = root.querySelector(".toc-panel details");
          if (toc) {
            const list = document.createElement("ol");
            list.className = "toc";
            section
              .querySelectorAll<HTMLElement>("h2[id],h3[id]")
              .forEach((heading) => {
                const li = document.createElement("li"),
                  a = document.createElement("a");
                a.href = "#" + encodeURIComponent(heading.id);
                a.textContent = heading.textContent;
                li.append(a);
                list.append(li);
              });
            toc.querySelector("ol")?.remove();
            toc.append(list);
          }
          afterUnlock();
        } catch {
          if (!signal.aborted) {
            status.textContent =
              t("密码错误或内容损坏 / Incorrect password or damaged content");
            input.select();
          }
        } finally {
          button.disabled = false;
        }
      },
      { signal },
    );
  });
}
