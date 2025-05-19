<template>
  <div class="project-list">
    <div class="header-section">
      <h2 class="section-title">Projects</h2>
      <button class="btn btn-primary" @click="openCreateProjectModal">
        <span class="btn-icon">+</span>New Project
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading('project') || isLoading('tasks')" class="empty-state">
      <p>Loading projects...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="empty-state">
      <h3>Error loading projects</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn btn-primary mt-3" @click="loadProjects">Retry</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="projects.length === 0" class="empty-state">
      <h3>No projects yet</h3>
      <p>Create your first project to get started</p>
      <button class="btn btn-primary mt-3" @click="openCreateProjectModal">
        <span class="btn-icon">+</span>New Project
      </button>
    </div>
    

    <!-- Project Table -->
    <div v-else class="row">
      <div
          v-for="project in paginatedProjects"
          :key="project._id"
          class="col-12 col-md-6 col-sm-12 mb-4"
      >
        <div class="card">
          <div class="card-header">
            <div class="card-title">{{ project.name }}</div>
          </div>

          <div class="card-content">
            <p v-if="project.description" class="text-gray">
              {{ project.description }}
            </p>
            <p v-else class="text-gray text-sm">
              No description
            </p>
          </div>

          <div class="card-footer">
            <router-link :to="`/projects/${project._id}`">
              <button class="btn btn-secondary">View Tasks</button>
            </router-link>

            <div>
              <button class="btn btn-secondary btn-small mr-2" @click="editProject(project)">
                Edit
              </button>
              <button class="btn btn-danger btn-small" @click="confirmDelete(project)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <Pagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          @page-changed="currentPage = $event"
      />
    </div>

    <!-- Project Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Project' : 'Create Project' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveProject">
            <div class="form-group">
              <label class="form-label" for="name">Project Name</label>
              <input
                  id="name"
                  v-model="projectForm.name"
                  class="form-input"
                  type="text"
                  required
                  :class="{'error': errors.name}"
              >
              <p v-if="errors.name" class="error-message">{{ errors.name }}</p>
            </div>

            <div class="form-group">
              <label class="form-label" for="description">Description (optional)</label>
              <input
                  id="description"
                  v-model="projectForm.description"
                  class="form-input"
                  type="text"
              >
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary mr-2" @click="closeModal">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-btn" @click="closeDeleteModal">&times;</button>
        </div>

        <div class="modal-body">
          <p>Are you sure you want to delete "{{ projectToDelete ? projectToDelete.name : '' }}"?</p>
          <p class="text-gray text-sm">This will also delete all tasks associated with this project and cannot be undone.</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary mr-2" @click="closeDeleteModal">
            Cancel
          </button>
          <button class="btn btn-danger" @click="removeProject">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import Pagination from "@/components/Pagination.vue";
import { showToast } from '@/common'

export default {
  name: 'ProjectList',
  data() {
    return {
      showModal: false,
      showDeleteModal: false,
      isEditing: false,
      projectToDelete: null,
      projectForm: {
        name: '',
        description: ''
      },
      errors: {},
      currentPage: 1,
      projectsPerPage: 20
    }
  },
  components: {Pagination},
  computed: {
    ...mapState({
      projects: state => state.projects.projects,
      totalProjects: state => state.projects.totalProjects
    }),
    ...mapGetters([
      'isLoading',
      'hasError',
      'errorMessage'
    ]),
    paginatedProjects() {
      const start = (this.currentPage - 1) * this.projectsPerPage
      const end = start + this.projectsPerPage
      return this.projects.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.totalProjects / this.projectsPerPage)
    }
  },
  created() {
    this.loadProjects()
  },
  methods: {
    ...mapActions({
      fetchProjects: 'fetchProjects',
      createProject: 'createProject',
      updateProject: 'updateProject',
      deleteProject: 'deleteProject'
    }),

    loadProjects(page = this.currentPage) {
      this.currentPage = page
      this.fetchProjects({ page, limit: this.projectsPerPage })
    },

    validateForm() {
      this.errors = {}
      let isValid = true

      if (!this.projectForm.name.trim()) {
        this.errors.name = 'Project name is required'
        isValid = false
      } else if (this.projectForm.name.trim().length < 3) {
        this.errors.name = 'Project name must be at least 3 characters'
        isValid = false
      }

      return isValid
    },

    openCreateProjectModal() {
      this.isEditing = false
      this.projectForm = {
        name: '',
        description: ''
      }
      this.showModal = true
    },

    editProject(project) {
      this.isEditing = true
      this.projectForm = {
        name: project.name,
        description: project.description || ''
      }
      this.projectToEdit = project
      this.showModal = true
    },

    async saveProject() {
      if (!this.validateForm()) return

      try {
        if (this.isEditing) {
          await this.updateProject({
            projectId: this.projectToEdit._id,
            projectData: this.projectForm
          })
          showToast(this.$toasted, 'Project updated successfully!')
        } else {
          await this.createProject(this.projectForm)
          showToast(this.$toasted, 'Project created successfully!')
        }
        this.closeModal()
      } catch (error) {
        showToast(this.$toasted, `Error: ${error.message}`, 'error')
      }
    },

    confirmDelete(project) {
      this.projectToDelete = project
      this.showDeleteModal = true
    },

    async removeProject() {
      if (!this.projectToDelete) return

      try {
        await this.deleteProject(this.projectToDelete._id)
        showToast(this.$toasted, 'Project deleted successfully!')
        this.closeDeleteModal()
      } catch (error) {
        showToast(this.$toasted, `Error: ${error.message}`, 'error')
      }
    },

    closeModal() {
      this.showModal = false
      this.projectForm = { name: '', description: '' }
      this.errors = {}
      this.projectToEdit = null
    },

    closeDeleteModal() {
      this.showDeleteModal = false
      this.projectToDelete = null
    }
  }
}
</script>

<style lang="less" scoped>
@primary-color: #3b82f6;
@secondary-color: #f3f4f6;
@danger-color: #ef4444;
@gray-text: #6b7280;

.project-list {
  padding: 2rem;

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .section-title {
      font-size: 2rem;
      font-weight: 700;
      color: @primary-color;
    }

    .btn-primary {
      background-color: @primary-color;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      font-weight: bold;
      transition: background-color 0.3s;

      &:hover {
        background-color: darken(@primary-color, 10%);
      }

      .btn-icon {
        margin-right: 0.5rem;
        font-size: 1.2rem;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 4rem;
    background: @secondary-color;
    border: 1px solid #d1d5db;
    border-radius: 10px;

    h3 {
      font-size: 1.5rem;
      font-weight: bold;
    }

    p {
      color: @gray-text;
      margin: 1rem 0;
    }
  }

  .card {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 1rem;
    margin: 0.5rem 0;
    background: white;
    transition: box-shadow 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .card-header {
      margin-bottom: 1rem;

      .card-title {
        font-size: 1.25rem;
        font-weight: bold;
        color: @primary-color;
      }
    }

    .card-content {
      margin-bottom: 1rem;

      .text-gray {
        color: @gray-text;
      }

      .text-sm {
        font-size: 0.85rem;
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;

      .btn {
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 600;
        border: none;
        cursor: pointer;

        &-secondary {
          background: @secondary-color;
          color: #374151;

          &:hover {
            background: darken(@secondary-color, 5%);
          }
        }

        &-danger {
          background: @danger-color;
          color: white;

          &:hover {
            background: darken(@danger-color, 10%);
          }
        }

        &-small {
          font-size: 0.75rem;
          padding: 0.3rem 0.6rem;
        }
      }
    }
  }
}

// Modal styles
.modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  &-content {
    background-color: #fff;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  &-header {
    background: @secondary-color;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: bold;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
    }
  }

  &-body {
    padding: 1.5rem;

    .form-group {
      margin-bottom: 1rem;

      .form-label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .form-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 5px;
        font-size: 1rem;

        &.error {
          border-color: @danger-color;
        }
      }

      .error-message {
        color: @danger-color;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }
    }
  }

  &-footer {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;

    .btn {
      margin-left: 0.5rem;
    }
  }
}
</style>