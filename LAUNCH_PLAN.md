# RPThreadTracker v4 — Launch Plan

## Pre-Launch Features

- [x] **Maintenance mode** — `MAINTENANCE_MODE=true` env var; proxy.ts redirects pages to `/maintenance`, API routes return 503
- [ ] **Analytics** — lightweight usage tracking (Umami self-hosted or Azure Application Insights)
- [ ] **Logging** — structured console logging via Pino (or decide to skip and rely on App Service log stream)

## Pre-Beta Prep

- [ ] **Environment/config audit** — document all required env vars for production (Tumblr OAuth, Resend API key, NextAuth secret, DB connection string, etc.)
- [ ] **Production build test** — `npm run build` against real DB to catch build-time errors dev mode hides
- [ ] **Azure App Service setup** — Node.js App Service, configure startup command (`npm run build && npm start`), set Node.js version
- [ ] **DNS/TLS planning** — document how the domain flip will work so the maintenance window is short

## Beta

- [ ] **Deploy to Azure** for beta testing with existing users, pointed at the real database
  - Public views won't be testable during beta (DocumentDB hasn't been migrated yet)
- [ ] **Build and publish updated browser extension** (Chrome + Firefox, MV3) — can happen anytime, current published versions are broken
- [ ] **Record updated video walkthrough** for Help → Support Guides page (replace existing tutorials); draft script first

## Launch Cutover

- [ ] Put **current site** in maintenance mode
- [ ] **Migrate public views** from DocumentDB to SQL Server
- [ ] Put **new site** in maintenance mode
- [ ] **Flip domain** to point at new site
- [ ] Take new site **out of maintenance mode**
- [ ] Verify everything works
- [ ] Decommission old App Services (front + back) and DocumentDB when confident

## Hosting Notes

- Staying on **Azure** — existing infrastructure, DB locality, no cross-cloud latency
- **Azure App Service (Node.js)** is the target hosting model
- Current architecture: 2 App Services (React frontend + ASP.NET API) + Azure SQL + DocumentDB
- New architecture: 1 App Service (Next.js) + Azure SQL (same DB)
- Analytics: Umami (self-hosted, free) or Azure Application Insights (built into App Service)
- Logging: App Service Log Stream + structured console logging (skip database logging)
