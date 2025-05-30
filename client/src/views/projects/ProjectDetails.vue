<template>
  <div class="project-details container">
    <div class="header">
      <button class="btn-back" @click="goBack">
        <span class="back-icon">←</span>
        <span class="back-text">Back to Projects</span>
      </button>
    </div>

    <div v-if="isLoading('project')" class="loader-wrapper">
      <skelaton-loader :lines="4" type="card" />
    </div>

    <div v-else-if="hasError" class="error-state">
      <h2>Error loading project</h2>
      <p>{{ errorMessage }}</p>
      <button class="btn btn-primary" @click="loadProject">Retry</button>
    </div>

    <div v-else-if="project" class="content">
      <project-header
          :project="project"
          :isBlocked="isBlocked"
          @edit="editProject"
          @delete="confirmDeleteProject"
      />
      
      <task-list :project-id="project._id"/>

      <project-modal
          :isOpen="showEditModal"
          :isBlocked="isBlocked"
          :project="project"
          @close="closeEditModal"
          @save="saveProject"
      />

      <delete-modal
          :isOpen="showDeleteModal"
          :item="project"
          type="project"
          @cancel="closeDeleteModal"
          @confirm="deleteProject"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import TaskList from '@/components/tasks/TasksList.vue'
import ProjectModal from '@/components/projects/modals/ProjectModal.vue'
import DeleteModal from '@/components/modals/DeleteConfirmationDialog.vue'
import SkelatonLoader from '@/components/SkelatonLoader.vue'
import ProjectHeader from '@/components/projects/ProjectHeader.vue'

export default {
  components: {
    TaskList,
    ProjectModal,
    DeleteModal,
    SkelatonLoader,
    ProjectHeader,
    // CreateTaskModal: TaskModal
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showEditModal: false,
      showDeleteModal: false,
      isEditing: false,
    }
  },
  watch: {
    editingProjectIds: {
      handler(val) {
        console.log('Editing list changed:', val);
      },
      deep: true,
      immediate: true
    }
  },
  computed: {
    ...mapState('project', ['editingProjectIds']),
    project() {
      return this.$store.getters['project/currentProject']
    },
    isBlocked() {
      return this.project && this.editingProjectIds.includes(this.project._id);
    },
    ...mapGetters([
      'isLoading',
      'hasError',
      'errorMessage'
    ])
  },
  created() {
    this.loadProject();
  },
  beforeDestroy() {
    // Reset current viewed project
    this.$store.commit('project/SET_CURRENT_VIEWED_PROJECT', null);
  },
  methods: {
    ...mapActions('project', {
      fetchProject: 'fetchProject',
      updateProject: 'updateProject',
      deleteProject: 'deleteProject',
    }),

    async loadProject() {
      try {
        await this.fetchProject(this.id);
      } catch (error) {
        console.error('Error loading project:', error);
      }
    },

    goBack() {
      this.$router.push('/projects');
    },

    editProject() {
      this.isEditing = true
      this.showEditModal = true
    },

    async saveProject(projectForm) {
      try {
        await this.updateProject({
          projectId: this.id,
          projectData: projectForm
        })
        this.closeEditModal()
      } catch (error) {
        console.error('Error updating project:', error)
      }
    },

    confirmDeleteProject() {
      this.showDeleteModal = true
    },

    async deleteProject() {
      try {
        await this.deleteProject(this.id)
        this.$router.push('/projects')
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    },

    closeEditModal() {
      this.isEditing = false
      this.showEditModal = false
    },

    closeDeleteModal() {
      this.showDeleteModal = false
    }
  }
}
</script>

<style lang="less" scoped>
.project-details {
  font-family: 'Segoe UI', sans-serif;
  color: #1f2937;
}

.header {
  margin-bottom: 24px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  .back-icon {
    font-size: 18px;
    line-height: 1;
  }

  &:hover {
    background: #dbeafe;
    transform: translateX(-2px);
  }
}

.content {
  padding-top: 8px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;

  .title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #111827;
  }

  .description {
    font-size: 18px;
    color: #4b5563;
  }
}

.tasks-section {
  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #1f2937;
  }

  .no-tasks {
    color: #6b7280;
    font-size: 16px;
  }

  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;

    .task-item {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;

      &:last-child {
        border-bottom: none;
      }

      .task-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
        color: #111827;
      }

      .task-desc {
        color: #6b7280;
        font-size: 14px;
      }
    }
  }
}

.error-state {
  background: #fef2f2;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  text-align: center;

  h2 {
    color: #b91c1c;
    margin-bottom: 0.5rem;
  }

  p {
    color: #991b1b;
    margin-bottom: 1rem;
  }
}

.loader-wrapper {
  margin-top: 2rem;
  text-align: center;
}
</style>
