import { init } from "twikoo";
const config = JSON.parse(document.querySelector("#settings")!.textContent!);
void init({ ...config, el: "#comments" }).catch(() => {
  document.querySelector("#comments")!.textContent =
    document.documentElement.lang === "zh-CN"
      ? "评论暂时不可用"
      : "Comments unavailable";
});
