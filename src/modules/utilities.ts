import { portalMessages } from "./portal-language";
export function mount(root: HTMLElement, signal: AbortSignal) {
  const host = root.querySelector<HTMLElement>("[data-utility]");
  if (!host) return;
  const input = host.querySelector<HTMLTextAreaElement>("#utility-input")!,
    output = host.querySelector<HTMLTextAreaElement>("#utility-output")!,
    status = host.querySelector<HTMLElement>("[role=status]")!;
  const msg = portalMessages();
  let worker: Worker | undefined,
    version = 0;
  const reset = () => {
    version++;
    worker?.terminate();
    worker = undefined;
  };
  host
    .querySelectorAll<HTMLButtonElement>("[data-operation]")
    .forEach((button) =>
      button.addEventListener(
        "click",
        () => {
          reset();
          const id = version;
          if (new TextEncoder().encode(input.value).byteLength > 1048576) {
            status.textContent = msg.limit;
            return;
          }
          status.textContent = msg.processing;
          worker = new Worker(new URL("./tool-worker.ts", import.meta.url), {
            type: "module",
          });
          worker.onmessage = ({ data }) => {
            if (signal.aborted || data.id !== version) return;
            if (data.error) {
              status.textContent = msg.invalid + data.error;
            } else {
              output.value =
                data.output === "VALID_JSON" ? msg.valid : data.output;
              status.textContent = msg.done;
            }
            worker?.terminate();
            worker = undefined;
          };
          worker.onerror = () => {
            status.textContent = msg.failed;
            reset();
          };
          worker.postMessage({
            id,
            operation: button.dataset.operation,
            input: input.value,
          });
        },
        { signal },
      ),
    );
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
      input.value = output.value = status.textContent = "";
      input.focus();
    },
    { signal },
  );
  host.querySelector("[data-copy-output]")!.addEventListener(
    "click",
    async () => {
      try {
        await navigator.clipboard.writeText(output.value);
        if (!signal.aborted) status.textContent = msg.copied;
      } catch {
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
    .forEach((button) => (button.disabled = false));
}
