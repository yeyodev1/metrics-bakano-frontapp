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
- Uses `gemini-2.5-flash` (current stable). Required env var: `GEMINI_API_KEY` in **backend** `.env` only (not frontend).
- Returns `GuionIA`: `{ conceptoVisual, gancho, textoPantalla, cuerpo, cta, broll, generadoEn, contextoMes? }`
- `GeminiService.inferTipoGuion(numero)` maps item number → TOFU/MOFU/BOFU cycling
- LLM health check: `GET /api/video-planning/llm-status` — uses `countTokens("health check")` as lightweight ping

**Frontend panel (`ScriptGeneratorPanel.vue`):**
- Embedded in `VideoPlanningItemModal.vue` with `v-if="item && workspaceId"` — **only visible in edit mode** (existing item), never in "Nuevo video" (create) mode. This is intentional: needs item `_id` to save result.
- `VideoPlanningView.vue` loads brand profile on `onMounted` and passes `hasBrandProfile` + `brandProfile` as props to the modal.
- If `hasBrandProfile` is false (no `descripcion`), panel shows a "configure brand profile" warning.
- Generate button disabled when LLM unavailable (checked via `brandProfileService.getLLMStatus()` on mount).
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

### Video Planning — Upload, Scheduling & Social Media

#### Media Upload (VideoCompletedModal)
When a video item reaches `edicion = EDITADO`, `VideoCompletedModal.vue` opens and allows:
- **Drag & drop upload** → `planningService.uploadItemMedia(itemId, file)` → `POST /api/video-planning/items/:itemId/upload-media` → Cloudinary (`video-planning/items/:id/` folder) → returns `{ url, mediaType }`
- **Date + time** inputs side by side. Time is in **Ecuador timezone (UTC-5, no DST)**. Helpers `utcIsoToEcuador()` / `ecuadorToUtcIso()` handle conversion. Stored as UTC in MongoDB.
- **Cloudinary cleanup**: when items deleted (PUT replace) or files replaced (new upload), `cloudinary.uploader.destroy()` is called automatically.

#### Social Media Scheduling
When user selects a platform + saves in the modal, `publishToInstagram` / `publishToFacebook` flags are sent in the PATCH body. Backend (`videoPlanning.service.ts`) handles scheduling after the item save.

- **Facebook (ACTIVE):** `metaService.scheduleFacebookPost()` → `POST /{pageId}/videos` or `/photos`. Requires `pageAccessToken` with `pages_manage_posts`.
- **Instagram (DISABLED):** Pending Meta App Review for `instagram_content_publish`. Code is commented in `videoPlanning.service.ts`. Frontend shows "Próximamente" badge.
- Validation: min 10 min / max 75 days from now — enforced on both frontend and backend.
- Result stored on item: `fbPostId` / `fbScheduleStatus` / `fbScheduleError` (and ig* equivalents for future use).
- Meta OAuth scopes (in `src/composables/useMetaAds.ts`): `pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish, ads_read, business_management`.
- To re-enable Instagram: uncomment block in `videoPlanning.service.ts` after Meta App Review approved.

#### Brand Profile (locked-by-default UX)
`WorkspaceBrandProfileView.vue` — fields are **disabled by default**. "Editar" button (top-right) toggles edit mode. "Cancelar" + "Guardar" appear grouped. Cancel restores from snapshot. All 10 fields saved by PATCH including `publicoObjetivo`, `propuestaValor`, `tono`, `productosServicios`, `problemaResuelto`.

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

### Team KPIs

Monthly performance evaluation per internal role. Route: `/app/kpis` (`requiresInternal: true`).

**Roles tracked:** `editor`, `asistente_produccion`/`productor`, `content_manager`/`community_manager`
**Write permissions:** `superadmin`, `editor`, `director` (via `kpiWrite.middleware.ts`)

**Backend:**
- Model: `src/models/teamKpiRecord.model.ts` — unique index `{ userId, month }`
- Controller: `src/controllers/teamKpi.controller.ts` — `computePerformance()` calculates score 0–100 by roleType
- Router: `src/routes/teamKpi.router.ts` → `/api/team-kpis`

**Frontend:**
- `src/views/kpis/TeamKpisView.vue` — month navigator, 3 tabs, user cards with score badges
- `src/components/kpi/KpiEditorForm.vue`, `KpiProducerForm.vue`, `KpiContentForm.vue`
- `src/services/teamKpi.service.ts`

### Visit Log (attendance tracking)

Producers/assistants log individual client visits with attendees list. PM can see all.

**Backend:**
- Model: `src/models/visitLog.model.ts` — fields: `producerId`, `workspaceId`, `visitDate`, `attendees[]`, `month`, `notes`
- Controller: `src/controllers/visitLog.controller.ts`
- Router: `src/routes/visitLog.router.ts` → `/api/visit-logs`
- Access: create = any internal (producerId from JWT); delete = creator or superadmin

**Frontend:**
- `src/services/visitLog.service.ts`
- `src/components/kpi/VisitLogModal.vue` — workspace picker, date, multi-select attendees, notes
- Integrated in `TeamKpisView.vue` producer tab: "Registrar visita" button + expandable per-user log panel

### Brand Profile — Tono personalizado

`WorkspaceBrandProfileView.vue` tono field supports both preset chips and free-text custom tone.
- Presets: `['Profesional', 'Cercano', 'Divertido', 'Aspiracional', 'Educativo', 'Inspirador']`
- `+ Otro` button (dashed border) reveals a text input (max 80 chars) for custom tone
- `isCustomTone` computed: `profile.tono` is non-empty and not in presets
- Read mode shows custom tone as a purple chip (`bp__tone-custom-display`); edit mode shows input
- `PRESET_TONES` constant defined in script for reuse

### AI Script Generator — Few-shot prompting

`src/services/gemini.service.ts` `SYSTEM_PROMPT` now includes:
- 5 explicit specificity rules (use brand data, emotional hooks, real numbers, keyword CTAs)
- 12 high-quality reference examples (Helen Bermeo tax scripts + ROLKI bakery real scripts) covering TOFU/MOFU/BOFU for services and physical product niches
- User prompt updated to explicitly instruct using brand profile data and avoiding generic language

### AI Script Generator — TOFU/MOFU/BOFU Distribution Tracker

Target distribution per planning: **10 TOFU · 5 MOFU · 5 BOFU = 20 videos**.

**How it works:**
- `tipoGuion` (TOFU/MOFU/BOFU) is selected by the user in `ScriptGeneratorPanel.vue` via an interactive 3-button selector with tooltips
- It is passed as override to both `generateScript` and `generateScriptQuick` endpoints
- `tipoGuion` is saved to the `VideoItem` when the form is saved (not during generation)
- The distribution is tracked reactively from `planning.items` array (counts items with `tipoGuion` set and `_id` present)

**New/modified files:**
- `src/components/videoPlanning/ScriptDistributionWidget.vue` — reusable counter showing TOFU/MOFU/BOFU progress (full mode in view, compact mode in panel)
- `src/components/videoPlanning/ScriptGeneratorPanel.vue` — replaced read-only banner with interactive selector; emits `update:tipoGuion`; accepts `allItems` prop
- `src/components/videoPlanning/VideoPlanningItemModal.vue` — adds `tipoGuion` to form, wires emit from panel, passes `allItems`; includes `ScriptDistributionWidget` compact
- `src/views/videoPlanning/VideoPlanningView.vue` — shows `ScriptDistributionWidget` full mode after stats; passes `allItems` to modal
- Backend `tipoGuion` override: `scriptGeneration.controller.ts` accepts override in both endpoints; `videoPlanning.service.ts` adds `tipoGuion` to `MUTABLE_FIELDS`
- Timeout fix: both `generateScript` and `generateScriptQuick` now use `timeout: 60000`

### Client Booking Modal (Agendar Reunión)

Clients (non-internal, non-superadmin) see an "Agendar Reunión" button in the sidebar that opens a two-step booking modal.

**Step 1 — Expert selection screen:**
- Two card options with clear descriptions of topics to avoid wrong bookings
- **Denisse** (Meta Ads expert): Facebook/Instagram ads, campaign strategy, creatives → GoHighLevel: `https://api.leadconnectorhq.com/widget/bookings/bakano-tech-supportf7tixz`
- **Diego Reyes** (Tech director): Technology, CRM, metrics.bakano.ec, integrations → GoHighLevel: `https://api.leadconnectorhq.com/widget/booking/oOlLR0GxtmjAxyMaKesw`
- Yellow warning alert urges clients to pick the right expert before booking

**Step 2 — Calendar embed:**
- Inline `<iframe>` of the GoHighLevel booking widget
- Colored warning banner reiterating what topics belong to this expert

**Files:**
- `src/components/common/BookingModal.vue` — self-contained modal with selection + iframe embed
- `src/layout/AppLayout.vue` — `isBookingModalOpen` ref, booking button (client-only, green accent), `<BookingModal>` mounted at root

### Tumesero WhatsApp Sales Integration (Boloncity only)

Daily sync of WhatsApp ordering sessions from the Tumesero/Kuikers API for Boloncity (`workspaceId: 69bdadc67386136fc3682734`). Data shown inside the billing view (`/app/workspaces/:workspaceId/billing`) below the ROAS section.

**API:**
- `GET https://www.tumesero.com/api_sesiones_kuikers.php?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&token=TOKEN`
- Token: en el `.env` del backend como `TUMESERO_TOKEN` (no se versiona) (expires 2026-07-31)
- Rate limits: 6 req/hour · 50 req/day (tracked in `TumeseroUsage` MongoDB collection)
- Hard cap: 100 records per call → use single-day range (`desde=today&hasta=today`)
- `estado_funnel`: `CON_ORDEN` (sale) | `SIN_ORDEN` (no sale). Revenue fields: `subtotal_neto` (food), `costo_delivery`, `subtotal_desc` (total)

**Cron:** Runs daily at **11PM Ecuador = 04:00 UTC** via `node-cron` in backend `src/crons/tumesero.cron.ts`

**Backend files:**
- `src/models/salesDailySummary.model.ts` — aggregated daily: totalSessions, totalOrders, conversionRate, totalRevenue, totalBilled, byStore[]
- `src/models/tumeseroUsage.model.ts` — daily API call counter (enforces 50/day limit)
- `src/services/tumesero.service.ts` — `fetchSessions()`, `syncDailyData()`, `getMonthSummary()`, `getApiUsage()`
- `src/controllers/salesSummary.controller.ts` — `getMonthSummary`, `triggerManualSync`, `getApiUsage`
- `src/routes/salesSummary.router.ts` → `/api/sales-summary/:workspaceId/{month|api-usage|sync}`

**Frontend files:**
- `src/services/salesSummary.service.ts` — `getMonthData()`, `triggerSync()`, `getApiUsage()`
- `src/components/billing/SalesDashboardSection.vue` — full dashboard: KPI cards, bar chart, store breakdown table, day detail list, API usage pill, manual sync button
- `src/views/billing/BillingRoasView.vue` — renders `<SalesDashboardSection>` only when `workspaceId === '69bdadc67386136fc3682734'`

### Branches (Sucursales)

Physical locations per workspace. Used to break down billing entries by sede.

**Backend:** `GET/POST /api/workspaces/:id/branches`, `PUT /api/workspaces/:id/branches/:branchId`, `DELETE /api/workspaces/:id/branches/:branchId`

**Frontend service:** `branchService` in `src/services/branch.service.ts`
- `IBranch { _id, workspaceId, name, isActive, createdAt, updatedAt }`
- `createBranch(workspaceId, { name })` — backend defaults `isActive: true`
- `updateBranch(workspaceId, branchId, { name, isActive? })` — supports toggle
- `deleteBranch(workspaceId, branchId)`

**Billing integration:** `IBillingBranchEntry { branchId, name, amount }` is embedded in each `IDailyBillingEntry.branches[]`. Never fetch branches separately in `BillingRoasView` — names and amounts are already in `monthData.days[].entries[].branches[]`.

**Frontend files:**
- `src/views/branches/WorkspaceBranchesView.vue` — 8-color palette, per-branch color bar/avatar, toggle active/inactive button, stats bar with billing link
- `src/components/branches/BranchFormModal.vue` — name-only modal (`{ name: string }` emit, no isActive); live preview section
- `src/components/billing/BillingBranchBreakdown.vue` — amount inputs per active branch in BillingEntryModal
- `src/components/billing/BillingEntryModal.vue` — fetches its own branches on `onMounted`; do NOT also fetch branches in BillingRoasView

**CRITICAL — skeleton loading in BillingRoasView:**
`AppLayout.vue` uses `<RouterView :key="$route.fullPath" />` which remounts the component on every navigation. Gate skeleton on `loading && !monthData` (not bare `loading`), and gate days-list/KPI-cards on `monthData` (not `!loading`). This prevents infinite skeleton on navigation.

**Do NOT use `@extend %placeholder` in Vue scoped SCSS** — causes Vite/Sass compilation issues. Use `@mixin` instead.

**Branch colors palette:** `['#3b82f6', '#059669', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316']` (assigned by index, not stored in DB).

**Manual sync:** Available to superadmin and admin roles via the "Sync ahora" button. Optional `?date=YYYY-MM-DD` query param for backfill.
