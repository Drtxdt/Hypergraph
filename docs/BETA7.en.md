# beta.7: contours and local print reveal

The default masthead uses original static terrain contours and dotted folded planes. These assets are generated deterministically at build time and served from the site's origin. Mobile artwork is a cropped decorative layer without additional document height.

```yaml
appearance:
  contour: {enable: true, style: terrain, opacity: 0.18, scope: site}
  laser_print: true
home:
  masthead:
    artwork:
      enable: true
      image: {}
```

Choose `terrain` or `flow`, scope `site` or `home`. A custom SVG/transparent PNG uses the existing responsive object: `image: {src: /images/signature.png}` with optional mobile/dark/mobile_dark/fallback. Artwork always uses contain. Main masthead photography takes precedence. Disabling show_cover prevents custom image requests while the independent original geometry/contour switches remain available.

The 840ms local reveal overlaps the full-screen reveal. Text remains ordinary readable DOM. History restoration, theme changes, late modules/images, reduced motion and data saving preserve the finished static image. Subtle/off do not request the print module. Cross-origin artwork and photographs use an edge scan without reading pixels; SVG source is never injected.

Run `npm run verify:fast`, then `npm run verify`. Build a package with `npm run pack:theme`, and pass that exact tarball path and SHA-256 to `npm run verify:package -- <path> <sha256>`. Installation runs outside the repository. New screenshots remain candidates rather than automatically replacing approved baselines.

Hosting: generation also emits byte-equivalent HTML `.gz` sidecars, including only the public encrypted output for protected pages. Enable `gzip_static on; gzip_vary on;` with nginx, or equivalent CDN compression, and send `Content-Encoding: gzip`. Original HTML remains usable without compression; performance results apply to the documented negotiated-compression conditions.
