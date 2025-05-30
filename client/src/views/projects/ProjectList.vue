<template>
  <div class="project-list container">
    <div class="header-section">
      <h1>Projects</h1>
      <div class="header-actions">
        <SortControls
            :fields="[
                      { value: 'createdAt', label: '📅 Created Date' },
                      { value: 'updatedAt', label: '🔄 Last Updated' },
                      { value: 'name', label: '🔤 Name' }
                     ]"
            :sortField="sortField"
            :sortOrder="sortOrder"
            @update:sortField="sortField = $event"
            @update:sortOrder="sortOrder = $event"
        />
        <button class="btn-add" @click="openProjectModal">
          <span class="icon-btn">+</span>
          <span class="text-btn">Add Project</span>
        </button>
      </div>
    </div>

    <status-filter
      :status-filters="statusFilters"
      :current-status="filters.status"
      :search-query="searchQuery"
      :counts="statusCountMap"
      search-placeholder="Search projects..."
      @search="handleSearch"
      @filter="status => updateFilters({ status })"
    />

    <data-table
      :items="projects"
      :loading="isLoading('projects')"
      :current-page="currentPage"
      :total-pages="totalPages"
      :limit="limit"
      :empty-icon="'📋'"
      :empty-title="emptyStateText.title"
      :empty-description="emptyStateText.description"
      :add-button-text="'Create Project'"
      @click="openProject"
      @add="openProjectModal"
      @page-change="handlePageChange"
      @limit-change="handleLimitChange"
    >
      <template #card-content="{ item: project }">
        <project-card
          :project="project"
          @click="openProject(project)"
          @edit="openProjectModal(project)"
          @delete="confirmDelete(project)"
        />
      </template>
    </data-table>

    <!-- Add/Edit Project Modal -->
    <project-modal
      :isOpen="isModalOpen"
      :project="selectedProject"
      @save="handleSave"
      @close="closeModal"
    />

    <!-- Delete Confirmation Dialog -->
    <delete-dialog
      v-if="projectToDelete"
      :isOpen="isDeleteModalOpen"
      :item="projectToDelete"
      type="project"
      @confirm="handleDeleteProject"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import ProjectModal from '@/components/projects/modals/ProjectModal.vue'
import DeleteDialog from '@/components/modals/DeleteConfirmationDialog.vue'
import StatusFilter from '@/components/StatusFilter.vue'
import DataTable from '@/components/DataTable.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import SortControls from '@/components/SortControls.vue'

export default {
  name: 'ProjectList',
  components: {
    ProjectModal,
    DeleteDialog,
    StatusFilter,
    DataTable,
    ProjectCard,
    SortControls
  },
  data() {
    return {
      isModalOpen: false,
      selectedProject: null,
      isDeleteModalOpen: false,
      projectToDelete: null,
      searchTimeout: null,
      loaderLines: 2,
      statusFilters: {
        '': 'All Projects',
        'in_progress': 'In Progress',
        'completed': 'Completed'
      },
      limit: 20,
    }
  },
  computed: {
    ...mapState({
      projects: state => state.project.projects,
      filters: state => state.project.filters,
      projectCounts: state => state.project.projectCounts
    }),
    ...mapGetters([
      'isLoading',
      'hasError',
      'errorMessage'
    ]),
    statusCountMap() {
      return {
        '': this.projectCounts?.total || 0,
        'in_progress': this.projectCounts?.in_progress || 0,
        'completed': this.projectCounts?.completed || 0
      };
    },
    searchQuery: {
      get() {
        return this.filters.search;
      },
      set(value) {
        this.handleSearch(value);
      }
    },
    sortField: {
      get() {
        return this.filters.sortField;
      },
      set(value) {
        this.updateFilters({ sortField: value });
      }
    },
    sortOrder: {
      get() {
        return this.filters.sortOrder;
      },
      set(value) {
        this.updateFilters({ sortOrder: value });
      }
    },
    statusFilter: {
      get() {
        return this.filters.status;
      },
      set(value) {
        this.updateFilters({ status: value });
      }
    },
    currentPage: {
      get() {
        return this.filters.page;
      },
      set(value) {
        this.handlePageChange(value);
      }
    },
    totalProjects () {
      return this.projectCounts.total
    },
    totalPages() {
      if (!this.limit || !this.totalProjects || isNaN(this.totalProjects)) {
        return 1
      }
      return Math.ceil(this.totalProjects / this.filters.limit)
    },
    hasActiveFilters() {
      return this.filters.search || this.filters.status;
    },
    emptyStateText() {
      const hasFilters = this.hasActiveFilters;
      const statusLabel = this.statusFilters[this.filters.status] || '';
      const statusText = statusLabel && this.filters.status ? `${statusLabel}` : '';

      return {
        title: hasFilters
            ? `No ${statusText ? statusText + ' ' : ''}Projects Found`
            : 'No Projects Yet',
        description: hasFilters
            ? `No projects match your current filters${statusText ? ` (${statusText})` : ''}. Try adjusting your search or filter criteria.`
            : 'Get started by creating your first project to organize your tasks!'
      };
    }
  },
  created() {
    this.fetchProjects();
  },
  methods: {
    ...mapActions('project', [
      'fetchProjects',
      'createProject',
      'updateProject',
      'deleteProject',
      'updateFilters',
      'resetFilters'
    ]),

    openProject(project) {
      this.$router.push('/projects/' + project._id)
    },

    openProjectModal(project = null) {
      this.selectedProject = project;
      this.isModalOpen = true;
    },

    closeModal() {
      this.selectedProject = null
      this.isModalOpen = false
    },

    async handleSave(project) {
      try {
        if (project._id) {
          await this.updateProject({projectId: project._id, projectData: project})
        } else {
          await this.createProject(project)
        }
        this.closeModal()
      } catch (err) {
        console.error('Error saving project:', err)
      }
    },

    confirmDelete(project) {
      this.projectToDelete = project
      this.isDeleteModalOpen = true
    },

    closeDeleteModal() {
      this.projectToDelete = null
      this.isDeleteModalOpen = false
    },

    async handleDeleteProject() {
      if (!this.projectToDelete) return
      try {
        await this.deleteProject(this.projectToDelete._id)
      } finally {
        this.closeDeleteModal()
      }
    },

    handleSearch(value) {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.searchTimeout = setTimeout(() => {
        this.updateFilters({ search: value });
      }, 300);
    },

    handlePageChange(newPage) {
      this.fetchProjectsPage(newPage);
    },

    handleLimitChange(limit) {
      this.limit = limit;
      this.updateFilters({ limit });
    }
  }
}
</script>

<style lang="less" scoped>
.project-items {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

@media (max-width: 768px) {
  .project-items {
    grid-template-columns: 1fr;
  }
}
</style>