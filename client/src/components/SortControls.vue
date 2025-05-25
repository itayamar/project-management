<template>
  <div class="sort-controls">
    <div class="sort-label">Sort by:</div>
    <select v-model="localSortField" class="sort-select" @change="emitSortField">
      <option v-for="option in fields" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <button
        class="btn icon-btn"
        @click="toggleSort"
        :title="sortOrder === 'asc' ? 'Showing oldest first' : 'Showing newest first'"
    >
      <span class="sort-icon">{{ sortOrder === 'asc' ? '↓' : '↑' }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'SortControls',
  props: {
    fields: {
      type: Array,
      required: true // [{ value: 'dueDate', label: 'Due Date' }]
    },
    sortField: {
      type: String,
      required: true
    },
    sortOrder: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      localSortField: this.sortField
    };
  },
  watch: {
    sortField(newVal) {
      this.localSortField = newVal;
    }
  },
  methods: {
    toggleSort() {
      const newOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.$emit('update:sortOrder', newOrder);
    },
    emitSortField() {
      this.$emit('update:sortField', this.localSortField);
    }
  }
};
</script>

<style scoped>
.sort-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  font-size: 14px;
}

.sort-label {
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort-select {
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  font-weight: 500;
  color: #1f2937;
  padding: 4px 8px;
  cursor: pointer;
}

.sort-select:hover {
  color: #2563eb;
}

.sort-icon {
  font-size: 14px;
}
</style>