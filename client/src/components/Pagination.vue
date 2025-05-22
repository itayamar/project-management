<template>
  <div class="pagination-container">
    <div class="pagination-bar">
      <button
          class="pagination-btn prev-btn"
          :disabled="currentPage === 1"
          @click="$emit('page-change', currentPage - 1)"
      >
        <span class="arrow">←</span>
        <span class="btn-text">Previous</span>
      </button>

      <div class="page-info">
        <div class="page-selector">
          <span class="page-label">Page</span>
          <select v-model.number="selectedPage" @change="goToPage" class="page-select">
            <option
                v-for="page in totalPages"
                :key="page"
                :value="page"
            >
              {{ page }}
            </option>
          </select>
          <span class="page-total">of {{ totalPages }}</span>
        </div>
        <div class="limit-selector">
          <span class="page-label">Items per page</span>
          <select v-model.number="selectedLimit" :key="selectedLimit" @change="updateLimit" class="page-select">
            <option v-for="option in limitOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
      </div>

      <button
          class="pagination-btn next-btn"
          :disabled="currentPage === totalPages"
          @click="$emit('page-change', currentPage + 1)"
      >
        <span class="btn-text">Next</span>
        <span class="arrow">→</span>
      </button>
    </div>
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
    limit: {
      type: Number,
      default: 10,
    },
    limitOptions: {
      type: Array,
      default: () => [10, 20, 50, 100],
    },
  },
  data() {
    return {
      selectedPage: this.currentPage,
      selectedLimit: this.limit,
    };
  },
  watch: {
    currentPage(newVal) {
      this.selectedPage = newVal;
    },
    limit(newVal) {
      this.selectedLimit = newVal;
    },
  },
  methods: {
    goToPage() {
      this.$emit('page-change', this.selectedPage);
    },
    updateLimit() {
      this.$emit('limit-change', this.selectedLimit);
    },
  },
};
</script>

<style scoped lang="less">
.pagination-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0 1rem;
}

.pagination-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
  min-width: 80px;
  justify-content: center;

  .arrow {
    font-size: 14px;
    line-height: 1;
    transition: transform 0.2s ease;
  }

  .btn-text {
    font-weight: 500;
  }

  &:hover:not(:disabled) {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .arrow {
      transform: translateX(2px);
    }
  }

  &.prev-btn:hover:not(:disabled) .arrow {
    transform: translateX(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    border-color: #f3f4f6;
    cursor: not-allowed;
    transform: none;

    .arrow {
      transform: none;
    }
  }
}

.page-info {
  display: flex;
  align-items: center;
  margin: 0 8px;
}

.page-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
}

.page-label {
  color: #6b7280;
  font-weight: 500;
  font-size: 13px;
}

.page-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 50px;
  text-align: center;
  appearance: none;
  background: white url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%234B5563' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")
  no-repeat right 8px center/12px;
  padding-right: 28px;

  &:hover {
    border-color: #9ca3af;
    background-color: #f9fafb;
  }

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    background-color: white;
  }

  option {
    padding: 4px 8px;
    font-weight: 500;
  }
}

.limit-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  margin-left: 16px;

  .page-label {
    font-weight: 500;
    font-size: 13px;
  }

  .page-select {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 14px;
    color: #111827;
    font-weight: 600;
    cursor: pointer;
    min-width: 50px;
    appearance: none;
    background: white url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%234B5563' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")
    no-repeat right 8px center/12px;
    padding-right: 28px;

    &:hover {
      border-color: #9ca3af;
      background-color: #f9fafb;
    }

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
      background-color: white;
    }
  }
}

.page-total {
  color: #6b7280;
  font-weight: 500;
  font-size: 13px;
}

// Mobile responsive design
@media (max-width: 640px) {
  .pagination-container {
    margin: 1.5rem -16px 1rem;
  }

  .pagination-bar {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    margin: 0 16px;
    border-radius: 8px;
  }

  .pagination-btn {
    width: 100%;
    min-width: auto;
    padding: 12px;
    font-size: 15px;

    .btn-text {
      font-weight: 600;
    }
  }

  .page-info {
    order: -1;
    margin: 0;
  }

  .page-selector {
    justify-content: center;
    gap: 12px;
  }

  .page-select {
    min-width: 60px;
    padding: 8px 12px;
    padding-right: 32px;
    font-size: 15px;
  }

  .page-label,
  .page-total {
    font-size: 14px;
  }
}

// Very small screens
@media (max-width: 480px) {
  .pagination-bar {
    padding: 12px;
  }

  .pagination-btn {
    padding: 10px 16px;
    font-size: 14px;

    .arrow {
      font-size: 16px;
    }
  }
}
</style>