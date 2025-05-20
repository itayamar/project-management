<template>
  <div class="project-list">
    <div class="header-section">
      <h1>Projects</h1>
      <button class="btn btn-primary" @click="openAddModal">
        Create Project
      </button>
    </div>

    <div class="filters-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search projects..."
          @input="handleSearch"
        >
      </div>
      
      <div class="status-tabs">
        <button
          v-for="(label, value) in statusFilters"
          :key="value"
          class="status-tab"
          :class="{
            'active': filters.status === value,
            'tab-all': value === '',
            'tab-progress': value === 'in_progress',
            'tab-completed': value === 'completed'
          }"
          @click="updateFilters({ status: value })"
        >
          <span class="status-icon" v-if="value">●</span>
          {{ label }}
          <span class="count" v-if="value !== ''">
            {{ getProjectCountByStatus(value) }}
          </span>
        </button>
      </div>
    </div>

    <skelaton-loader v-if="isLoading" :lines="loaderLines" type="card"></skelaton-loader>

    <div v-else-if="!projects.length" class="empty-state">
      <div class="empty-state-content">
        <span class="empty-icon">📋</span>
        <h3>No Projects Found</h3>
        <p v-if="hasActiveFilters">
          No projects match your current filters. Try adjusting your search or filter criteria.
        </p>
        <p v-else>
          There are no projects yet. Get started by creating your first project!
        </p>
        <button class="btn btn-primary" @click="openAddModal">
          Create Project
        </button>
      </div>
    </div>

    <ul v-else class="project-items">
      <li v-for="project in projects" :key="project._id" class="project-item">
        <div class="project-item-content" @click="openProject(project)">
          <h3>
            {{ project.name }}
            <span v-if="project.completed" class="badge badge-completed">✔ Completed</span>
            <span v-else-if="project.inProgress" class="badge badge-inprogress">⏳ In Progress</span>
            <span v-else class="badge badge-pending">📋 Pending</span>
          </h3>
          <p>{{ project.description }}</p>
        </div>

        <div class="actions">
          <button @click="openEditModal(project)" title="Edit project">✏️</button>
          <button @click="confirmDelete(project)" title="Delete project">🗑️</button>
        </div>
      </li>
    </ul>

    <Pagination
        v-if="projects.length"
        :currentPage="currentPage"
        :totalPages="totalPages"
        @page-change="handlePageChange"
    />

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
import { mapState, mapActions } from 'vuex'
import ProjectModal from '@/components/projects/modals/ProjectModal.vue'
import DeleteDialog from '@/components/modals/DeleteConfirmationDialog.vue'
import Pagination from '@/components/Pagination.vue'
import SkelatonLoader from '@/components/SkelatonLoader.vue'
import { showToast } from '@/common'

export default {
  name: 'ProjectList',
  components: {
    ProjectModal,
    DeleteDialog,
    Pagination,
    SkelatonLoader
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
      isLoading: state => state.isLoading,
      totalProjects: state => state.project.totalProjects,
      filters: state => state.project.filters
    }),
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
    projectCountsByStatus() {
      return {
        'in_progress': this.projects.filter(p => p.inProgress && !p.completed).length,
        'completed': this.projects.filter(p => p.completed).length
      }
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
          showToast(this.$toasted, 'Project updated successfully!')
        } else {
          await this.createProject(project)
          showToast(this.$toasted, 'Project added successfully!')
        }
      } catch (err) {
        showToast(this.$toasted, `Error: ${err.message}`, 'error')
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
        showToast(this.$toasted, 'Project deleted successfully!')
      } catch (err) {
        showToast(this.$toasted, `Error: ${err.message}`, 'error')
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
    getProjectCountByStatus(status) {
      return this.projectCountsByStatus[status] || 0
    }
  }
}
</script>

<style scoped>
.project-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &::before {
      content: "+";
      font-size: 18px;
      line-height: 1;
    }
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
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.project-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
}

.project-item-content {
  padding: 20px;
  cursor: pointer;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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

  .empty-state-content {
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
  }

  h3 {
    color: #111827;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
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

  .count {
    background: #e5e7eb;
    color: #4b5563;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  &.tab-all {
    &.active .count { 
      background: #e5e7eb; 
      color: #111827; 
    }
  }

  &.tab-progress {
    .status-icon { color: #f59e0b; }
    &.active .count { 
      background: #fef3c7; 
      color: #92400e; 
    }
  }

  &.tab-completed {
    .status-icon { color: #10b981; }
    &.active .count { 
      background: #d1fae5; 
      color: #065f46; 
    }
  }
}

@media (max-width: 640px) {
  .project-list {
    padding: 16px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }

  .project-item-content h3 {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .badge {
      align-self: flex-start;
    }
  }

  .status-tabs {
    margin: 0 -1rem;
    padding: 0 1rem;
  }
}
</style>