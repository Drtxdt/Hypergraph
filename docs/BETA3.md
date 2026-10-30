# 2.1.0-beta.3

This release stabilizes the reading layout after the beta.2 review. It retains the Endfield-inspired visual direction and existing feature configuration.

- Ordinary `layout: page` content uses a centered 42rem reading column. Post end controls and comments share the article axis.
- Desktop and mobile outlines are rendered in place. Unlocking refreshes both lists without remounting panel listeners. The mobile outline has its own close control.
- Sharing exposes system share, copy link and an expandable list of configured platforms. Bilibili and Instagram continue to copy the URL for manual sharing; they do not pretend to publish posts.
- The entrance default is now `appearance.intro: always`, restricted to the first homepage by `intro_scope: home`. Full loads and refreshes replay it. History restoration, deep anchors, reduced motion and data saving bypass it. Explicit `intro: session` preserves the former session behavior; `off` disables it.
- Entrance progress describes the animation, including the one-second pause at 60%, not download completion. The readability deadline can end the animation early.

## Verification

Run `npm ci`, install the Playwright browser for your platform, then `npm run verify`. Public fixtures are generated in a temporary workspace; the report and screenshots are written to `.local/verification`. `npm run verify:compat` checks the configured Node and Hexo versions and root/subdirectory installs.

The performance suite records at least five seconds without input before interaction testing. Reports include layout-shift source rectangles, LCP, first readable time, resource sizes, browser, runtime and commit information. Existing historical beta.1/beta.2 reports are not evidence for this release. CI artifacts contain the results for the actual tested commit.

No production blog migration, hosted-service deployment, release publication or PR merge is part of this change. Local SQLite Waline checks do not certify a user's external comment service. Browser-generated screenshots and motion recordings complement, rather than replace, visual inspection.
