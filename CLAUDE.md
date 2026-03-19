# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev           # Start dev server (Vite)
pnpm build         # Type-check + production build (vue-tsc --noEmit && vite build)
pnpm preview       # Preview production build
```

No test runner is configured in this project.

## Environment

Copy `.env.example` to `.env` and set:

```
VITE_API_BASE_URL=http://localhost:8100/api
```

The `APIBase` class in `src/services/httpBase.ts` reads this at runtime. All other env vars must be prefixed with `VITE_` to be exposed to the client.

## Architecture

**Stack:** Vue 3 + TypeScript + Vite + Pinia + Vue Router 4 + SCSS + Axios + Chart.js

### Layout / Routing

There are two layout shells in `src/layout/`:
- `PublicLayout.vue` — wraps unauthenticated routes (`/`, `/login`)
- `AppLayout.vue` — wraps all `/app/**` routes; requires `meta.requiresAuth: true`

Route guards in `src/router/index.ts` check `localStorage('access_token')` and decode the JWT payload to determine role-based redirects (`superadmin` → AdminWorkspaces, others → AppDashboard with their `workspaceId`).

Route meta flags:
- `requiresAuth` — redirects to login if no token
- `requiresRole: 'superadmin'` — role gate
- `requiresInternal` — internal staff gate

### Auth & Session

`src/stores/user.ts` (`useUserStore`) is the single source of truth for the current user. It persists all user fields to `localStorage` individually. On app boot (`main.ts`), `useUserStore().hydrate()` restores state from `localStorage` before any route guard fires.

When the backend returns a 401 on an authenticated request, `httpBase.ts` fires a `CustomEvent('auth:token-expired')` on `window` — listen for this to handle session expiry.

### Service Layer

All API calls go through class-based singletons that extend `APIBase` (`src/services/httpBase.ts`). Each service is exported as a singleton:

- `authService` — login
- `workspaceService` — workspace CRUD
- `metaService` — Meta Ads data
- `planningService` — planning entries
- `surveyService` — survey CRUD, send, fill, results (`src/services/survey.service.ts`)

`APIBase` sets a default 15s timeout on every request and automatically attaches the `Authorization` header when passed.

### Styles

SCSS is global. `src/styles/index.scss` is auto-imported into every component via Vite's `additionalData` config, so variables/mixins defined there are available everywhere without explicit imports. Global base styles live in `src/styles/global.scss`.

### Workspaces

The app is multi-tenant by `workspaceId`. Most `/app` routes include `:workspaceId` as a path param. The active workspace is stored in `useUserStore().workspaceId` and also in `localStorage('user_workspaceId')`.

Users can belong to multiple workspaces with per-workspace roles (`admin` | `colaborador`), stored in `useUserStore().workspaces`.

Internal staff (`isInternal: true`) have access to cross-workspace views like `InternalPlanningView` (`/app/planning`).

### Surveys

Full survey feature lives in `src/views/surveys/` and `src/components/surveys/`. See `src/types/survey.ts` for all types.

- Internal + superadmin: `/app/surveys` (list), `/app/surveys/new` (create), `/app/surveys/:id/edit` (edit)
- Superadmin only: `/app/surveys/:id/results`
- Any authenticated user (client): `/app/survey/:token` (fill), `/app/workspaces/:workspaceId/surveys` (my surveys)

The router `beforeEach` guard handles `?redirect=` so email links (`/app/survey/:token`) redirect correctly after login.

Survey question types: `short_text`, `long_text`, `multiple_choice`, `checkbox`, `rating`, `nps`, `yes_no`, `dropdown`, `date`, `image_question`.

#### Image question type (`image_question`)
Admin uploads a photo (e.g. employee) via Cloudinary. Respondent sees the image and answers yes/no. Upload goes through `POST /api/surveys/upload-image` (internal/superadmin only). Surveys also support an optional `coverImage` shown in the fill view header.

**Image upload flow:**
- Frontend: `surveyService.uploadImage(file)` → `POST surveys/upload-image` (multipart, field: `image`)
- Backend: multer memory storage → Cloudinary (`surveys/` folder) → returns `{ url: string }`
- Cloudinary credentials in backend `.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**New/modified files:**
- `src/components/surveys/ImageUploader.vue` — reusable drag-drop image uploader
- `src/components/surveys/builder/QuestionCard.vue` — handles `image_question` type with upload UI
- `src/components/surveys/QuestionRenderer.vue` — renders image + yes/no for `image_question`
- `src/components/surveys/builder/SurveyInfoForm.vue` — optional cover image upload
- `src/composables/surveys/useSurveyBuilder.ts` — `coverImage` state wired through save/load
