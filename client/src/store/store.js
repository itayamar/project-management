import Vue from "vue";
import Vuex from "vuex";
import project from './modules/project'
import task from './modules/task'

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    loading: {
      projects: false,
      project: false,
      tasks: false,
    },
    error: null
  },
  modules: {
    project,
    task
  },
  mutations: {
    SET_LOADING(state, { type, value }) {
      state.loading[type] = value
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  getters: {
    isLoading: state => type => state.loading[type],
    hasError: state => !!state.error,
    errorMessage: state => state.error
  }
});
