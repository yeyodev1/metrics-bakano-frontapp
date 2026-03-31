---
name: Video Planning Feature
description: Video planning + calendar preview + copyPublicacion + Instagram preview modal + sidebar search + AI script generator (Gemini, edit-only, brand profile required) + TOFU/MOFU/BOFU distribution tracker
type: project
---

Full video planning feature. Key file map:

**Views/Components:**
- `src/views/videoPlanning/VideoPlanningView.vue` — main view, loads planning + brand profile, shows ScriptDistributionWidget + table
- `src/components/videoPlanning/VideoPlanningItemModal.vue` — create/edit video item; includes tipoGuion in form; passes allItems to ScriptGeneratorPanel
- `src/components/videoPlanning/ScriptGeneratorPanel.vue` — AI script generation panel with interactive TOFU/MOFU/BOFU selector (tooltips), compact distribution widget inside
- `src/components/videoPlanning/ScriptDistributionWidget.vue` — NEW: reusable progress tracker for TOFU(10)/MOFU(5)/BOFU(5) per planning; compact and full modes
- `src/components/videoPlanning/VideoPlanningTable.vue` — item table with inline status editing
- `src/components/videoPlanning/VideoCompletedModal.vue` — upload media + schedule social on EDITADO

**Services:**
- `src/services/brandProfile.service.ts` — generateScript(itemId, ctx, tipoGuion?), generateScriptQuick(workspaceId, tema, tipo, ctx, tipoGuion?) — both 60s timeout
- `src/services/videoPlanning.service.ts`

**Types:** `src/types/videoPlanning.ts` — VideoItem.tipoGuion: TipoGuion, CreateVideoItemPayload.tipoGuion, UpdateVideoItemPayload.tipoGuion

**Backend (ads-bakano-clients-backapp):**
- `src/controllers/scriptGeneration.controller.ts` — accepts tipoGuion override in both endpoints
- `src/services/videoPlanning.service.ts` — tipoGuion in MUTABLE_FIELDS
- `src/services/gemini.service.ts` — SYSTEM_PROMPT with 12 examples (Helen Bermeo + ROLKI)

**Distribution logic:**
- Target: 10 TOFU + 5 MOFU + 5 BOFU = 20 per planning
- Count items with `tipoGuion` set AND `_id` present (saved)
- tipoGuion saved to item only when user saves the form (not on AI generation)
- ScriptGeneratorPanel emits `update:tipoGuion` → VideoPlanningItemModal updates form.tipoGuion

**Why:** User wanted explicit control over which funnel type each script is generated for, and visual clarity on how many of each type remain to complete the 20-video planning for content managers.

**How to apply:** When editing script generation behavior, check ScriptGeneratorPanel for the selector logic. For counting/progress, check ScriptDistributionWidget. Backend tipoGuion override is in scriptGeneration.controller.ts.
