<template>
  <div id="app">
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style lang="less">
#app {
  font-family: Helvetica, Arial, sans-serif;
  color: #151718;
  line-height: 1.6;
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
