export function calculate(operation: string, input: string): string {
  if (new TextEncoder().encode(input).byteLength > 1048576)
    throw Error("LIMIT");
  if (operation === "format") return JSON.stringify(JSON.parse(input), null, 2);
  if (operation === "minify") return JSON.stringify(JSON.parse(input));
  if (operation === "validate") {
    JSON.parse(input);
    return "VALID_JSON";
  }
  if (operation === "count")
    return JSON.stringify(
      {
        characters: [...input].length,
        nonWhitespace: [...input.replace(/\s/gu, "")].length,
        lines: input ? input.split(/\r\n|\r|\n/).length : 0,
        chinese: (input.match(/\p{Script=Han}/gu) || []).length,
        englishWords: (input.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [])
          .length,
      },
      null,
      2,
    );
  if (operation === "url_encode") return encodeURIComponent(input);
  if (operation === "url_decode") return decodeURIComponent(input);
  if (operation === "base64_encode") {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  if (operation === "base64_decode") {
    const binary = atob(input);
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (c) => c.charCodeAt(0)),
    );
  }
  throw Error("UNKNOWN_OPERATION");
}
