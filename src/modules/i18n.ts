let messages: Record<string, string> | undefined;
export function t(key: string) {
  messages ??=
    JSON.parse(document.querySelector("#hg-config")?.textContent || "{}")
      .messages || {};
  return messages![key] || key;
}
