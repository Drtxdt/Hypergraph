# Visual baselines

The initial Windows/Edge baseline is stored in its versioned directory. It covers home, article and archive at 1440×1000 and 390×844 in light/dark modes. Browser, OS, actual Chinese platform font and asset hashes are recorded in environment.json.

Run `node tools/verify-visual-baseline.mjs tests/visual-baselines/win32-edge-156.0.4314.50` after `npm run verify`. It compares images and never writes the baseline. A mismatched browser/OS requires a separate reviewed baseline. Inspect layout and text changes before replacing individual images; do not bulk-update to silence failures. Initial baseline creation is separate from a historical pixel-regression claim.
