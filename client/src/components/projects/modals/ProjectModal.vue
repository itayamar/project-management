<template>
  <div v-if="isOpen" class="dialog-overlay">
    <div class="dialog">
      <h2>{{ project ? 'Edit Project' : 'Add Project' }}</h2>

      <form @submit.prevent="saveProject">
        <div class="form-group">
          <label for="name">Project Name</label>
          <input
              type="text"
              id="name"
              v-model.trim="localProject.name"
              autocomplete="off"
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
              id="description"
              v-model="localProject.description"
              rows="4"
              autocomplete="off"
          ></textarea>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="buttons">
          <button type="submit" class="btn btn-primary">
            {{ project ? 'Save Changes' : 'Add Project' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="close">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditProjectDialog',
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
      if (!this.localProject.name) {
        this.errorMessage = 'Project name is required.'
        return
      }
      this.errorMessage = ''
      this.$emit('save', this.localProject)
      this.close()
    },
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>

input[type='text'],
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
}
</style>