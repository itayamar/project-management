<template>
  <div class="data-table">
    <!-- Loading State -->
    <div v-if="loading" class="empty-state">
      <skelaton-loader :lines="4" type="card" />
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="empty-state">
      <div class="empty-state-content">
        <span class="empty-icon">{{ emptyIcon }}</span>
        <h3>{{ emptyTitle }}</h3>
        <p>{{ emptyDescription }}</p>
        <button v-if="showAddButton" class="btn btn-primary" @click="$emit('add')">
          {{ addButtonText }}
        </button>
      </div>
    </div>

    <!-- Table Content -->
    <div v-else class="table-content">
      <div class="items-grid">
        <div
          v-for="item in items"
          :key="item._id"
          class="item-card"
          :class="{ 'highlight': isHighlighted(item) }"
          @click="$emit('click', item)"
        >
          <!-- Card Content - Using Slot -->
          <slot name="card-content" :item="item">
            <!-- Default Card Content -->
            <div class="card-header">
              <h3>{{ item.name || item.title }}</h3>
            </div>
            <div class="card-body">
              <p>{{ item.description }}</p>
            </div>
          </slot>
        </div>
      </div>
      <!-- Pagination -->
      <pagination
        v-if="showPagination && items.length"
        :currentPage="currentPage"
        :totalPages="totalPages"
        :limit="limit"
        @page-change="$emit('page-change', $event)"
        @limit-change="$emit('limit-change', $event)"
      />
    </div>
  </div>
</template>

<script>
import Pagination from './Pagination.vue'
import SkelatonLoader from './SkelatonLoader.vue'

export default {
  name: '',
  components: {
    Pagination,
    SkelatonLoader
  },
  props: {
    items: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    currentPage: {
      type: Number,
      default: 1
    },
    totalPages: {
      type: Number,
      default: 1
    },
    emptyIcon: {
      type: String,
      default: '✓'
    },
    emptyTitle: {
      type: String,
      default: 'No Items'
    },
    emptyDescription: {
      type: String,
      default: 'No items to display'
    },
    showAddButton: {
      type: Boolean,
      default: true
    },
    addButtonText: {
      type: String,
      default: 'Add Item'
    },
    highlightCondition: {
      type: Function,
      default: () => false
    },
    limit: {
      type: Number,
      default: 10
    }
  },
  methods: {
    isHighlighted(item) {
      return this.highlightCondition(item)
    }
  }
}
</script>

<style lang="less" scoped>
.data-table {
  width: 100%;
}

.items-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  margin-bottom: 1.5rem;
}

.item-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.highlight {
    border-left: 4px solid #ef4444;
  }
}

.card-header {
  padding: 20px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.card-body {
  padding: 20px;
  flex: 1;

  p {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    word-break: break-word;
  }
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
  margin: 24px 0;

  .empty-state-content {
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: #eff6ff;
    border-radius: 50%;
    font-size: 28px;
    color: #2563eb;
  }

  h3 {
    color: #111827;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 12px;
  }

  p {
    color: #6b7280;
    font-size: 15px;
    line-height: 1.5;
    margin: 0 0 24px;
  }
}

@media (max-width: 640px) {
  .items-grid {
    grid-template-columns: 1fr;
  }

  .empty-state {
    margin: 16px -16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    padding: 40px 20px;

    .empty-icon {
      width: 56px;
      height: 56px;
      font-size: 24px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 18px;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      margin-bottom: 20px;
    }

    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }
}
</style> 