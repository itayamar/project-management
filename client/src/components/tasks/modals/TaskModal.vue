<template>
  <div v-if="isOpen" class="dialog-overlay">
    <div class="dialog">
      <h2>{{ task ? 'Edit Task' : 'Add Task' }}</h2>

      <form @submit.prevent="saveTask">
        <div class="form-group">
          <label for="description">Description</label>
          <input
              type='text'
              id="description"
              v-model="localTask.description"
              required
          />
        </div>

<div class="form-group">
          <label for="dueDate">Due Date</label>
          <input
              type="date"
              id="dueDate"
              v-model="localTask.dueDate"
              required
          />
        </div>

        <div class="form-group">
          <label for="state">State</label>
          <select id="state" v-model="localTask.state" required>
            <option value="CREATED">Created</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea
              id="notes"
              v-model="localTask.notes"
              rows="4"
              autocomplete="off"
          ></textarea>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="buttons">
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="!hasChanges"
            :class="{ 'btn-disabled': !hasChanges }"
          >
            {{ task ? 'Save Changes' : 'Add Task' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="close">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskModal',
  props: {
    task: {
      type: Object,
      default: null
    },
    projectId: {
      type: String,
      required: true
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      localTask: {
        dueDate: '',
        state: 'CREATED',
        notes: ''
      },
      originalTask: null,
      errorMessage: ''
    }
  },
  computed: {
    hasChanges() {
      // For new tasks, always enable the button
      if (!this.task) return true;
      
      // For existing tasks, compare with original values
      return this.originalTask && (
        this.localTask.description !== this.originalTask.description ||
        this.localTask.dueDate !== this.originalTask.dueDate ||
        this.localTask.state !== this.originalTask.state ||
        this.localTask.notes !== this.originalTask.notes
      );
    }
  },
  watch: {
    task: {
      immediate: true,
      handler(newTask) {
        if (newTask) {
          const formattedTask = {
            ...newTask,
            dueDate: newTask.dueDate?.split('T')[0] || '',
            state: newTask.state || 'CREATED',
            notes: newTask.notes || ''
          };
          this.localTask = { ...formattedTask };
          this.originalTask = { ...formattedTask };
        } else {
          const today = new Date().toISOString().split('T')[0];
          const newTaskData = {
            dueDate: today,
            state: 'CREATED',
            notes: ''
          };
          this.localTask = { ...newTaskData };
          this.originalTask = null;
        }
        this.errorMessage = '';
      }
    },
    isOpen(open) {
      if (!open) {
        this.errorMessage = '';
      }
    }
  },
  methods: {
    saveTask() {
      if (!this.localTask.dueDate || !this.localTask.state) {
        this.errorMessage = 'Due date and state are required.'
        return
      }
      const payload = {
        ...this.localTask,
        projectId: this.projectId
      }
      this.$emit('submit', payload)
      this.close()
    },
    close() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 6px;
}

input[type='text'],
input[type='date'],
select,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>