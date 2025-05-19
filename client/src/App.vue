<template>
  <div id="app">
    <div class="master-layout">
      <aside>
        <navigation />
      </aside>
      <main>
        <router-view />
      </main>
    </div>
  </div>
</template>
<script>
import Navigation from "@/components/Navigation.vue";
export default {
  components: {
    Navigation,
  },
};
</script>
<style lang="less">
#app {
  font-family: Helvetica, Arial, sans-serif;
  color: #151718;
  line-height: 1.6;
  a {
    text-decoration: none;
  }
  .master-layout {
    display: flex;
    gap: 15px;
    > aside {
      min-width: 260px;
    }
    > main {
      flex: 1;
    }
  }
}
</style>
