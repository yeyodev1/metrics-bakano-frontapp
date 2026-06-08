import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const content = fs.readFileSync('src/views/SuperadminDashboard.vue', 'utf8');

const scriptMatch = content.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);
const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
const styleMatch = content.match(/<style lang="scss" scoped>([\s\S]*?)<\/style>/);

const script = scriptMatch ? scriptMatch[0] : '';
const template = templateMatch ? templateMatch[1] : '';
const style = styleMatch ? styleMatch[1] : '';

const baseDir = 'src/views/SuperadminDashboard';
const compDir = path.join(baseDir, 'components');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir);

// CREATE SuperadminDashboard.scss
fs.writeFileSync(path.join(baseDir, 'SuperadminDashboard.scss'), style);

const tabs = [
  { id: "workspaces", name: "WorkspacesTab", search: "v-if=\"activeTab === 'workspaces'\" class=\"superadmin-dashboard__body\"" },
  { id: "account-admins", name: "AccountAdminsTab", search: "v-if=\"activeTab === 'account-admins'\" class=\"superadmin-dashboard__account-admins\"" },
  { id: "traffickers", name: "TraffickersTab", search: "v-if=\"activeTab === 'traffickers'\" class=\"superadmin-dashboard__traffickers\"" },
  { id: "superadmins", name: "SuperadminsTab", search: "v-if=\"activeTab === 'superadmins'\" class=\"superadmin-dashboard__superadmins-panel\"" },
  { id: "planning", name: "PlanningTab", search: "v-if=\"activeTab === 'planning'\" class=\"superadmin-dashboard__planning\"" },
  { id: "surveys", name: "SurveysTab", search: "v-if=\"activeTab === 'surveys'\" class=\"superadmin-dashboard__surveys\"" },
];

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
  const searchStr = "<div " + tab.search + ">";
  const startIdx = template.indexOf(searchStr);
  if (startIdx !== -1) {
    let nextStartIdx = template.length;
    for (const otherTab of tabs) {
      if (otherTab.id !== tab.id) {
        const otherSearchStr = "<div " + otherTab.search + ">";
        const otherIdx = template.indexOf(otherSearchStr);
        if (otherIdx > startIdx && otherIdx < nextStartIdx) {
          nextStartIdx = otherIdx;
        }
      }
    }
    const tabTemplate = template.substring(startIdx, nextStartIdx).trim();
    
    const compScript = script.replace('</script>', \`
import '../SuperadminDashboard.scss';
</script>\`);

    const compContent = \`\${compScript}
<template>
  \${tabTemplate}
</template>
\`;
    fs.writeFileSync(path.join(compDir, tab.name + '.vue'), compContent);
  } else {
    console.log("Could not find start index for tab: " + tab.name);
  }
});

// Index component
const indexScript = \`<script setup lang="ts">
import { ref } from 'vue';
import WorkspacesTab from './components/WorkspacesTab.vue';
import AccountAdminsTab from './components/AccountAdminsTab.vue';
import TraffickersTab from './components/TraffickersTab.vue';
import SuperadminsTab from './components/SuperadminsTab.vue';
import PlanningTab from './components/PlanningTab.vue';
import SurveysTab from './components/SurveysTab.vue';
import './SuperadminDashboard.scss';

const activeTab = ref<'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'surveys' | 'traffickers'>('workspaces');
</script>\`;

const indexContent = \`\${indexScript}
<template>
\${indexTemplate}
</template>\`;

fs.writeFileSync(path.join(baseDir, 'index.vue'), indexContent);

console.log('Split completed!');
