<template>
  <nav class="master-navigation">
    <router-link to="/" class="master-logo">My Test App</router-link>
    <router-link to="/projects">Projects</router-link>
    <router-link to="/projects/<project-id-1>" class="child">
      Sample Project 1
    </router-link>
    <router-link to="/projects/<project-id-2>" class="child">
      Sample Project 2
    </router-link>
  </nav>
</template>
<style lang="less">
nav.master-navigation {
  padding: 20px;
  .master-logo {
    font-size: 24px;
    min-height: 56px;
    display: flex;
    align-items: center;
    margin: 0 0 20px 0;
  }
  a {
    font-weight: bold;
    display: flex;
    color: inherit;
    &.child {
      font-weight: normal;
      font-size: 14px;
    }
  }
}
</style>