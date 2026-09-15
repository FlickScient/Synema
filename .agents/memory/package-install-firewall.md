---
name: Package install firewall
description: Environment-specific dependency installation constraint for imported Vite projects.
---

The Replit package firewall may block the older `tar` version pulled through Vercel build tooling, even when the app's Vite build does not use that package.

**Why:** An imported Vite project could not install its declared dependencies because the firewall rejected a transitive tar archive.

**How to apply:** For local build verification, install the app's declared runtime and Vite dependencies without the optional Vercel-only package, then restore the manifest and lockfile to their imported contents. Do not change application code to work around this.