import { Converter } from "opencc-js";
const convert = Converter({ from: "cn", to: "tw" });
const original = new WeakMap<Node, string>();
let traditional = false;
export function refresh() {
  const walker = document.createTreeWalker(
    document.querySelector("#content")!,
    NodeFilter.SHOW_TEXT,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (
      node.parentElement?.closest(
        "pre,code,script,style,textarea,.katex,mjx-container,[data-comments]",
      )
    )
      continue;
    if (!original.has(node)) original.set(node, node.textContent || "");
    node.textContent = traditional
      ? convert(original.get(node)!)
      : original.get(node)!;
  }
}
export function toggle() {
  traditional = !traditional;
  refresh();
}
