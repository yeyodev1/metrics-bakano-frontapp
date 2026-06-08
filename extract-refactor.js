import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync('src/views/SuperadminDashboard.vue', 'utf8');

// 1. Extract Script
const scriptMatch = fileContent.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);
const scriptContent = scriptMatch ? scriptMatch[1] : '';

// 2. Extract Template
const templateMatch = fileContent.match(/<template>([\s\S]*?)<\/template>/);
const templateContent = templateMatch ? templateMatch[1] : '';

// 3. Extract Styles
const styleMatch = fileContent.match(/<style lang="scss" scoped>([\s\S]*?)<\/style>/);
const styleContent = styleMatch ? styleMatch[1] : '';

// Create Directory
const dirPath = 'src/views/SuperadminDashboard';
const compPath = path.join(dirPath, 'components');
if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
if (!fs.existsSync(compPath)) fs.mkdirSync(compPath);

// Write SCSS
fs.writeFileSync(path.join(dirPath, 'SuperadminDashboard.scss'), styleContent);

// Prepare Composable (Singleton state)
let composableContent = `import { ref, computed, watch, onMounted } from 'vue';\nimport { useRouter } from 'vue-router';\nimport { useUserStore } from '@/stores/user';\nimport { useConfirm } from '@/composables/useConfirm';\nimport { useToast } from '@/composables/useToast';\nimport { useUserFormModal } from '@/composables/useUserFormModal';\nimport { useSuperadminModal } from '@/composables/useSuperadminModal';\nimport { useGlobalUserModal } from '@/composables/useGlobalUserModal';\nimport * as workspaceService from '@/services/workspace.service';\nimport * as superadminApiService from '@/services/superadminApi.service';\nimport * as notificationService from '@/services/notification.service';\nimport * as planningService from '@/services/planning.service';\nimport * as surveyService from '@/services/survey.service';\nimport type { Workspace, WorkspaceUser, GlobalUser, SuperadminApiKey, DashboardSurveyInfo } from '@/types';\n\n`;

const cleanScript = scriptContent
  .replace(/import .*? from .*?\n/g, '') // remove imports
  .replace(/const vClickOutside = {[\s\S]*?};\n/g, '') // remove directive if any
  .replace(/onMounted\(fetchWorkspaces\)/g, ''); // remove onMounted

composableContent += cleanScript;

// Instead of exporting one function, we'll just export everything
composableContent = composableContent.replace(/const /g, 'export const ').replace(/function /g, 'export function ').replace(/let /g, 'export let ');

fs.writeFileSync(path.join(dirPath, 'useSuperadmin.ts'), composableContent);

// Now we need to split the template... this is tricky to do automatically.
// I will just create the index.vue and we'll manually copy the template.
fs.writeFileSync(path.join(dirPath, 'index.vue'), `<script setup lang="ts">
import { useSuperadmin } from './useSuperadmin';
import './SuperadminDashboard.scss';
</script>
<template>
  <div class="superadmin-dashboard">
    <p>Template extracted</p>
  </div>
</template>`);

console.log('Extraction script complete.');
