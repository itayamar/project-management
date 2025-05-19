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
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  padding: 24px;
  border-radius: 6px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

h2 {
  margin-top: 0;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 6px;
}

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

.error-message {
  color: #d9534f; /* Bootstrap danger red */
  margin-bottom: 16px;
  font-weight: 600;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}
</style>