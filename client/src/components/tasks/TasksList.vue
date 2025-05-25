<template>
  <div class="task-list-container">
    <div class="header-section">
      <h3 class="section-title">Tasks</h3>
      <div class="header-actions">
        <SortControls
            :fields="[
                      { value: 'dueDate', label: '⏰ Due Date' },
                      { value: 'createdAt', label: '📅 Created Date' },
                      { value: 'updatedAt', label: '🔄 Last Updated' }
                     ]"
            :sortField="sortField"
            :sortOrder="sortOrder"
            @update:sortField="sortField = $event"
            @update:sortOrder="sortOrder = $event"
        />
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
      @search="handleSearch"
      @filter="filterTasks"
    />
    <data-table
      :items="tasks"
      :loading="isLoading('tasks')"
      :current-page="currentPage"
      :total-pages="totalTasksPages"
      :empty-icon="'✓'"
      :limit="this.limit"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
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
import SortControls from '@/components/SortControls.vue'

export default {
  name: 'TaskList',
  components: {
    DeleteModal,
    TaskModal,
    StatusFilter,
    DataTable,
    TaskCard,
    SortControls
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
      taskToEdit: null,
      taskToDelete: null,
      errors: {},
      statusFilters: {
        '' : 'All',
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
    this.checkStatusTabsScroll()
    window.addEventListener('resize', this.checkStatusTabsScroll);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkStatusTabsScroll);
  },
  computed: {
    ...mapState({
      tasks: state => state.task.tasks,
      totalTasks: state => state.task.totalTasks,
      taskCounts: state => state.task.taskCounts,
      filters: state => state.task.filters,
    }),
    ...mapGetters([
      'isLoading',
      'hasError',
      'errorMessage'
    ]),
    sortField: {
      get() {
        return this.filters.sortField;
      },
      set(value) {
        this.updateFilters({
          projectId: this.projectId,
          filters: { sortField: value }
        })
      }
    },
    sortOrder: {
      get() {
        return this.filters.sortOrder;
      },
      set(value) {
        this.updateFilters({
          projectId: this.projectId,
          filters: { sortOrder: value }
        })
      }
    },
    totalTasksPages() {
      return Math.ceil(this.totalTasks / this.limit)
    },
    currentFilter: {
      get() {
        return this.filters.status || '';
      },
      set(value) {
        this.updateFilters({
          projectId: this.projectId,
          filters: { status: value }
        });
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
        '': this.taskCounts.ALL,
        OVERDUE: this.taskCounts.OVERDUE || 0,
        CREATED: this.taskCounts.CREATED || 0,
        IN_PROGRESS: this.taskCounts.IN_PROGRESS || 0,
        COMPLETED: this.taskCounts.COMPLETED || 0,
        ARCHIVED: this.taskCounts.ARCHIVED || 0
      }
    },
    emptyTitle() {
      const label = this.statusFilters[this.currentFilter];
      return label ? `No ${label.toLowerCase()} tasks` : 'No tasks yet'
    },
    emptyDescription() {
      const label = this.statusFilters[this.currentFilter];
      return label ? 'Try selecting a different filter or create a new task' :
          'Get started by creating your first task for this project'
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
      deleteTask: 'deleteTask',
      updateFilters: 'updateFilters'
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
    openCreateTaskModal() {
      this.isEditing = false
      this.showTaskModal = true
    },

    editTask(task) {
      this.isEditing = true
      this.taskToEdit = task

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
      this.errors = {}
      this.taskToEdit = null
    },

    closeDeleteModal() {
      this.showDeleteModal = false
      this.taskToDelete = null
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
    handleSearch(value) {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      const searchValue = typeof value === 'string' ? value : value?.target?.value || '';

      this.searchTimeout = setTimeout(() => {
        this.updateFilters({
          projectId: this.projectId,
          filters: { search: searchValue }
        });
      }, 300);
    },
    checkStatusTabsScroll() {
      const tabsContainer = this.$el.querySelector('.status-tabs');
      if (tabsContainer) {
        const hasScroll = tabsContainer.scrollWidth > tabsContainer.clientWidth;
        tabsContainer.classList.toggle('has-scroll', hasScroll);
      }
    }
  }
}
</script>

<style lang="less" scoped>
.task-list-container {
  position: relative;
  width: 100%;
}
</style>