<template>
  <div v-if="isOpen" class="dialog-overlay">
    <div class="dialog">
      <h2>Delete {{ capitalizedType }}</h2>

      <p>
        Are you sure you want to delete {{ type }}:
        "<strong>{{ type === 'project' ? item.name : item.description }}</strong>"?
      </p>

      <div class="buttons">
        <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="btn btn-danger" @click="handleConfirm">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
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
p {
  margin-bottom: 24px;
  font-size: 16px;
}
</style>