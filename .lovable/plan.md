

## Problem

The `public/` directory contains a full duplicate of the project (likely from the remix process). It includes:
- `public/src/` — duplicate source code with diverged files
- `public/package.json`, `public/vite.config.ts` — duplicate configs
- `public/.env` — with **different** Supabase credentials (pointing to old project)
- `public/bun.lock`, `public/tsconfig.json`, etc.

The actual static assets (favicon, fonts, og-image, etc.) are nested inside `public/public/`.

**Note:** The preview currently appears functional — network requests succeed and no runtime errors are detected. If you're seeing a specific error, please describe it so I can target the exact issue.

## Plan

### Step 1 — Move real static assets up
Move the legitimate static assets from `public/public/` (fonts, favicon.ico, manifest.json, og-image.png, placeholder.svg, robots.txt, sitemap.xml) to `public/`.

### Step 2 — Delete duplicate project files from `public/`
Remove all non-static-asset files and directories from `public/`:
- `public/src/`
- `public/supabase/`
- `public/.lovable/`
- `public/package.json`, `public/package-lock.json`
- `public/vite.config.ts`, `public/vitest.config.ts`
- `public/tsconfig.json`, `public/tsconfig.app.json`, `public/tsconfig.node.json`
- `public/tailwind.config.ts`, `public/postcss.config.js`
- `public/eslint.config.js`, `public/components.json`
- `public/.env`, `public/.gitignore`, `public/.gitattributes`
- `public/bun.lock`, `public/bun.lockb`
- `public/index.html`, `public/README.md`
- `public/.prewarm`, `public/playwright-fixture.ts`, `public/playwright.config.ts`
- `public/public/` (after assets moved)

### Step 3 — Verify build
Confirm the app builds and renders correctly with the cleaned `public/` directory.

## Technical details
- Vite serves everything in `public/` as static assets at the root URL
- The duplicate `.env` has credentials for a different backend project, which could cause subtle issues if accidentally imported
- The duplicate `vite.config.ts` in `public/` is inert but adds confusion
- ~50+ files will be removed; no functional code changes needed

