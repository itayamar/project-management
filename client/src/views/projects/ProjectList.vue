<template>
  <div class="project-list">
    <h1>Projects</h1>

    <button class="btn btn-primary" @click="openAddModal">
      Add Project
    </button>

    <div v-if="isLoading" class="loader">Loading...</div>

    <ul v-else class="project-items">
      <li v-for="project in projects" :key="project._id" class="project-item">
        <h3>{{ project.name }}</h3>
        <p>{{ project.description }}</p>

        <div class="actions">
          <button @click="openEditModal(project)">Edit</button>
          <button @click="confirmDelete(project)">Delete</button>
        </div>
      </li>
    </ul>

    <Pagination
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
import ProjectModal from '@/components/modals/ProjectModal.vue'
import DeleteDialog from '@/components/modals/DeleteConfirmationDialog.vue'
import Pagination from "@/components/Pagination.vue";
import { showToast } from '@/common'

export default {
  name: 'ProjectList',
  components: {
    ProjectModal,
    DeleteDialog,
    Pagination
  },
  data() {
    return {
      isModalOpen: false,
      selectedProject: null,
      isDeleteModalOpen: false,
      projectToDelete: null,
      currentPage: 1,
      limit: 10,
    }
  },
  computed: {
    ...mapState({
      projects: state => state.project.projects,
      isLoading: state => state.isLoading,
      totalProjects: state => state.project.totalProjects,
    }),
    totalPages() {
      return Math.ceil(this.totalProjects / this.limit)
    },
  },
  created() {
    this.fetchProjectsPage(this.currentPage)
  },
  methods: {
    ...mapActions('project', ['fetchProjects', 'createProject', 'updateProject', 'deleteProject']),

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
          console.log(project._id, project)
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
      this.$store.dispatch('project/fetchProjects', {
        page,
        limit: this.limit
      })
    },
    handlePageChange(newPage) {
      this.currentPage = newPage
      this.fetchProjectsPage(newPage)
    },
  }
}
</script>

<style scoped>
.project-list {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.loader {
  text-align: center;
  margin-top: 30px;
  font-size: 18px;
}

.project-items {
  list-style: none;
  padding: 0;
}

.project-item {
  border: 1px solid #ccc;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 6px;
}

.project-item h3 {
  margin: 0 0 8px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.actions button {
  padding: 6px 12px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}

.actions button:first-of-type {
  background-color: #007bff;
  color: white;
}

.actions button:last-of-type {
  background-color: #dc3545;
  color: white;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  margin-bottom: 20px;
  font-weight: bold;
  cursor: pointer;
}

.btn-primary {
  background-color: #28a745;
  color: white;
}
</style>