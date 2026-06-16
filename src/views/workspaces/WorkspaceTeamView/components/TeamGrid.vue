<script setup lang="ts">
import type { WorkspaceUser } from '@/types'
import MemberCard from './MemberCard.vue'

interface GroupedMembers {
  groupName: string;
  icon: string;
  members: WorkspaceUser[];
}

const props = defineProps({
  groupedTeam: {
    type: Array as () => GroupedMembers[],
    required: true,
  }
})

const emit = defineEmits(['view-profile', 'evaluate'])
</script>

<template>
  <div class="team-awwwards__groups">
    <section 
      v-for="group in groupedTeam" 
      :key="group.groupName" 
      class="team-group"
    >
      <h2 class="team-group__title">
        <i :class="group.icon"></i> {{ group.groupName }}
      </h2>
      <div class="team-awwwards__grid">
        <MemberCard 
          v-for="member in group.members" 
          :key="member._id" 
          :member="member"
          @view-profile="emit('view-profile', $event)"
          @evaluate="emit('evaluate', $event)"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.team-awwwards__groups {
  .team-group {
    margin-bottom: 5rem;

    &__title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 2rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: inline-block;

      i {
        color: $primary;
        margin-right: 0.5rem;
      }
    }
  }

  .team-awwwards__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2.5rem;
  }
}
</style>
