<template>
  <div class="pagination-bar">
    <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="$emit('page-change', currentPage - 1)"
    >
      ← Previous
    </button>

    <div class="page-selector">
      Page
      <select v-model.number="selectedPage" @change="goToPage">
        <option
            v-for="page in totalPages"
            :disabled="currentPage === 1"
            :key="page"
            :value="page"
        >
          {{ page }}
        </option>
      </select>
      of {{ totalPages }}
    </div>

    <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', currentPage + 1)"
    >
      Next →
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
  gap: 1.2rem;
  padding: 1rem 1.5rem;
  margin: 1rem auto;
  background-color: #f0f4f8;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  max-width: 600px;
}

.pagination-btn {
  background-color: #4f46e5;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease-in-out;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #4338ca;
}

.pagination-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.page-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #374151;
}

.page-selector select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
}
</style>