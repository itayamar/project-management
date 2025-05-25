<template>
  <div class="card task-card">
    <div class="card-header-with-bg task-card-header">
      <div class="task-status">
        <div class="badge badge-overdue" v-if="isPastDue">
          ⚠️ Overdue
        </div>
        <div
            class="status-select-wrapper"
            :style="{ backgroundColor: getStatusBgColor(task.state) }"
        >
          <select
              v-model="taskState"
              @change="handleStatusChange"
              class="status-select"
          >
            <option value="CREATED">Created</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <span class="select-icon">▼</span>
        </div>
        <span class="task-due-date" :class="{'text-danger': isPastDue}">
          Due {{ formattedDueDate }}
        </span>
        <span v-if="isBlocked" class="badge badge-lock">🔒 Editing</span>
      </div>
    </div>

    <div class="card-content">
      <div class="task-description expandable-text" :class="{ 'is-expanded': isDescriptionExpanded }">
        {{ task.description }}
        <button
            v-if="isTextTruncated(task.description)"
            class="expand-btn"
            @click.stop="toggleDescriptionExpand"
        >
          {{ isDescriptionExpanded ? 'Show less' : 'Show more' }}
        </button>
      </div>
      <div v-if="task.notes" class="task-notes expandable-text" :class="{ 'is-expanded': isNotesExpanded }">
        {{ task.notes }}
        <button
            v-if="isTextTruncated(task.notes)"
            class="expand-btn"
            @click.stop="toggleNotesExpand"
        >
          {{ isNotesExpanded ? 'Show less' : 'Show more' }}
        </button>
      </div>
      <p v-else class="task-notes text-muted">No notes</p>
    </div>

    <div class="card-actions">
      <button class="icon-btn icon-btn-edit"
              @click.stop="$emit('edit', task)"
              :disabled="isBlocked"
              :title="isBlocked ? 'Locked for editing' : 'Edit'"
      >
        ✏️
      </button>
      <button class="icon-btn icon-btn-delete" @click.stop="$emit('delete', task)" title="Delete Task">🗑️</button>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      taskState: this.task.state,
      isDescriptionExpanded: false,
      isNotesExpanded: false
    }
  },
  computed: {
    ...mapState('task', ['editingTaskIds']),
    isBlocked() {
      return this.task && this.editingTaskIds.includes(this.task._id);
    },
    isPastDue() {
      if (this.task.state === 'COMPLETED' || this.task.state === 'ARCHIVED') {
        return false
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dueDate = new Date(this.task.dueDate)
      dueDate.setHours(0, 0, 0, 0)

      return dueDate < today
    },
    formattedDueDate() {
      const date = new Date(this.task.dueDate)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    }
  },
  methods: {
    getStatusBgColor(state) {
      switch (state) {
        case 'CREATED':
          return '#007bff' // blue
        case 'IN_PROGRESS':
          return '#ffc107' // yellow
        case 'COMPLETED':
          return '#28a745' // green
        case 'ARCHIVED':
          return '#6c757d' // gray
        default:
          return '#ccc'
      }
    },
    handleStatusChange() {
      this.$emit('status-change', {
        ...this.task,
        state: this.taskState
      })
    },
    isTextTruncated(text) {
      return text && text.length > 150
    },
    toggleDescriptionExpand() {
      this.isDescriptionExpanded = !this.isDescriptionExpanded
    },
    toggleNotesExpand() {
      this.isNotesExpanded = !this.isNotesExpanded
    }
  }
}
</script>

<style lang="less" scoped>
.task-status {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.task-due-date {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.task-description {
  font-size: 14px;
  color: #111827;
  line-height: 1.5;
}

.task-notes {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}
</style>