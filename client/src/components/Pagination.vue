<template>
  <div class="pagination-bar">
    <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="$emit('page-change', currentPage - 1)"
    >
      <span class="arrow">←</span>
      Previous
    </button>

    <div class="page-selector">
      <span class="label">Page</span>
      <select v-model.number="selectedPage" @change="goToPage" class="page-select">
        <option
            v-for="page in totalPages"
            :key="page"
            :value="page"
        >
          {{ page }}
        </option>
      </select>
      <span class="label">of {{ totalPages }}</span>
    </div>

    <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', currentPage + 1)"
    >
      Next
      <span class="arrow">→</span>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    currentPage: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      selectedPage: this.currentPage,
    };
  },
  watch: {
    currentPage(newVal) {
      this.selectedPage = newVal;
    },
  },
  methods: {
    goToPage() {
      this.$emit('page-change', this.selectedPage);
    },
  },
};
</script>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1rem;
  margin: 1.5rem auto;
  background-color: #fff;
  border-radius: 8px;
  max-width: 600px;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #dbeafe;
}

.pagination-btn:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.arrow {
  font-size: 18px;
  line-height: 1;
}

.page-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
}

.label {
  color: #6b7280;
  font-weight: 500;
}

.page-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  color: #111827;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
  appearance: none;
  background: #fff url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")
    no-repeat right 0.5rem center/1.5em;
}

.page-select:hover {
  border-color: #d1d5db;
}

.page-select:focus {
  outline: none;
  border-color: #2563eb;
  ring: 2px solid #bfdbfe;
}

@media (max-width: 640px) {
  .pagination-bar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .pagination-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>