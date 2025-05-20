<template>
  <div class="task-list-container">
    <div class="header-section">
      <h3 class="section-title">Tasks</h3>
      <button class="btn btn-add" @click="openCreateTaskModal">
        <span class="btn-icon">+</span>Add Task
      </button>
    </div>

    <!-- Task filter controls -->
    <div class="filter-controls mb-4">
      <button
          v-for="(label, status) in statusFilters"
          :key="status"
          class="btn btn-small"
          :class="currentFilter === status ? 'btn-primary' : 'btn-secondary'"
          @click="filterTasks(status)"
      >
        {{ label }}
      </button>
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
        <div class="task-card-content">
          <div class="task-header">
            <span
                class="badge"
                :class="getStatusClass(task.state)"
            >
              {{ formatStatusLabel(task.state) }}
            </span>
            <span class="task-due-date" :class="{'text-red': isPastDue(task)}">
              Due: {{ formatDate(task.dueDate) }}
            </span>
          </div>
          <p class="task-description"> {{task.description}}</p>

          <p v-if="task.notes" class="task-notes">{{ task.notes }}</p>
          <p v-else class="task-notes text-gray text-sm">No notes</p>
        </div>

        <div class="task-actions">
          <button class="btn btn-secondary btn-small mr-2" @click="editTask(task)">
            Edit
          </button>
          <button class="btn btn-danger btn-small" @click="confirmDeleteTask(task)">
            Delete
          </button>
        </div>
      </div>
      <pagination
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
      limit: 20
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
    ])
  },
  created() {
    this.loadTasks()
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
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &-content {
    flex: 1;
  }

  &.past-due {
    border-left: 3px solid #ef4444;
  }
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.task-due-date {
  font-size: 0.875rem;
  color: #4b5563;

  &.text-red {
    color: #ef4444;
    font-weight: 500;
  }
}

.task-notes {
  margin: 0;
}

.task-actions {
  display: flex;
  align-items: center;
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

@media (max-width: 640px) {
  .task-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-actions {
    margin-top: 1rem;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>