<template>
  <div class="card card-clickable project-card" @click="$emit('click')">
    <div class="card-header">
      <h3>
        {{ project.name }}
        <span v-if="project.completed" class="badge badge-completed">✔ Completed</span>
        <span v-else-if="project.inProgress" class="badge badge-inprogress">⏳ In Progress</span>
        <span v-else class="badge badge-pending">📋 Pending</span>
        <span v-if="isBlocked" class="badge badge-lock">🔒 Editing</span>
      </h3>
    </div>
    <div class="card-body">
      <p>{{ project.description || 'No description provided' }}</p>
    </div>
    <div class="card-actions">
      <button
          class="icon-btn icon-btn-edit"
          :disabled="isBlocked"
          :title="isBlocked ? 'Locked for editing' : 'Edit'"
          @click.stop="$emit('edit')"
      >
        <span v-if="isBlocked">🔒</span>
        <span v-else>✏️</span>
      </button>
      <button class="icon-btn icon-btn-delete" @click.stop="$emit('delete')" title="Delete Project">🗑️</button>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState('project', ['editingProjectIds']),
    isBlocked() {
      return this.project && this.editingProjectIds.includes(this.project._id)
    }
  }
}
</script>