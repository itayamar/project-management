<template>
  <div class="project-list container">
    <div class="header-section">
      <h1>Projects</h1>
      <button class="btn-add" @click="openAddModal">
        <span class="icon-btn">+</span>
        <span class="text-btn">Create Project</span>
      </button>
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
      :empty-icon="'📋'"
      :empty-title="hasActiveFilters ? 'No Projects Found' : 'No Projects Yet'"
      :empty-description="hasActiveFilters ? 'No projects match your current filters. Try adjusting your search or filter criteria.' : 'Get started by creating your first project to organize your tasks!'"
      :add-button-text="'Create Project'"
      @click="openProject"
      @edit="openEditModal"
      @delete="confirmDelete"
      @add="openAddModal"
      @page-change="handlePageChange"
    >
      <template #card-content="{ item: project }">
        <div class="card-header">
          <h3>
            {{ project.name }}
            <span v-if="project.completed" class="badge badge-completed">✔ Completed</span>
            <span v-else-if="project.inProgress" class="badge badge-inprogress">⏳ In Progress</span>
            <span v-else class="badge badge-pending">📋 Pending</span>
          </h3>
        </div>
        <div class="card-body">
          <p>{{ project.description }}</p>
        </div>
      </template>
    </data-table>

    <!-- Add/Edit Project Modal -->
    <ProjectModal
      :isOpen="isModalOpen"
      :project="selectedProject"
      @save="handleSave"
      @close="closeModal"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteDialog
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

export default {
  name: 'ProjectList',
  components: {
    ProjectModal,
    DeleteDialog,
    StatusFilter,
    DataTable
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
      }
    }
  },
  computed: {
    ...mapState({
      projects: state => state.project.projects,
      totalProjects: state => state.project.totalProjects,
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
        '': this.totalProjects || 0,
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
    totalPages() {
      return Math.ceil(this.totalProjects / this.filters.limit)
    },
    hasActiveFilters() {
      return this.filters.search || this.filters.status;
    },
    getProjectCountByStatus() {
      return (status) => this.projectCounts[status] || 0;
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
    openAddModal() {
      this.selectedProject = null
      this.isModalOpen = true
    },

    openEditModal(project) {
      this.selectedProject = project
      this.isModalOpen = true
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
    fetchProjectsPage(page) {
      this.updateFilters({ page });
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
  }
}
</script>

<style lang="less" scoped>
@import '../../styles/main.less';

.project-list {
  /* Container styles are applied via the container class */
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 16px;
  flex-wrap: wrap;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
}

.filters-section {
  margin-bottom: 2rem;

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

.project-items {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.project-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.project-item-content {
  padding: 20px;
  cursor: pointer;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

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

  p {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    flex: 1;
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

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  
  button {
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

    &:first-of-type {
      color: #059669;

      &:hover {
        background: #f0fdf4;
      }
    }

    &:last-of-type {
      color: #dc2626;

      &:hover {
        background: #fef2f2;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
  margin: 24px 0;

  .empty-state-content {
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: #eff6ff;
    border-radius: 50%;
    font-size: 28px;
    color: #2563eb;
  }

  h3 {
    color: #111827;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 12px;
  }

  p {
    color: #6b7280;
    font-size: 15px;
    line-height: 1.5;
    margin: 0 0 24px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    .btn-icon {
      font-size: 18px;
      line-height: 1;
    }

    &:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.status-tabs {
  display: flex;
  gap: 4px;
  padding-bottom: 1px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.status-tab {
  display: inline-flex;
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
    font-size: 8px;
  }

  &.tab-all {
    &.active { 
      color: #111827; 
    }
  }

  &.tab-progress {
    .status-icon { color: #f59e0b; }
  }

  &.tab-completed {
    .status-icon { color: #10b981; }
  }
}

@media (max-width: 768px) {
  .project-items {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 640px) {
  .empty-state {
    margin: 16px -16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    padding: 40px 20px;

    .empty-icon {
      width: 56px;
      height: 56px;
      font-size: 24px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 18px;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      margin-bottom: 20px;
    }

    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>