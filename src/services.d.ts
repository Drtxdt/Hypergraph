declare module "abcjs" {
  export function renderAbc(
    target: HTMLElement,
    source: string,
    options: Record<string, unknown>,
  ): unknown;
}
declare module "twikoo" {
  export function init(options: Record<string, unknown>): Promise<unknown>;
}
declare module "*.css";
declare module "@waline/client/style";
declare module "valine" {
  export default class Valine {
    constructor(options: Record<string, unknown>);
  }
}
declare module "disqusjs/browser" {
  export default class DisqusJS {
    constructor(options: Record<string, unknown>);
    render(element: HTMLElement): void;
  }
}
