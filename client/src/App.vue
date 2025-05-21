<template>
  <div id="app">
    <Notifications />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import Notifications from '@/components/Notifications.vue';

export default {
  name: 'App',
  components: {
    Notifications
  },
  created() {
    // Initialize WebSocket connections
    this.$store.dispatch('project/initializeWebSocket');
    this.$store.dispatch('task/initializeWebSocket');
  }
};
</script>

<style lang="less">
#app {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background: #f9fafb;

  a {
    text-decoration: none;
  }
}

.main-content {
  max-width: 100%;
  min-height: 100vh;
  padding: 16px;
  box-sizing: border-box;
}

// Add some base styles
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .main-content {
    padding: 12px;
  }
}
</style>
