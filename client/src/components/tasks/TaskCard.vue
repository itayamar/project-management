<template>
  <div class="task-card">
    <div class="task-card-header">
      <div class="task-status">
        <div class="overdue-badge" v-if="isPastDue">
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
      </div>
    </div>

    <div class="task-card-content">
      <div class="task-description" :class="{ 'is-expanded': isDescriptionExpanded }">
        {{ task.description }}
        <button 
          v-if="isTextTruncated(task.description)" 
          class="expand-btn"
          @click.stop="toggleDescriptionExpand"
        >
          {{ isDescriptionExpanded ? 'Show less' : 'Show more' }}
        </button>
      </div>
      <div v-if="task.notes" class="task-notes" :class="{ 'is-expanded': isNotesExpanded }">
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

    <div class="actions">
      <button class="icon-btn edit-btn" @click.stop="$emit('edit')" title="Edit Task">✏️</button>
      <button class="icon-btn delete-btn" @click.stop="$emit('delete')" title="Delete Task">🗑️</button>
    </div>
  </div>
</template>

<script>
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
.task-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.task-card-header {
  padding: 16px 20px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.overdue-badge {
  background-color: #ef4444;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.status-select-wrapper {
  padding: 4px 12px;
  border-radius: 12px;
  min-width: 120px;
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);

    .select-icon {
      transform: translateY(1px);
    }
  }

  &:active {
    filter: brightness(0.95);
  }

  .select-icon {
    position: absolute;
    right: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    pointer-events: none;
    transition: transform 0.2s ease;
  }
}

.status-select {
  background: transparent;
  border: none;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  outline: none;
  appearance: none;
  cursor: pointer;
  width: 100%;
  padding-right: 24px;
  z-index: 1;
  
  option {
    background: white;
    color: #374151;
    font-weight: 500;
  }
}

.task-due-date {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;

  &.text-danger {
    color: #ef4444;
  }
}

.task-card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .task-description, .task-notes {
    position: relative;
    margin: 0;
    word-break: break-word;
    overflow: hidden;
    
    &:not(.is-expanded) {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      max-height: 4.5em;
    }
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

    &.text-muted {
      color: #9ca3af;
      font-style: italic;
    }
  }

  .expand-btn {
    background: none;
    border: none;
    color: #2563eb;
    font-size: 13px;
    padding: 4px 8px;
    cursor: pointer;
    margin-left: 4px;
    border-radius: 4px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background: #eff6ff;
    }
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;

    &:hover {
      transform: translateY(-1px);
    }

    &.edit-btn {
      color: #059669;

      &:hover {
        background: #f0fdf4;
      }
    }

    &.delete-btn {
      color: #dc2626;

      &:hover {
        background: #fef2f2;
      }
    }
  }
}

@media (max-width: 640px) {
  .task-card-header {
    padding: 12px 16px;
  }

  .task-card-content {
    padding: 16px;

    .task-description,
    .task-notes {
      font-size: 13px;
    }
  }

  .actions {
    padding: 8px 16px;

    .icon-btn {
      width: 28px;
      height: 28px;
      font-size: 14px;
    }
  }
}
</style> 