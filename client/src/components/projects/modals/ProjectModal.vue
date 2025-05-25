<template>
  <div v-if="isOpen" class="dialog-overlay">
    <div class="dialog">
      <header class="dialog-header">
        <h2 id="dialog-title">
          <span class="dialog-icon primary">{{ project ? '✏️' : '📁' }}</span>
          {{ project ? 'Edit Project' : 'Create New Project' }}
        </h2>
      </header>

      <section class="dialog-content">
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label for="name">Project Name</label>
            <input
                type="text"
                id="name"
                v-model.trim="localProject.name"
                placeholder="Enter a clear project name..."
                autocomplete="off"
                required
            />
          </div>

          <div class="form-group">
            <label for="description">Project Description</label>
            <textarea
                id="description"
                v-model.trim="localProject.description"
                rows="4"
                placeholder="Describe the project goals, scope, and key details..."
                autocomplete="off"
            ></textarea>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>
      </section>

      <footer class="buttons">
        <button type="button" class="btn btn-secondary" @click="close">
          Cancel
        </button>
        <button
            type="submit"
            class="btn btn-primary"
            :disabled="isBlocked || !localProject.name || (project && isUnchanged)"
            :class="{ 'btn-disabled': !localProject.name || (project && isUnchanged) }"
        >
          {{ project ? 'Save Changes' : 'Create Project' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script>
import {mapState, mapActions} from "vuex";

export default {
  name: "ProjectModal",
  props: {
    project: {
      type: Object,
      default: null
    },
    isOpen: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      localProject: this.project
          ? { ...this.project }
          : {
            name: '',
            description: ''
          },
      errorMessage: '',
      projectIdForEditing: null
    }
  },
  computed: {
    ...mapState('project', ['editingProjectIds']),
    isUnchanged() {
      if (!this.project) return false // it's create mode

      return (
          this.localProject.name === this.project.name &&
          this.localProject.description === (this.project.description || '')
      )
    }
  },
  watch: {
    project(newProject) {
      if (newProject && newProject._id) {
        this.projectIdForEditing = newProject._id;
      }
      this.localProject = newProject
          ? { ...newProject }
          : { name: '', description: '' }
      this.errorMessage = ''
    },
    isOpen(open) {
      if (!this.projectIdForEditing) return;
      if (open) {
        this.startEditingProject(this.projectIdForEditing);
      }
      else {
        this.errorMessage = ''
        this.stopEditingProject(this.projectIdForEditing);
      }
    }
  },
  methods: {
    ...mapActions('project', ['startEditingProject','stopEditingProject']),
    validate() {
      if (!this.localProject.name) {
        this.errorMessage = 'Project name is required.'
        return false
      }
      if (this.localProject.name.length < 2) {
        this.errorMessage = 'Project name must be at least 2 characters long.'
        return false
      }
      if (this.localProject.name.length > 100) {
        this.errorMessage = 'Project name must be less than 100 characters.'
        return false
      }
      this.errorMessage = ''
      return true
    },
    saveProject() {
      if (!this.validate()) return;
      this.$emit('save', { ...this.localProject })
      this.close()
    },
    close() {
      this.$emit('close')
    }
  }
}
</script>