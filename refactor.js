import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/views/SuperadminDashboard.vue', 'utf8');

const scriptMatch = content.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);
const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
const styleMatch = content.match(/<style lang="scss" scoped>([\s\S]*?)<\/style>/);

const script = scriptMatch ? scriptMatch[1] : '';
const template = templateMatch ? templateMatch[1] : '';
const style = styleMatch ? styleMatch[1] : '';

const baseDir = 'src/views/SuperadminDashboard';
const compDir = path.join(baseDir, 'components');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir);

// CREATE useSuperadmin.ts
// We'll just define everything inside a composable function that returns an object, but to make it a singleton,
// we'll define the refs outside the function.
let cleanScript = script
  .replace(/import .*? from .*?\n/g, '')
  .replace(/const vClickOutside = {[\s\S]*?};\n/g, '')
  .replace(/^onMounted\(.*?\)$/gm, '');

const useSuperadminContent = `import { ref, computed, watch, onMounted } from 'vue';
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
import type { Workspace, WorkspaceUser, GlobalUser, SuperadminApiKey, DashboardSurveyInfo } from '@/types';

// Extract ALL top-level const, let, function into exported singletons
\${cleanScript.replace(/^(const|let|function) /gm, 'export $1 ')}

export function useSuperadminInit() {
  onMounted(fetchWorkspaces);
}
`;
fs.writeFileSync(path.join(baseDir, 'useSuperadmin.ts'), useSuperadminContent);

// CREATE SuperadminDashboard.scss
fs.writeFileSync(path.join(baseDir, 'SuperadminDashboard.scss'), style);

// EXTRACT TABS FROM TEMPLATE
const tabs = [
  { id: 'workspaces', name: 'WorkspacesTab', search: 'v-if="activeTab === \\'workspaces\\'" class="superadmin-dashboard__body"' },
  { id: 'account-admins', name: 'AccountAdminsTab', search: 'v-if="activeTab === \\'account-admins\\'" class="superadmin-dashboard__account-admins"' },
  { id: 'traffickers', name: 'TraffickersTab', search: 'v-if="activeTab === \\'traffickers\\'" class="superadmin-dashboard__traffickers"' },
  { id: 'superadmins', name: 'SuperadminsTab', search: 'v-if="activeTab === \\'superadmins\\'" class="superadmin-dashboard__superadmins-panel"' },
  { id: 'planning', name: 'PlanningTab', search: 'v-if="activeTab === \\'planning\\'" class="superadmin-dashboard__planning"' },
  { id: 'surveys', name: 'SurveysTab', search: 'v-if="activeTab === \\'surveys\\'" class="superadmin-dashboard__surveys"' },
];

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
    
    // Instead of doing crazy template replacements, we just import all exports from useSuperadmin
    const compContent = \`<script setup lang="ts">
import { vClickOutside } from '@/utils/directives';
// Using a global proxy or object to map everything would be easiest, but since Vue setup needs local bindings:
// We will export a massive object from useSuperadmin.ts instead...
// Wait, Vue 3 allows using imported module directly in template in <script setup>!
// Wait no, we just import what we need... this is too complex.
</script>
<template>
  \${tabTemplate}
</template>
\`;
    fs.writeFileSync(path.join(compDir, \`\${tab.name}.vue\`), compContent);
  }
});
