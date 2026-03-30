# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This frontend lives alongside its backend at the same directory level:
```
roas-platform/
  ads-bakano-clients-frontapp/   ← this project (Vue 3)
  ads-bakano-clients-backapp/    ← backend (Node + Express + Mongoose)
```

For any full-stack feature, edit both projects in the same session. Backend structure: `src/{controllers,models,routes,services,middlewares}`. Staging API: `https://testing-storybrand-backapp.bakano.ec/api`.

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

### Brand Profile & AI Script Generator

Each workspace has an optional Brand Profile used to generate AI video scripts with Gemini.

**Brand Profile:**
- `GET/PATCH /api/workspaces/:id/brand-profile` — get/upsert
- `POST /api/workspaces/:id/brand-profile/files` — upload file to Gemini Files API (for multimodal context)
- `DELETE /api/workspaces/:id/brand-profile/files/:publicId`
- Frontend service: `brandProfileService` in `src/services/brandProfile.service.ts`
- Type: `BrandProfile` in `src/types/index.ts` (fields include `descripcion`, `tipoNegocio`, `vertical`, `trafficDirection`, `archivos[]`)

**AI Script Generator:**
- Endpoint: `POST /api/video-planning/:videoItemId/generate-script`
- Backend: `src/controllers/scriptGeneration.controller.ts` → `GeminiService` (`src/services/gemini.service.ts`)
- Uses `gemini-1.5-flash`. Required env var: `GEMINI_API_KEY` in **backend** `.env` only (not frontend).
- Returns `GuionIA`: `{ conceptoVisual, gancho, textoPantalla, cuerpo, cta, broll, generadoEn, contextoMes? }`
- `GeminiService.inferTipoGuion(numero)` maps item number → TOFU/MOFU/BOFU cycling

**Frontend panel (`ScriptGeneratorPanel.vue`):**
- Embedded in `VideoPlanningItemModal.vue` with `v-if="item && workspaceId"` — **only visible in edit mode** (existing item), never in "Nuevo video" (create) mode. This is intentional: needs item `_id` to save result.
- `VideoPlanningView.vue` loads brand profile on `onMounted` and passes `hasBrandProfile` + `brandProfile` as props to the modal.
- If `hasBrandProfile` is false (no `descripcion`), panel shows a "configure brand profile" warning.
- Optional monthly context: `productoMes`, `ofertaEspecial`, `referenciasAdicionales`

### Meetings (PM Calendar)

PM recurring performance meetings with clients (workspaces), every 25 days by default.

- `/app/meetings` → `PMCalendar` route (`requiresInternal: true`) — month calendar + agenda list toggle
- PM's clients = workspaces in their `user.workspaces[]` array
- "Complete" action: `lastMeetingDate = now`, `nextMeetingDate = now + intervalDays`
- Scheduling also accessible from `/app/clients` card per workspace

**Backend:** `POST/GET/PATCH /api/meetings` (internalOrSuperadmin middleware)
**Frontend files:**
- `src/services/meeting.service.ts` — `meetingService` singleton
- `src/views/meetings/MeetingsView.vue` — calendar + agenda

### Notifications

Persistent notification system replacing `SurveyPlanningNotification` banner in `AppLayout.vue`.

**Notification types:**
- `new_client_assigned` — when any internal user is assigned to a workspace
- `video_status_changed` — when a video item reaches `estadoPublicacion: PUBLICADO`
- `video_planning_resent` — when an existing planning doc is updated (re-sent to clients)

**Access:** Internal users get client-assignment notifications. Client (non-internal) users get video notifications.

- `/app/notifications` → `Notifications` route (all auth users) — list with read/unread, mark as read, delete
- Unread count badge shown in sidebar nav

**Backend:** `GET/PATCH/DELETE /api/notifications` (authMiddleware only)
**Frontend files:**
- `src/services/notification.service.ts` — `notificationService` singleton
- `src/stores/notification.ts` — `useNotificationStore` (unreadCount, fetchAll, markRead)
- `src/views/notifications/NotificationsView.vue` — notifications center
