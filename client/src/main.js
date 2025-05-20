import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store/store";
import Toasted from 'vue-toasted'

import '@/styles/main.less'

Vue.config.productionTip = false;
Vue.use(Toasted)

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
