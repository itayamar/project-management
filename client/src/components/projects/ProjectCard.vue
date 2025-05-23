<template>
  <div class="project-card" @click="$emit('click')">
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
    <div class="actions">
      <button
          class="icon-btn edit-btn"
          :disabled="isBlocked"
          :title="isBlocked ? 'Locked for editing' : 'Edit'"
          @click.stop="$emit('edit')"
      >
        <span v-if="isBlocked">🔒</span>
        <span v-else>✏️</span>
      </button>
      <button class="icon-btn delete-btn" @click.stop="$emit('delete')" title="Delete Project">🗑️</button>
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

<style lang="less" scoped>
.project-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.card-header {
  padding: 20px 20px 12px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.card-body {
  padding: 0 20px 20px;
  flex: 1;

  p {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    word-break: break-word;
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;

  &-completed {
    background: #dcfce7;
    color: #15803d;
  }

  &-inprogress {
    background: #fef9c3;
    color: #854d0e;
  }

  &-pending {
    background: #f3f4f6;
    color: #4b5563;
  }
}
.badge-lock {
  background: #fee2e2;
  color: #b91c1c;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 8px;
  margin-left: 6px;
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
  .card-header {
    padding: 16px 16px 8px;

    h3 {
      font-size: 16px;
    }
  }

  .card-body {
    padding: 0 16px 16px;

    p {
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