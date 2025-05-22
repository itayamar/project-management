<template>
  <div v-if="isOpen" class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <h2>
          <span class="dialog-icon primary">{{ project ? '✏️' : '📁' }}</span>
          {{ project ? 'Edit Project' : 'Create New Project' }}
        </h2>
      </div>

      <div class="dialog-content">
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
                v-model="localProject.description"
                rows="4"
                placeholder="Describe the project goals, scope, and key details..."
                autocomplete="off"
            ></textarea>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>
      </div>

      <div class="buttons">
        <button type="button" class="btn btn-secondary" @click="close">
          Cancel
        </button>
        <button
            type="submit"
            class="btn btn-primary"
            :disabled="!localProject.name.trim() || (project && isUnchanged)"
            :class="{ 'btn-disabled': !localProject.name.trim() || (project && isUnchanged) }"
            @click="saveProject"
        >
          {{ project ? 'Save Changes' : 'Create Project' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    project: {
      type: Object,
      default: null
    },
    isOpen: {
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
      errorMessage: ''
    }
  },
  computed: {
    isUnchanged() {
      if (!this.project) return false // it's create mode

      return (
          this.localProject.name.trim() === this.project.name.trim() &&
          this.localProject.description.trim() === (this.project.description || '').trim()
      )
    }
  },
  watch: {
    project(newProject) {
      this.localProject = newProject
          ? { ...newProject }
          : { name: '', description: '' }
      this.errorMessage = ''
    },
    isOpen(open) {
      if (!open) {
        this.errorMessage = ''
      }
    }
  },
  methods: {
    saveProject() {
      if (!this.localProject.name.trim()) {
        this.errorMessage = 'Project name is required.'
        return
      }

      if (this.localProject.name.trim().length < 2) {
        this.errorMessage = 'Project name must be at least 2 characters long.'
        return
      }

      if (this.localProject.name.trim().length > 100) {
        this.errorMessage = 'Project name must be less than 100 characters.'
        return
      }

      this.errorMessage = ''
      this.$emit('save', {
        ...this.localProject,
        name: this.localProject.name.trim(),
        description: this.localProject.description.trim()
      })
      this.close()
    },
    close() {
      this.$emit('close')
    }
  }
}
</script>