<template>
  <div
      class="skeleton"
      :class="typeClass"
      :style="{ width }"
      role="status"
      aria-busy="true"
  >
    <template v-if="type === 'card'">
      <div class="skeleton-header"></div>
      <div class="skeleton-subheader"></div>
      <div
          v-for="n in lines"
          :key="`card-line-${n}`"
          class="skeleton-line"
          :style="{ height: lineHeight }"
      />
      <div class="skeleton-footer"></div>
    </template>
    <template v-else>
      <div
          v-for="n in lines"
          :key="`line-${n}`"
          class="skeleton-line"
          :style="{ height: lineHeight }"
      />
    </template>
  </div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    width: {
      type: String,
      default: '100%',
    },
    type: {
      type: String,
      default: 'card',
      validator: value => ['card', 'lines'].includes(value),
    },
    lines: {
      type: Number,
      default: 3,
    },
    lineHeight: {
      type: String,
      default: '12px',
    },
  },
  computed: {
    typeClass() {
      return this.type === 'card' ? 'skeleton-card' : 'skeleton-lines';
    },
  },
};
</script>

<style scoped>
.skeleton {
  box-sizing: border-box;
  animation: fadeIn 0.3s ease-in-out;
  --skeleton-color1: #eee;
  --skeleton-color2: #ddd;
  --skeleton-radius: 4px;
  --shimmer-duration: 1.2s;
}

.skeleton-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-header,
.skeleton-subheader,
.skeleton-line,
.skeleton-footer {
  background: linear-gradient(
      90deg,
      var(--skeleton-color1) 25%,
      var(--skeleton-color2) 37%,
      var(--skeleton-color1) 63%
  );
  background-size: 400% 100%;
  animation: shimmer var(--shimmer-duration) infinite linear;
  border-radius: var(--skeleton-radius);
}

.skeleton-header {
  height: 20px;
  width: 60%;
}

.skeleton-subheader {
  height: 16px;
  width: 40%;
}

.skeleton-line {
  width: 100%;
}

.skeleton-footer {
  height: 16px;
  width: 30%;
  margin-top: 8px;
}

@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>