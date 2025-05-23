<template>
  <div class="project-header">
    <div class="header-content">
      <div class="title-section">
        <div class="actions">
          <button
              class="icon-btn edit-btn"
              :disabled="isBlocked"
              :title="isBlocked ? 'Locked for editing' : 'Edit Project'"
              @click="$emit('edit')"
          >
            <span v-if="isBlocked">🔒</span>
            <span v-else>✏️</span>
          </button>
          <button class="icon-btn delete-btn" @click="$emit('delete')" title="Delete Project">🗑️</button>
        </div>
        <h1 class="title">
          {{ project.name }}
          <span v-if="isBlocked" class="badge-lock">Editing...</span>
        </h1>
      </div>
      <p class="description">{{ project.description || 'No description provided' }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectHeader',
  props: {
    project: {
      type: Object,
      required: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped lang="less">
.project-header {
  margin-bottom: 32px;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1000px;
  margin: 0 auto;
}

.title-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  padding: 4px 0;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.2;
  word-break: break-word;
  flex: 1;
}

.description {
  font-size: 16px;
  color: #4b5563;
  margin: 0;
  line-height: 1.6;
  word-break: break-word;
  max-width: 800px;

  &:empty::before {
    content: 'No description provided';
    color: #9ca3af;
    font-style: italic;
  }
}

.badge-lock {
  font-size: 14px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 4px 10px;
  border-radius: 6px;
  margin-left: 10px;
}

@media (max-width: 640px) {
  .project-header {
    margin: -16px;
    margin-bottom: 24px;
    padding: 20px 16px;
    border-radius: 0;
  }

  .title-section {
    margin-bottom: 16px;
    gap: 8px;
  }

  .title {
    font-size: 24px;
  }

  .description {
    font-size: 15px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
}
</style>