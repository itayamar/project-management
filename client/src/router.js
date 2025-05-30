import Vue from 'vue'
import VueRouter from 'vue-router'
import Projects from '@/views/projects/ProjectList.vue'
import ProjectDetails from '@/views/projects/ProjectDetails.vue'

Vue.use(VueRouter);

const routes = [
  {
    path: "/projects",
    name: "projects",
    component: Projects,
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetails',
    component: ProjectDetails,
    props: true
  },
  { path: '*', redirect: '/projects/' }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
