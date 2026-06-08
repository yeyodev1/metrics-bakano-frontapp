const fs = require('fs');
const path = require('path');

const vueContent = fs.readFileSync('src/views/SuperadminDashboard.vue', 'utf8');

// Parse sections
const scriptMatch = vueContent.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);
const templateMatch = vueContent.match(/<template>([\s\S]*?)<\/template>/);
const styleMatch = vueContent.match(/<style lang="scss" scoped>([\s\S]*?)<\/style>/);

const script = scriptMatch ? scriptMatch[1] : '';
const template = templateMatch ? templateMatch[1] : '';
const style = styleMatch ? styleMatch[1] : '';

// Create folders
const baseDir = 'src/views/SuperadminDashboard';
const compDir = path.join(baseDir, 'components');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir);

// 1. Write the composable (useSuperadmin.ts)
// We will export all refs/functions by prepending export to const/function/let at the top level
let composable = `import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { useUserFormModal } from '@/composables/useUserFormModal';
import { useSuperadminModal } from '@/composables/useSuperadminModal';
import { useGlobalUserModal } from '@/composables/useGlobalUserModal';
import * as workspaceService from '@/services/workspace.service';
import * as superadminApiService from '@/services/superadminApi.service';
import * as notificationService from '@/services/notification.service';
import * as planningService from '@/services/planning.service';
import * as surveyService from '@/services/survey.service';
import type { Workspace, WorkspaceUser, GlobalUser, SuperadminApiKey, DashboardSurveyInfo } from '@/types';\n\n`;

const cleanScript = script
  .replace(/import .*? from .*?\n/g, '') // remove imports
  .replace(/const vClickOutside = {[\s\S]*?};\n/g, '') // remove vClickOutside definition
  .replace(/^onMounted\(.*?\)$/gm, ''); // remove top-level onMounted

// Simple regex to prepend export to top-level declarations
let exportedScript = cleanScript.replace(/^(const|let|function|interface|type) /gm, 'export $1 ');
composable += exportedScript;

fs.writeFileSync(path.join(baseDir, 'useSuperadmin.ts'), composable);

// 2. Write the global styles
fs.writeFileSync(path.join(baseDir, 'SuperadminDashboard.scss'), style);

// 3. We will create the tab templates by searching for v-if="activeTab === '...'"
const tabs = [
  { id: 'workspaces', name: 'WorkspacesTab', search: 'v-if="activeTab === \\'workspaces\\'" class="superadmin-dashboard__body"' },
  { id: 'account-admins', name: 'AccountAdminsTab', search: 'v-if="activeTab === \\'account-admins\\'" class="superadmin-dashboard__account-admins"' },
  { id: 'traffickers', name: 'TraffickersTab', search: 'v-if="activeTab === \\'traffickers\\'" class="superadmin-dashboard__traffickers"' },
  { id: 'superadmins', name: 'SuperadminsTab', search: 'v-if="activeTab === \\'superadmins\\'" class="superadmin-dashboard__superadmins-panel"' },
  { id: 'planning', name: 'PlanningTab', search: 'v-if="activeTab === \\'planning\\'" class="superadmin-dashboard__planning"' },
  { id: 'surveys', name: 'SurveysTab', search: 'v-if="activeTab === \\'surveys\\'" class="superadmin-dashboard__surveys"' },
];

let remainingTemplate = template;
let indexTemplate = `  <div class="superadmin-dashboard">
    <!-- Top bar -->
    <header class="superadmin-dashboard__header">
      <div class="superadmin-dashboard__header-info">
        <div class="superadmin-dashboard__header-icon">
          <i class="fa-solid fa-grid-2"></i>
        </div>
        <div>
          <h1 class="superadmin-dashboard__title">Vista Global</h1>
          <p class="superadmin-dashboard__subtitle">Control maestro de todos los entornos, clientes y herramientas globales.</p>
        </div>
      </div>
    </header>

    <!-- Nav Tabs -->
    <nav class="superadmin-dashboard__tabs">
      <button class="superadmin-dashboard__tab" :class="{ 'superadmin-dashboard__tab--active': activeTab === 'workspaces' }" @click="activeTab = 'workspaces'">
        <i class="fa-solid fa-building"></i> Entornos & Clientes
      </button>
      <button class="superadmin-dashboard__tab" :class="{ 'superadmin-dashboard__tab--active': activeTab === 'account-admins' }" @click="activeTab = 'account-admins'">
        <i class="fa-solid fa-users-gear"></i> Account Admins
      </button>
      <button class="superadmin-dashboard__tab" :class="{ 'superadmin-dashboard__tab--active': activeTab === 'traffickers' }" @click="activeTab = 'traffickers'">
        <i class="fa-solid fa-bullseye-pointer"></i> Traffickers
      </button>
      <button class="superadmin-dashboard__tab superadmin-dashboard__tab--superadmin" :class="{ 'superadmin-dashboard__tab--active': activeTab === 'superadmins' }" @click="activeTab = 'superadmins'">
        <i class="fa-solid fa-shield-halved"></i> Superadmins
      </button>
      <div class="superadmin-dashboard__tabs-divider"></div>
      <button class="superadmin-dashboard__tab" :class="{ 'superadmin-dashboard__tab--active': activeTab === 'planning' }" @click="activeTab = 'planning'">
        <i class="fa-solid fa-calendar-range"></i> Planning Global
      </button>
      <button class="superadmin-dashboard__tab" :class="{ 'superadmin-dashboard__tab--active': activeTab === 'surveys' }" @click="activeTab = 'surveys'">
        <i class="fa-solid fa-clipboard-list"></i> Encuestas
      </button>
    </nav>
    
    <WorkspacesTab v-if="activeTab === 'workspaces'" />
    <AccountAdminsTab v-if="activeTab === 'account-admins'" />
    <TraffickersTab v-if="activeTab === 'traffickers'" />
    <SuperadminsTab v-if="activeTab === 'superadmins'" />
    <PlanningTab v-if="activeTab === 'planning'" />
    <SurveysTab v-if="activeTab === 'surveys'" />
  </div>
`;

// Extract tab templates
tabs.forEach(tab => {
  const startIdx = template.indexOf(\`<div \${tab.search}>\`);
  if (startIdx !== -1) {
    let nextStartIdx = template.length;
    for (const otherTab of tabs) {
      if (otherTab.id !== tab.id) {
        const otherIdx = template.indexOf(\`<div \${otherTab.search}>\`);
        if (otherIdx > startIdx && otherIdx < nextStartIdx) {
          nextStartIdx = otherIdx;
        }
      }
    }
    const tabTemplate = template.substring(startIdx, nextStartIdx).trim();
    
    // Create the component file
    const compContent = \`<script setup lang="ts">
import * as S from '../useSuperadmin';
import { vClickOutside } from '@/utils/directives';
</script>
<template>
  \${tabTemplate.replace(/(\\w+)\\.value/g, 'S.$1.value').replace(/(\\w+)\\(/g, (m, name) => {
    // Only prepend S. if it's a known exported function from useSuperadmin
    return \`S.\${name}(\`; // Rough approximation, better to use v-bind mappings or destructure in script setup
  })}
</template>
\`;
    // We will do a better mapping: instead of replacing in template, we'll destructure EVERYTHING from useSuperadmin in the script setup
    const destructureScript = \`<script setup lang="ts">
import { toRefs } from 'vue';
import * as _S from '../useSuperadmin';
import { vClickOutside } from '@/utils/clickOutside'; // Ensure you have this
const S = _S as any;
const { \${Object.keys(_S).join(', ')} } = S;
</script>
<template>
  \${tabTemplate}
</template>\`;

    // This destructuring approach is much cleaner and doesn't require template regex
    // Wait, object keys of _S are not known at script generation time.
    
    // Let's just do a big destructuring in the actual file by writing a dynamic import.
    // Actually, Vue template can just use S.foo if we do:
    // const S = useSuperadmin(); and in template: S.workspaces
    
  }
});
