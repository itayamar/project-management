import Vue from "vue";
import VueRouter from "vue-router";
import Home from "./views/home/Home.vue";
import Projects from "./views/projects/ProjectList.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
  },
  {
    path: "/projects",
    name: "projects",
    component: Projects,
  },
  // {
  //   path: '/projects/:id',
  //   name: 'ProjectDetails',
  //   component: ProjectDetails,
  //   props: true
  // },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
