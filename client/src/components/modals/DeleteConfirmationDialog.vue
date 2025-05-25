<template>
  <div v-if="isOpen" class="dialog-overlay">
    <div class="dialog delete-dialog">
      <div class="dialog-header">
        <h2>
          <span class="dialog-icon danger">🗑️</span>
          Delete {{ typeLabel }}
        </h2>
      </div>

      <div class="dialog-content">
        <p class="dialog-description">
          Are you sure you want to delete this {{ type.toLowerCase() }}? This action cannot be undone.
        </p>

        <div class="delete-item-info">
          <div class="item-name">{{ itemName }}</div>
          <div class="item-type">{{ typeLabel }}</div>
        </div>

        <p v-if="hasRelatedTasks" class="warning-message">
          {{ relatedTasksWarning }}
        </p>
      </div>

      <div class="buttons">
        <button type="button" class="btn btn-secondary" @click="cancel">
          Cancel
        </button>
        <button type="button" class="btn btn-danger" @click="confirm">
          Delete {{ typeLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteConfirmationDialog',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      required: true,
      validator: value => ['project', 'task'].includes(value.toLowerCase())
    }
  },
  computed: {
    typeLabel() {
      return this.type.charAt(0).toUpperCase() + this.type.slice(1).toLowerCase()
    },
    itemName() {
      return this.item?.name || this.item?.description || 'Unnamed item'
    },
    hasRelatedTasks() {
      return this.type.toLowerCase() === 'project' && this.item.taskCount > 0
    },
    relatedTasksWarning() {
      if (!this.hasRelatedTasks) return ''

      const taskWord = this.item.taskCount === 1 ? 'task' : 'tasks'
      return `Warning: This project contains ${this.item.taskCount} ${taskWord}.
       Deleting it will also remove all associated tasks.`
    }
  },
  methods: {
    confirm() {
      this.$emit('confirm')
    },
    cancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.dialog.delete-dialog {
  .dialog-header h2 {
    color: #dc2626;

    .dialog-icon {
      background: #fef2f2;
      color: #dc2626;
    }
  }

  .delete-item-info {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;

    .item-name {
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .item-type {
      font-size: 13px;
      color: #6b7280;
      text-transform: capitalize;
    }
  }
}
</style>