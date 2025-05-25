<template>
  <div v-if="isOpen" class="dialog-overlay">
    <div class="dialog">
      <header class="dialog-header">
        <h2>
          <span class="dialog-icon primary">{{ task ? '✏️' : '➕' }}</span>
          {{ task ? 'Edit Task' : 'Add New Task' }}
        </h2>
      </header>

      <section class="dialog-content">
        <form @submit.prevent="saveTask">
          <div class="form-group">
            <label for="description">Task Description</label>
            <input
                type='text'
                id="description"
                v-model="localTask.description"
                placeholder="Enter a clear description of the task..."
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
            <label for="state">Current Status</label>
            <select id="state" v-model="localTask.state" required>
              <option value="CREATED">📋 Created</option>
              <option value="IN_PROGRESS">⏳ In Progress</option>
              <option value="COMPLETED">✅ Completed</option>
              <option value="ARCHIVED">📦 Archived</option>
            </select>
          </div>

          <div class="form-group">
            <label for="notes">Additional Notes</label>
            <textarea
                id="notes"
                v-model="localTask.notes"
                rows="4"
                placeholder="Add any additional notes or details..."
                autocomplete="off"
            ></textarea>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>
      </section>

      <footer class="buttons">
        <button type="button" class="btn btn-secondary" @click="close">
          Cancel
        </button>
        <button
            type="submit"
            class="btn btn-primary"
            :disabled="isBlocked || !hasChanges"
            :class="{ 'btn-disabled': !hasChanges }"
            @click="saveTask"
        >
          {{ task ? 'Save Changes' : 'Create Task' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
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
    },
  },
  data() {
    return {
      localTask: {
        description: '',
        dueDate: '',
        state: 'CREATED',
        notes: ''
      },
      originalTask: null,
      errorMessage: ''
    }
  },
  computed: {
    ...mapState('task', ['editingTaskIds']),
    isBlocked() {
      return this.task && this.editingTaskIds.includes(this.task._id);
    },
    hasChanges() {
      // For new tasks, check if required fields are filled
      if (!this.task) {
        return this.localTask.description.trim() && this.localTask.dueDate;
      }

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
            description: newTask.description || '',
            dueDate: newTask.dueDate?.split('T')[0] || '',
            state: newTask.state || 'CREATED',
            notes: newTask.notes || ''
          };
          this.localTask = { ...formattedTask };
          this.originalTask = { ...formattedTask };
        } else {
          const today = new Date().toISOString().split('T')[0];
          const newTaskData = {
            description: '',
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
      if (this.task?._id) {
        if (open) {
          this.$store.dispatch('task/startEditingTask', this.task._id);
        } else {
          this.errorMessage = '';
        }
      }
    }
  },
  methods: {
    validateTask() {
      if (!this.localTask.description.trim()) {
        this.errorMessage = 'Task description is required.';
        return false;
      }

      if (!this.localTask.dueDate) {
        this.errorMessage = 'Due date is required.';
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(this.localTask.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today && (!this.task || this.localTask.dueDate !== this.originalTask?.dueDate)) {
        this.errorMessage = 'Due date cannot be in the past.';
        return false;
      }

      this.errorMessage = '';
      return true;
    },
    saveTask() {
      if (!this.validateTask()) return;

      const payload = {
        ...this.localTask,
        description: this.localTask.description.trim(),
        projectId: this.projectId
      };

      this.$emit('submit', payload);
      this.close();
    },
    close() {
      if (this.task?._id) {
        this.$store.dispatch('task/stopEditingTask', this.task._id);
      }
      this.$emit('cancel');
    }
  }
}
</script>