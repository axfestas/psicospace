/**
 * The @cloudflare/workers-types package (pulled in transitively by
 * @cloudflare/next-on-pages) overrides the DOM Body.json() return type from
 * Promise<any> to Promise<unknown>.  The existing client-side code was written
 * against the standard DOM types where json() returns any, so we restore that
 * here to avoid having to add explicit casts in every fetch().json() call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Body {
  json(): Promise<any>;
}
