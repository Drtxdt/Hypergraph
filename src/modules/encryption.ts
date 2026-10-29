import { t } from "./i18n";
const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export function mount(
  root: HTMLElement,
  signal: AbortSignal,
  afterUnlock: () => void,
) {
  const animations = new Set<Animation>();
  const animate = async (element: HTMLElement, frames: Keyframe[], duration: number) => {
    if (signal.aborted || matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.dataset.motion === 'off') return;
    const animation = element.animate(frames, {duration, easing:'ease-out'});
    animations.add(animation);
    try { await animation.finished; } catch {} finally {animations.delete(animation);}
  };
  signal.addEventListener('abort', () => animations.forEach(a => a.cancel()), {once:true});
  root.querySelectorAll<HTMLFormElement>("[data-unlock]").forEach((form) => {
    const section = form.closest<HTMLElement>(".encrypted")!;
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    const keyInput = form.querySelector<HTMLInputElement>('input')!;
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'icon-button'; toggle.dataset.keyVisibility = '';
    const updateToggle = () => {
      const visible = keyInput.type === 'text';
      toggle.setAttribute('aria-pressed', String(visible));
      toggle.title = document.documentElement.lang.startsWith('en') ? (visible ? 'Hide protocol key' : 'Show protocol key') : (visible ? '隐藏协议密钥' : '显示协议密钥');
      toggle.setAttribute('aria-label', toggle.title);
      toggle.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12q10-14 20 0-10 14-20 0Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6"/>' + (visible ? '<path d="M3 3l18 18"/>' : '') + '</svg>';
    };
    updateToggle(); keyInput.closest('label')!.after(toggle);
    toggle.addEventListener('click', () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      updateToggle(); void animate(keyInput, [{opacity:.5},{opacity:1}], 180);
    }, {signal});
    keyInput.addEventListener('input', () => {delete form.dataset.state; keyInput.removeAttribute('aria-invalid'); form.querySelector('[role=status]')!.textContent = '';}, {signal});
    const payload = JSON.parse(
      section.querySelector("[data-cipher]")!.textContent!,
    );
    form.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        const input = form.querySelector("input")!,
          status = form.querySelector<HTMLElement>("[role=status]")!,
          button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
        if (button.disabled) return;
        button.disabled = true;
        form.dataset.state = "pending";
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
          form.dataset.state = 'success';
          status.textContent = document.documentElement.lang.startsWith('en') ? 'Protocol unlocked' : '协议已解锁';
          await animate(form, [{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],260);
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
          void animate(section.querySelector<HTMLElement>('[data-plaintext]')!, [{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],300);
        } catch {
          if (!signal.aborted) {
            status.textContent =
              t("密码错误或内容损坏 / Incorrect password or damaged content");
            form.dataset.state = 'error';
            input.setAttribute('aria-invalid','true');
            void animate(form, [{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(-3px)'},{transform:'translateX(0)'}],280);
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
