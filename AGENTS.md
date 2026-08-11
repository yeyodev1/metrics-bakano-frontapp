# AGENTS.md — ads-bakano-clients-frontapp

Compact ramp-up guide for OpenCode sessions. If a fact is obvious from filenames or package.json, it's omitted.

## Project context

- Vue 3 + TypeScript + Vite + Pinia + Vue Router 4 + SCSS + Axios + Chart.js.
- This frontend is one half of a full-stack pair. Backend sibling lives at the same directory level:
  ```
  roas-platform/
    ads-bakano-clients-frontapp/   ← this repo
    ads-bakano-clients-backapp/    ← Node + Express + Mongoose
  ```
- For any full-stack feature, edit **both** repos in the same session. Backend structure: `src/{controllers,models,routes,services,middlewares}`.
- Staging API: `https://testing-storybrand-backapp.bakano.ec/api`.

## Commands

```bash
pnpm dev      # Vite dev server
pnpm build    # vue-tsc --noEmit && vite build (type-check is part of build)
pnpm preview  # Preview production build
```

- No test runner, no ESLint, no Prettier are configured. Verification = `pnpm build`.
- `.npmrc` sets `node-linker=hoisted`.

## Environment

- Copy `.env.example` → `.env` and set at minimum `VITE_API_BASE_URL=http://localhost:8100/api`.
- Only env vars prefixed with `VITE_` are exposed to the client.
- `src/services/httpBase.ts` reads `VITE_API_BASE_URL` at runtime and normalizes it to end in `/api`.

## Auth & session

- `useUserStore` (`src/stores/user.ts`) is the single source of truth; it persists user fields to `localStorage` individually.
- `main.ts` calls `useUserStore().hydrate()` **before** any route guard fires.
- On 401 for an authenticated request, `httpBase.ts` dispatches `CustomEvent('auth:token-expired')` on `window`.
- `App.vue` listens for that event, clears the store/localStorage, and redirects to login.
- Route guards in `src/router/index.ts` decode the JWT payload manually (no JWT library) to decide role-based redirects.

## Routing quirks

- Layout shells:
  - `PublicLayout.vue` — `/`, `/login`
  - `AppLayout.vue` — `/app/**`
  - `EditorLayout.vue` — `/editor/**` (isolated editor shell)
  - `OnboardingLayout.vue` — `/onboarding/:workspaceId`
- Route meta flags used: `requiresAuth`, `requiresRole: 'superadmin'`, `requiresInternal`.
- **Editor isolation:** users with `internalRole === 'editor'` are hard-redirected away from every route except `EditorDashboard`, `EditorVideoPlanning`, and `AuthLogin`.
- `AppLayout.vue` renders `<RouterView :key="$route.fullPath" />`, so `/app/**` views **remount on every navigation**. Components that fetch on mount must guard against infinite skeletons (check `monthData` truthiness, not just `loading`).

## Service layer

- All API calls go through class-based singletons extending `APIBase` (`src/services/httpBase.ts`).
- Each service is exported as a singleton instance: `authService`, `workspaceService`, `metaService`, `planningService`, `surveyService`, `brandProfileService`, `notificationService`, `meetingService`, `teamKpiService`, `visitLogService`, `branchService`, `salesSummary.service.ts`.
- Default request timeout is 15 s; some long calls (script generation) override it to 60 s.

## Styling

- SCSS is global. `src/styles/index.scss` is auto-injected into every component by Vite's `additionalData` config, so variables/mixins are available without explicit imports.
- `index.scss` uses `@forward` for `colorVariables.module.scss` and `fonts.module.scss`, plus custom `lighten`/`darken` helpers.
- **Do not use `@extend %placeholder` in Vue scoped `<style scoped lang="scss">`** — it causes Vite/Sass compilation errors. Use `@mixin` instead.
- Build layouts mobile-first: write the narrow-screen base styles first and add breakpoints only for wider screens.
- App views beside the sidebar must fill the available content area (`flex: 1; min-width: 0; width: 100%`); do not constrain them with arbitrary desktop widths.
- **Never use CSS Grid.** Use Flexbox for all layout and spacing behavior.
- Use only the palette and color variables defined in `src/styles/colorVariables.module.scss`; do not introduce ad-hoc color values in components.
- Every asynchronous UI state needs loading feedback: use a skeleton that mirrors the section for content loads, and a spinner only for small, isolated actions.

## Multi-tenancy

- The app is multi-tenant by `workspaceId`. Most `/app` routes include `:workspaceId`.
- Active workspace is stored in `useUserStore().workspaceId` and `localStorage('user_workspaceId')`.
- Users can belong to multiple workspaces with per-workspace roles (`admin` | `colaborador`).

## SEO / brand metadata

- When touching `index.html` or route titles, preserve the canonical + Open Graph relationship with `https://metrics.bakano.ec/`:
  ```html
  <link rel="canonical" href="https://metrics.bakano.ec/" />
  <meta property="og:url" content="https://metrics.bakano.ec/" />
  <meta property="og:site_name" content="Bakano Ads Analytics" />
  ```
- Route titles are already applied via `router.afterEach` reading `meta.title`. Dynamic route titles follow the existing `Bakano Ads: …` pattern.

## Build / deploy notes

- `vite.config.ts` has an inline `generateVersion` plugin that writes `public/version.json` (timestamp) on every build. Used by `AppUpdater.vue` for cache-busting.
- `vite.config.ts` sets `server.allowedHosts: ["testing-storybrand-frontend.bakano.ec"]`.
- TypeScript is project-referenced: `tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`. `tsconfig.app.json` extends `@vue/tsconfig/tsconfig.dom.json` and enables strict unused-local/parameter checks.

## Existing instruction files

- `CLAUDE.md` has detailed feature-level context (surveys, video planning, AI script generator, meetings, notifications, KPIs, Tumesero integration, branches). Read it before working on those features.
- `.cursorrules` and `llms.txt` restate the SEO rules above.
