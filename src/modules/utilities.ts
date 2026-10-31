import { portalMessages } from "./portal-language";
export function mount(root: HTMLElement, signal: AbortSignal) {
  const host = root.querySelector<HTMLElement>("[data-utility]");
  if (!host) return;
  const input = host.querySelector<HTMLTextAreaElement>("#utility-input")!;
  const output = host.querySelector<HTMLTextAreaElement>("#utility-output")!;
  const status = host.querySelector<HTMLElement>("[role=status]")!;
  const copy = host.querySelector<HTMLButtonElement>("[data-copy-output]")!;
  const msg = portalMessages();
  let worker: Worker | undefined,
    version = 0,
    timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearTimeout(timer);
    worker?.terminate();
    worker = undefined;
  };
  const reset = () => {
    version++;
    stop();
    output.value = "";
    copy.disabled = true;
  };
  host
    .querySelectorAll<HTMLButtonElement>("[data-operation]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          reset();
          const id = version;
          const fail = () => {
            if (signal.aborted || id !== version) return;
            reset();
            status.textContent = msg.failed;
          };
          if (new TextEncoder().encode(input.value).byteLength > 1048576) {
            status.textContent = msg.limit;
            return;
          }
          status.textContent = msg.processing;
          try {
            const config = JSON.parse(
              document.querySelector("#hg-config")!.textContent!,
            );
            const url = new URL(config.workers.tools, location.href);
            if (url.origin !== location.origin)
              throw Error("Worker must be same-origin");
            worker = new Worker(url, { type: "module" });
            timer = setTimeout(fail, 10000);
            worker.onerror = (event) => {
              event.preventDefault();
              fail();
            };
            worker.onmessageerror = fail;
            worker.onmessage = ({ data }) => {
              if (signal.aborted || id !== version) return;
              if (
                !data ||
                data.id !== id ||
                (typeof data.output !== "string" &&
                  typeof data.error !== "string")
              ) {
                fail();
                return;
              }
              stop();
              if (data.error) status.textContent = msg.invalid + data.error;
              else {
                output.value =
                  data.output === "VALID_JSON" ? msg.valid : data.output;
                status.textContent = msg.done;
                copy.disabled = false;
              }
            };
            worker.postMessage({
              id,
              operation: button.dataset.operation,
              input: input.value,
            });
          } catch {
            fail();
          }
        },
        { signal },
      );
    });
  input.addEventListener(
    "input",
    () => {
      reset();
      status.textContent = "";
    },
    { signal },
  );
  host.querySelector("[data-clear]")!.addEventListener(
    "click",
    () => {
      reset();
      input.value = status.textContent = "";
      input.focus();
    },
    { signal },
  );
  copy.addEventListener(
    "click",
    async () => {
      const id = version;
      try {
        await navigator.clipboard.writeText(output.value);
        if (!signal.aborted && id === version) status.textContent = msg.copied;
      } catch {
        if (signal.aborted || id !== version) return;
        output.focus();
        output.select();
        status.textContent = msg.manualCopy;
      }
    },
    { signal },
  );
  signal.addEventListener("abort", reset, { once: true });
  host
    .querySelectorAll<HTMLButtonElement>("button")
    .forEach((button) => (button.disabled = button === copy));
}
