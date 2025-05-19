<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h2 class="modal-title">Delete {{ capitalizedType }}</h2>

      <p class="modal-message">
        Are you sure you want to delete {{ type }}:
        "<strong>{{ item.name }}</strong>"?
      </p>

      <div class="modal-actions">
        <button class="btn cancel" @click="$emit('cancel')">Cancel</button>
        <button class="btn delete" @click="handleConfirm">Delete</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteConfirmationDialog',
  props: {
    item: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      required: true,
      validator: value => ['project', 'task'].includes(value)
    },
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    capitalizedType() {
      return this.type.charAt(0).toUpperCase() + this.type.slice(1)
    }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm', this.item._id)
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-title {
  margin-top: 0;
  font-size: 22px;
  color: #dc2626; /* red */
}

.modal-message {
  margin: 1rem 0;
  font-size: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn.cancel {
  background-color: #e5e7eb; /* light gray */
  color: #374151;
}

.btn.delete {
  background-color: #dc2626; /* red */
  color: white;
}
</style>