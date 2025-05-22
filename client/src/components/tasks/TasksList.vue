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
        <button class="btn-add" @click="openCreateTaskModal">
          <span class="icon-btn">+</span>
          <span class="text-btn">Add Task</span>
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
      :limit="this.limit"
      :empty-title="currentFilter === 'ALL' ? 'No tasks yet' : `No ${statusFilters[currentFilter].toLowerCase()} tasks`"
      :empty-description="currentFilter === 'ALL' ? 'Get started by creating your first task for this project' : 'Try selecting a different filter or create a new task'"
      :add-button-text="'Add Task'"
      :highlight-condition="isPastDue"
      @add="openCreateTaskModal"
      @page-change="handlePageChange"
      @limit-change="handleLimitChange"
    >
      <template #card-content="{ item: task }">
        <task-card
          :task="task"
          @status-change="handleStatusChange"
          @edit="editTask"
          @delete="confirmDeleteTask"
        />
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
import TaskCard from '@/components/tasks/TaskCard.vue'

export default {
  name: 'TaskList',
  components: {
    DeleteModal,
    TaskModal,
    StatusFilter,
    DataTable,
    TaskCard
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

    handleLimitChange(newLimit) {
      this.limit = newLimit
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
        }).catch(err => {
          console.error('Error updating task:', err)
        })
      } else {
        this.createTask(taskData).catch(err => {
          console.error('Error creating task:', err)
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
        this.closeDeleteModal()
      } catch (err) {
        console.error('Error deleting task:', err)
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
        // Reload tasks to get updated counts
        this.loadTasks()
      }).catch(err => {
        console.error('Error updating task status:', err)
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