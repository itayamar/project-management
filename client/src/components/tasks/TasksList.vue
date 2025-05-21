<template>
  <div class="task-list-container">
    <div class="header-section">
      <h3 class="section-title">Tasks</h3>
      <div class="header-actions">
        <div class="sort-controls">
          <div class="sort-label">Sort by:</div>
          <select v-model="sortField" class="sort-select">
            <option value="dueDate">⏰ Due Date</option>
            <option value="createdAt">📅 Created Date</option>
            <option value="updatedAt">🔄 Last Updated</option>
          </select>
          <button 
            class="btn btn-sort" 
            @click="toggleSort" 
            :title="sortOrder === 'asc' ? 'Showing oldest first' : 'Showing newest first'">
            <span class="sort-icon">
              {{ sortOrder === 'asc' ? '↓' : '↑' }}
            </span>
          </button>
        </div>
        <button class="btn btn-add" @click="openCreateTaskModal">
          ➕ Add Task
        </button>
      </div>
    </div>

    <!-- Task filter controls -->
    <status-filter
      :status-filters="statusFilters"
      :current-status="currentFilter"
      :search-query="searchQuery"
      :counts="statusCountMap"
      search-placeholder="Search tasks..."
      default-value="ALL"
      :status-class-map="{
        'OVERDUE': { 'tab-overdue': true },
        'CREATED': { 'tab-created': true },
        'IN_PROGRESS': { 'tab-progress': true },
        'COMPLETED': { 'tab-completed': true },
        'ARCHIVED': { 'tab-archived': true }
      }"
      @search="handleSearch"
      @filter="filterTasks"
    />

    <data-table
      :items="filteredTasks"
      :loading="isLoading('tasks')"
      :current-page="currentPage"
      :total-pages="totalTasksPages"
      :empty-icon="'✓'"
      :empty-title="currentFilter === 'ALL' ? 'No tasks yet' : `No ${statusFilters[currentFilter].toLowerCase()} tasks`"
      :empty-description="currentFilter === 'ALL' ? 'Get started by creating your first task for this project' : 'Try selecting a different filter or create a new task'"
      :add-button-text="'Add Task'"
      :highlight-condition="isPastDue"
      @add="openCreateTaskModal"
      @edit="editTask"
      @delete="confirmDeleteTask"
    >
      <template #card-content="{ item: task }">
        <div class="task-card-header">
          <div class="task-status">
            <div class="overdue-badge" v-if="isPastDue(task)">
              ⚠️ Overdue
            </div>
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
        </div>

        <div class="task-card-content">
          <div class="task-description" :class="{ 'is-expanded': expandedTasks[task._id] }">
            {{ task.description }}
            <button 
              v-if="isTextTruncated(task.description)" 
              class="expand-btn"
              @click.stop="toggleExpand(task._id)"
            >
              {{ expandedTasks[task._id] ? 'Show less' : 'Show more' }}
            </button>
          </div>
          <div v-if="task.notes" class="task-notes" :class="{ 'is-expanded': expandedTasks[task._id + '_notes'] }">
            {{ task.notes }}
            <button 
              v-if="isTextTruncated(task.notes)" 
              class="expand-btn"
              @click.stop="toggleExpand(task._id + '_notes')"
            >
              {{ expandedTasks[task._id + '_notes'] ? 'Show less' : 'Show more' }}
            </button>
          </div>
          <p v-else class="task-notes text-muted">No notes</p>
        </div>
      </template>
    </data-table>

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
import TaskModal from '@/components/tasks/modals/TaskModal.vue'
import StatusFilter from '@/components/StatusFilter.vue'
import DataTable from '@/components/DataTable.vue'
import { showToast } from '@/common'

export default {
  name: 'TaskList',
  components: {
    DeleteModal,
    TaskModal,
    StatusFilter,
    DataTable
  },
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
      sortField: 'dueDate',
      sortOrder: 'asc',
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
        OVERDUE: 'Overdue',
        CREATED: 'Created',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
        ARCHIVED: 'Archived'
      },
      currentPage: 1,
      limit: 20,
      searchTimeout: null,
      expandedTasks: {}
    }
  },
  mounted() {
    this.checkStatusTabsScroll();
    window.addEventListener('resize', this.checkStatusTabsScroll);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkStatusTabsScroll);
  },
  computed: {
    ...mapState({
      tasks: state => state.task.tasks,
      totalTasks: state => state.task.totalTasks,
      taskCounts: state => state.task.taskCounts
    }),
    totalTasksPages() {
      return Math.ceil(this.totalTasks / this.limit)
    },
    filteredTasks() {
      let tasks = [...this.tasks];
      
      if (this.currentFilter === 'OVERDUE') {
        return this.sortTasks(tasks.filter(task => this.isPastDue(task)));
      }
      
      if (this.currentFilter === 'ALL') {
        return this.sortTasks(tasks);
      }
      
      return this.sortTasks(tasks.filter(task => task.state === this.currentFilter));
    },
    ...mapGetters([
      'isLoading',
      'hasError',
      'errorMessage'
    ]),
    taskCountsByStatus() {
      const overdueTasks = this.tasks.filter(t => this.isPastDue(t));
      return {
        OVERDUE: overdueTasks.length,
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
    },
    statusCountMap() {
      return {
        ALL: this.totalTasks,
        OVERDUE: this.taskCounts.OVERDUE || 0,
        CREATED: this.taskCounts.CREATED || 0,
        IN_PROGRESS: this.taskCounts.IN_PROGRESS || 0,
        COMPLETED: this.taskCounts.COMPLETED || 0,
        ARCHIVED: this.taskCounts.ARCHIVED || 0
      };
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
      // Sort by selected field first
      const sortedTasks = [...tasks].sort((a, b) => {
        let valueA, valueB;
        
        switch (this.sortField) {
          case 'dueDate':
            valueA = new Date(a.dueDate);
            valueB = new Date(b.dueDate);
            break;
          case 'createdAt':
            valueA = new Date(a.createdAt);
            valueB = new Date(b.createdAt);
            break;
          case 'updatedAt':
            valueA = new Date(a.updatedAt || a.createdAt);
            valueB = new Date(b.updatedAt || b.createdAt);
            break;
          default:
            valueA = new Date(a.dueDate);
            valueB = new Date(b.dueDate);
        }
        
        return this.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      });

      // Then sort by state
      const stateOrder = {
        'CREATED': 0,
        'IN_PROGRESS': 1,
        'COMPLETED': 2,
        'ARCHIVED': 3
      };

      return sortedTasks.sort((a, b) => {
        if (a.state === b.state) return 0;
        return stateOrder[a.state] - stateOrder[b.state];
      });
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
        // Reload tasks to get updated counts
        this.loadTasks()
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
    },
    isTextTruncated(text) {
      return text && text.length > 150;
    },
    toggleExpand(taskId) {
      this.$set(this.expandedTasks, taskId, !this.expandedTasks[taskId]);
    },
    checkStatusTabsScroll() {
      const tabsContainer = this.$el.querySelector('.status-tabs');
      if (tabsContainer) {
        const hasScroll = tabsContainer.scrollWidth > tabsContainer.clientWidth;
        tabsContainer.classList.toggle('has-scroll', hasScroll);
      }
    },
    toggleSort() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    }
  }
}
</script>

<style lang="less" scoped>
.task-list-container {
  position: relative;
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 16px;
  flex-wrap: wrap;

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    padding: 0 4px;
    height: 40px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .sort-label {
      padding-left: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      white-space: nowrap;
    }

    .sort-select {
      padding: 0 8px;
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      border: none;
      outline: none;
      cursor: pointer;
      background: transparent;
      appearance: none;
      min-width: 140px;

      option {
        font-size: 14px;
      }

      &:hover {
        color: #2563eb;
      }
    }

    .btn-sort {
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 16px;

      &:hover {
        background: #f3f4f6;
        color: #2563eb;
      }

      .sort-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        line-height: 1;
        transition: transform 0.2s ease;
        transform-origin: center;
        will-change: transform;
      }
    }
  }

  .btn-add {
    white-space: nowrap;
  }
}

.task-card-header {
  padding: 12px 16px;
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
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
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
  flex: 1;

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
    font-size: 0.9375rem;
    color: #111827;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .task-notes {
    font-size: 0.875rem;
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
    font-size: 0.875rem;
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

@media (max-width: 480px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;

    .header-actions {
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .sort-controls {
      width: 100%;
      justify-content: space-between;

      .sort-select {
        flex: 1;
      }
    }

    .btn-add {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>