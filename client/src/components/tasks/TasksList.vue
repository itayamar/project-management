<template>
  <div class="task-list-container">
    <div class="header-section">
      <h3 class="section-title">Tasks</h3>
      <button class="btn btn-add" @click="openCreateTaskModal">
        ➕ Add Task
      </button>
    </div>

    <!-- Task filter controls -->
    <div class="filters-section">
      <div class="search-box">
        <input 
          type="text" 
          :value="searchQuery"
          @input="handleSearch($event.target.value)"
          placeholder="Search tasks..."
        >
      </div>

      <div class="status-tabs">
        <button
          v-for="(label, status) in statusFilters"
          :key="status"
          class="status-tab"
          :class="{
            'active': currentFilter === status,
            'tab-created': status === 'CREATED',
            'tab-progress': status === 'IN_PROGRESS',
            'tab-completed': status === 'COMPLETED',
            'tab-archived': status === 'ARCHIVED'
          }"
          @click="filterTasks(status)"
        >
          <span class="status-icon" v-if="status !== 'ALL'">●</span>
          {{ label }}
          <span class="task-count" v-if="status !== 'ALL'">
            {{ getTaskCountByStatus(status) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading('tasks')" class="empty-state">
      <skelaton-loader :lines="4" type="card" />
    </div>

    <!-- Empty tasks state -->
    <div v-else-if="filteredTasks.length === 0" class="empty-state">
      <h3>
        {{ currentFilter === 'ALL' ? 'No tasks yet' : `No ${statusFilters[currentFilter].toLowerCase()} tasks` }}
      </h3>
      <p v-if="currentFilter === 'ALL'">
        Add your first task to get started
      </p>
      <p v-else>
        Try selecting a different filter
      </p>
      <button v-if="currentFilter === 'ALL'" class="btn btn-primary mt-3" @click="openCreateTaskModal">
        <span class="btn-icon">+</span>Add Task
      </button>
    </div>

    <!-- Task list -->
    <div v-else class="task-list">
      <div
          v-for="task in filteredTasks"
          :key="task._id"
          class="task-card"
          :class="{'past-due': isPastDue(task)}"
      >
        <div class="task-card-header">
          <div class="task-status">
            <div
                class="status-select-wrapper"
                :style="{ backgroundColor: getStatusBgColor(task.state) }"
            >
              <select
                  v-model="task.state"
                  @change="handleStatusChange(task)"
                  class="status-select"
              >
                <option value="CREATED">Created</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <span class="select-icon">▼</span>
            </div>
            <span class="task-due-date" :class="{'text-danger': isPastDue(task)}">
              Due {{ formatDate(task.dueDate) }}
            </span>
          </div>
          
          <div class="task-actions">
            <button class="action-btn edit-btn" @click="editTask(task)" title="Edit task">
              ✏️
            </button>
            <button class="action-btn delete-btn" @click="confirmDeleteTask(task)" title="Delete task">
              🗑️
            </button>
          </div>
        </div>

        <div class="task-card-content">
          <p class="task-description">{{ task.description }}</p>
          <p v-if="task.notes" class="task-notes">{{ task.notes }}</p>
          <p v-else class="task-notes text-muted">No notes</p>
        </div>
      </div>

      <pagination
          v-if="filteredTasks.length"
          :currentPage="currentPage"
          :totalPages="totalTasksPages"
          @page-change="handlePageChange"
      />
    </div>

    <!-- Task Modal -->
    <TaskModal
        :isOpen="showTaskModal"
        :projectId="projectId"
        :task="taskToEdit"
        @submit="handleSaveTask"
        @cancel="closeTaskModal"
    />

    <!-- Delete Confirmation Modal -->
    <delete-modal
        v-if="taskToDelete"
        :isOpen="showDeleteModal"
        :item="taskToDelete"
        type="task"
        @cancel="closeDeleteModal"
        @confirm="handleDeleteTask"
    />
  </div>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import DeleteModal from '@/components/modals/DeleteConfirmationDialog.vue'
import SkelatonLoader from '@/components/SkelatonLoader.vue'
import TaskModal from '@/components/tasks/modals/TaskModal.vue'
import { showToast } from '@/common'
import Pagination from "@/components/Pagination.vue";

export default {
  name: 'TaskList',
  components: {Pagination, SkelatonLoader, DeleteModal, TaskModal },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showTaskModal: false,
      showDeleteModal: false,
      isEditing: false,
      currentFilter: 'ALL',
      taskToEdit: null,
      taskToDelete: null,
      taskForm: {
        state: 'CREATED',
        dueDate: '',
        notes: ''
      },
      errors: {},
      statusFilters: {
        ALL: 'All',
        CREATED: 'Created',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
        ARCHIVED: 'Archived'
      },
      currentPage: 1,
      limit: 20,
      searchTimeout: null
    }
  },
  computed: {
    ...mapState({
      tasks: state => state.task.tasks,
      totalTasks: state => state.task.totalTasks,
    }),
    totalTasksPages() {
      return Math.ceil(this.totalTasks / this.limit)
    },
    filteredTasks() {
      if (this.currentFilter === 'ALL') {
        return this.sortTasks([...this.tasks])
      }
      return this.sortTasks(this.tasks.filter(task => task.state === this.currentFilter))
    },
    ...mapGetters([
      'isLoading',
      'hasError',
      'errorMessage'
    ]),
    taskCountsByStatus() {
      return {
        CREATED: this.tasks.filter(t => t.state === 'CREATED').length,
        IN_PROGRESS: this.tasks.filter(t => t.state === 'IN_PROGRESS').length,
        COMPLETED: this.tasks.filter(t => t.state === 'COMPLETED').length,
        ARCHIVED: this.tasks.filter(t => t.state === 'ARCHIVED').length
      }
    },
    searchQuery: {
      get() {
        return this.$store.state.task.filters.search;
      },
      set(value) {
        this.handleSearch(value);
      }
    }
  },
  created() {
    this.loadTasks()
  },
  watch: {
    totalTasks(newTotal) {
      const totalPages = Math.ceil(newTotal / this.limit)
      if (this.currentPage > totalPages) {
        this.currentPage = totalPages || 1
        this.loadTasks()
      }
    }
  },
  methods: {
    ...mapActions('task', {
      fetchProjectTasks: 'fetchTasks',
      createTask: 'createTask',
      updateTask: 'updateTask',
      deleteTask: 'deleteTask'
    }),

    async loadTasks() {
      try {
        await this.fetchProjectTasks({projectId: this.projectId, page: this.currentPage, limit: this.limit})
      } catch (error) {
        console.error('Error loading tasks:', error)
      }
    },

    handlePageChange(newPage) {
      this.currentPage = newPage
      this.loadTasks()
    },

    filterTasks(status) {
      this.currentFilter = status
    },

    sortTasks(tasks) {
      // Sort by state and then by due date
      const stateOrder = {
        'CREATED': 0,
        'IN_PROGRESS': 1,
        'COMPLETED': 2,
        'ARCHIVED': 3
      }

      return [...tasks].sort((a, b) => {
        // First by state
        if (stateOrder[a.state] !== stateOrder[b.state]) {
          return stateOrder[a.state] - stateOrder[b.state]
        }

        // Then by due date
        return new Date(a.dueDate) - new Date(b.dueDate)
      })
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    },

    isPastDue(task) {
      if (task.state === 'COMPLETED' || task.state === 'ARCHIVED') {
        return false
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)

      return dueDate < today
    },

    getStatusClass(status) {
      switch (status) {
        case 'CREATED':
          return 'badge-blue'
        case 'IN_PROGRESS':
          return 'badge-yellow'
        case 'COMPLETED':
          return 'badge-green'
        case 'ARCHIVED':
          return 'badge-gray'
        default:
          return 'badge-gray'
      }
    },

    formatStatusLabel(status) {
      return status.replace('_', ' ')
    },

    openCreateTaskModal() {
      this.isEditing = false
      const today = new Date().toISOString().split('T')[0]

      this.taskForm = {
        state: 'CREATED',
        dueDate: today,
        notes: ''
      }

      this.showTaskModal = true
    },

    editTask(task) {
      this.isEditing = true
      this.taskToEdit = task

      this.taskForm = {
        state: task.state,
        dueDate: new Date(task.dueDate).toISOString().split('T')[0],
        notes: task.notes || ''
      }

      this.showTaskModal = true
    },

    handleSaveTask(payload) {
      const taskData = {
        ...payload,
        projectId: this.projectId
      }

      if (this.isEditing && this.taskToEdit) {
        this.updateTask({
          taskId: this.taskToEdit._id,
          taskData
        }).then(() => {
          showToast(this.$toasted, 'Task updated successfully!')
        }).catch(err => {
          showToast(this.$toasted, `Error: ${err.message}`, 'error')
        })
      } else {
        this.createTask(taskData).then(() => {
          showToast(this.$toasted, 'Task created successfully!')
        }).catch(err => {
          showToast(this.$toasted, `Error: ${err.message}`, 'error')
        })
      }

      this.closeTaskModal()
    },

    confirmDeleteTask(task) {
      this.taskToDelete = task
      this.showDeleteModal = true
    },

    async handleDeleteTask() {
      if (!this.taskToDelete) return

      try {
        await this.deleteTask(this.taskToDelete._id)
        showToast(this.$toasted, 'Task deleted successfully!')
        this.closeDeleteModal()
      } catch (err) {
        console.error('Error deleting task:', err)
        showToast(this.$toasted, `Error: ${err.message}`, 'error')
      }
    },

    closeTaskModal() {
      this.showTaskModal = false
      this.taskForm = { state: 'CREATED', dueDate: '', notes: '' }
      this.errors = {}
      this.taskToEdit = null
    },

    closeDeleteModal() {
      this.showDeleteModal = false
      this.taskToDelete = null
    },

    getStatusBgColor(state) {
      switch (state) {
        case 'CREATED':
          return '#007bff'; // blue
        case 'IN_PROGRESS':
          return '#ffc107'; // yellow
        case 'COMPLETED':
          return '#28a745'; // green
        case 'ARCHIVED':
          return '#6c757d'; // gray
        default:
          return '#ccc';
      }
    },
    handleStatusChange(task) {
      this.updateTask({
        taskId: task._id,
        taskData: {
          ...task,
          state: task.state
        }
      }).then(() => {
        showToast(this.$toasted, 'Task status updated!')
      }).catch(err => {
        showToast(this.$toasted, `Error: ${err.message}`, 'error')
      })
    },
    getTaskCountByStatus(status) {
      return this.taskCountsByStatus[status] || 0
    },
    handleSearch(value) {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      const searchValue = typeof value === 'string' ? value : value?.target?.value || '';
      
      this.searchTimeout = setTimeout(() => {
        this.$store.dispatch('task/updateFilters', {
          projectId: this.projectId,
          filters: { search: searchValue }
        });
      }, 300);
    }
  }
}
</script>

<style lang="less" scoped>
.task-list-container {
  position: relative;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.filters-section {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;

  .search-box {
    margin-bottom: 1rem;

    input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.2s ease;
      background: #f9fafb;

      &:focus {
        outline: none;
        border-color: #2563eb;
        background: white;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }
  }
}

.status-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 1px;
  
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    color: #111827;
  }

  &.active {
    color: #111827;
    border-bottom-color: #2563eb;
  }

  .status-icon {
    font-size: 10px;
  }

  .task-count {
    background: #e5e7eb;
    color: #4b5563;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  &.tab-created {
    .status-icon { color: #3b82f6; }
    &.active .task-count { background: #bfdbfe; color: #1e40af; }
  }

  &.tab-progress {
    .status-icon { color: #f59e0b; }
    &.active .task-count { background: #fde68a; color: #92400e; }
  }

  &.tab-completed {
    .status-icon { color: #10b981; }
    &.active .task-count { background: #a7f3d0; color: #065f46; }
  }

  &.tab-archived {
    .status-icon { color: #6b7280; }
    &.active .task-count { background: #e5e7eb; color: #111827; }
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-card {
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  &.past-due {
    border-left: 4px solid #ef4444;
  }
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-select-wrapper {
  padding: 4px 12px;
  border-radius: 16px;
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
  font-size: 0.875rem;
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

  &:focus + .select-icon {
    transform: translateY(2px);
  }
}

.task-due-date {
  font-size: 0.875rem;
  color: #6b7280;

  &.text-danger {
    color: #ef4444;
    font-weight: 500;
  }
}

.task-card-content {
  padding: 16px;
}

.task-description {
  margin: 0 0 8px;
  font-size: 0.9375rem;
  color: #111827;
  line-height: 1.5;
}

.task-notes {
  margin: 0;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.4;

  &.text-muted {
    color: #9ca3af;
    font-style: italic;
  }
}

.task-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;

  &:hover {
    transform: scale(1.05);
  }

  &.edit-btn {
    background: #10b981;
    color: white;

    &:hover {
      background: #059669;
    }
  }

  &.delete-btn {
    background: #bfa5a5;
    color: white;

    &:hover {
      background: #dc2626;
    }
  }
}

@media (max-width: 640px) {
  .task-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .task-actions {
    width: 100%;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .status-tabs {
    margin: 0 -1rem;
    padding: 0 1rem;
  }
}

.btn-add {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
  background: #eff6ff;
  color: #1d4ed8;
  transition: background 0.2s ease;

  &:hover {
    background: #dbeafe;
  }
}
</style>