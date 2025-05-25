<template>
  <div class="filters-section">
    <div class="search-box">
      <input
          type="text"
          :value="searchQuery"
          @input="$emit('search', $event.target.value)"
          :placeholder="searchPlaceholder"
      >
    </div>

    <!-- Desktop tabs -->
    <div class="status-tabs desktop-only">
      <button
          role="tab"
          :aria-pressed="currentStatus === value"
          :aria-label="`Filter by status: ${label}`"
          v-for="(label, value) in statusFilters"
          :key="value"
          class="status-tab"
          :class="{ active: currentStatus === value, 'tab-all': value === defaultValue }"
          :data-status="value"
          @click="$emit('filter', value)"
      >
        <span class="status-icon" v-if="value !== defaultValue">●</span>
        {{ label }}
        <span v-if="counts && counts[value] !== undefined" class="count">
          {{ counts[value] }}
        </span>
      </button>
    </div>

    <!-- Mobile select -->
    <div class="status-select-mobile mobile-only">
      <select
          :value="currentStatus"
          @change="$emit('filter', $event.target.value)"
          class="mobile-filter-select"
      >
        <option
            v-for="(label, value) in statusFilters"
            :key="value"
            :value="value"
        >
          {{ getLabelWithCount(label, value) }}
        </option>
      </select>
      <span class="select-icon">▼</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatusFilter',
  props: {
    statusFilters: {
      type: Object,
      required: true
    },
    currentStatus: {
      type: String,
      required: true
    },
    searchQuery: {
      type: String,
      default: ''
    },
    searchPlaceholder: {
      type: String,
      required: true
    },
    defaultValue: {
      type: String,
      default: ''
    },
    counts: {
      type: Object,
      default: null
    }
  },
  methods: {
    getStatusClass(status) {
      return status && status !== this.defaultValue ? { [`tab-${status}`]: true } : {};
    },
    getLabelWithCount(label, value) {
      const count = this.counts?.[value];
      return count !== undefined ? `${label} (${count})` : label;
    }
  }
}
</script>

<style scoped lang="less">
.filters-section {
  margin-bottom: 1.5rem;
  position: relative;

  .search-box {
    margin-bottom: 1rem;

    input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.2s ease;
      background: #f9fafb;

      &:focus {
        outline: none;
        border-color: #2563eb;
        background: white;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }
  }
}

.status-tabs {
  display: flex;
  gap: 4px;
  padding: 0 1px 1px;
  margin: 0 -1rem;
  padding: 0 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  position: relative;
  border-bottom: 1px solid #e5e7eb;

  &::-webkit-scrollbar {
    display: none;
  }
}

.status-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    color: #111827;
  }

  &.active {
    color: #111827;
    border-bottom-color: #2563eb;
  }

  .status-icon {
    font-size: 8px;
  }

  .count {
    background: #e5e7eb;
    color: #4b5563;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    min-width: 24px;
    text-align: center;
  }

  &.tab-all {
    &.active {
      color: #111827;

      .count {
        background: #e5e7eb;
        color: #111827;
      }
    }
  }

  &[data-status='created'] {
    .status-icon { color: #2563eb; }
    &.active .count {
      background: #eff6ff;
      color: #1e40af;
    }
  }

  &[data-status='progress'] {
    .status-icon { color: #f59e0b; }
    &.active .count {
      background: #fef3c7;
      color: #92400e;
    }
  }

  &[data-status='completed'] {
    .status-icon { color: #10b981; }
    &.active .count {
      background: #d1fae5;
      color: #065f46;
    }
  }

  &[data-status='archived'] {
    .status-icon { color: #6b7280; }
    &.active .count {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

/* Base display states */
.desktop-only {
  display: flex !important;
}

.mobile-only {
  display: none !important;
}

.status-select-mobile {
  position: relative;
  margin-top: 8px;

  .mobile-filter-select {
    width: 100%;
    padding: 12px 16px;
    padding-right: 40px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    color: #111827;
    font-size: 15px;
    font-weight: 500;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #2563eb;
      background: white;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }

  .select-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 12px;
    pointer-events: none;
    transition: transform 0.2s ease;
  }
}

@media screen and (max-width: 640px) {
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
  }

  .filters-section {
    margin: 0 -16px 1.5rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px;

    .search-box {
      margin: 0;
      margin-bottom: 12px;

      input {
        border-radius: 6px;
      }
    }
  }
}
</style> 