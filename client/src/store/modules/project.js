// projects store
import Vue from "vue";
import {fetchProjects, createProject, updateProject, fetchProject, deleteProject} from "@/services/projects";

export default {
  namespaced: true,
  state: {
    projects: [],
    currentProject: null,
    totalProjects: 0,
    projectCounts: {
      in_progress: 0,
      completed: 0,
      total: 0
    },
    filters: {
      search: '',
      status: '',
      page: 1,
      limit: 20
    }
  },
  mutations: {
    SET_PROJECTS(state, projects) {
      state.projects = projects;
    },
    SET_PROJECT_COUNTS(state, counts) {
      state.projectCounts = {
        in_progress: counts?.in_progress || 0,
        completed: counts?.completed || 0,
        total: counts?.total || 0
      };
    },
    SET_CURRENT_PROJECT(state, project) {
      state.currentProject = project
    },
    ADD_PROJECT(state, project) {
      state.projects.push(project)
    },
    SET_TOTAL_PROJECTS(state, totalProjects) {
      state.totalProjects = totalProjects;
    },
    UPDATE_CURRENT_PROJECT(state, updatedProject) {
      state.currentProject = { ...state.currentProject, ...updatedProject };
    },
    UPDATE_PROJECT(state, updatedProject) {
      const index = state.projects.findIndex(p => p._id === updatedProject._id)
      if (index !== -1) {
        Vue.set(state.projects, index, updatedProject)
      }
    },
    REMOVE_PROJECT(state, projectId) {
      state.projects = state.projects.filter(p => p._id !== projectId)
    },
    CLEAR_CURRENT_PROJECT(state) {
      state.currentProject = null;
    },
    SET_FILTERS(state, filters) {
      state.filters = { ...state.filters, ...filters };
    },
    RESET_FILTERS(state) {
      state.filters = {
        search: '',
        status: '',
        page: 1,
        limit: 20
      };
    }
  },
  actions: {
    async fetchProjects({ commit, state }, params = {}) {
      try {
        commit('SET_LOADING', { type: 'projects', value: true }, { root: true });
        commit('SET_ERROR', null, { root: true });
        
        // Update filters with new params while preserving existing ones
        if (Object.keys(params).length > 0) {
          commit('SET_FILTERS', params);
        }

        // Ensure we're passing all current filters to the API
        const projectsData = await fetchProjects({
          page: state.filters.page,
          limit: state.filters.limit,
          search: state.filters.search,
          status: state.filters.status
        });
        
        commit('SET_PROJECTS', projectsData.projects);
        commit('SET_TOTAL_PROJECTS', projectsData.total);
        commit('SET_PROJECT_COUNTS', projectsData.counts);
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true });
      } finally {
        commit('SET_LOADING', { type: 'projects', value: false }, { root: true });
      }
    },
    updateFilters({ commit, dispatch }, filters = {}) {
      // Reset to page 1 when filters change (except when explicitly changing page)
      const newFilters = { ...filters };
      if (!('page' in filters)) {
        newFilters.page = 1;
      }
      
      commit('SET_FILTERS', newFilters);
      return dispatch('fetchProjects');
    },
    resetFilters({ commit, dispatch }) {
      commit('RESET_FILTERS');
      return dispatch('fetchProjects');
    },
    async fetchProject({ commit }, projectId) {
      commit('SET_LOADING', { type: 'project', value: true }, { root: true })
      commit('SET_ERROR', null, { root: true })

      try {
        const project = await fetchProject(projectId)
        commit('SET_CURRENT_PROJECT', project)
        return project
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true })
        throw error
      } finally {
        commit('SET_LOADING', { type: 'project', value: false }, { root: true })
      }
    },
    async createProject({ commit }, projectData) {
      try {
        const project = await createProject(projectData)
        commit('ADD_PROJECT', project)
        return project
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true })
        throw error
      }
    },
    async updateProject({ commit, state }, { projectId, projectData }) {
      try {
        const updatedProject = await updateProject(projectId, projectData);
        // Update in projects list
        commit('UPDATE_PROJECT', updatedProject);
        // Update currentProject if it's the one being edited
        if (state.currentProject?._id === updatedProject._id) {
          commit('UPDATE_CURRENT_PROJECT', updatedProject);
        }

        return updatedProject;
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true });
        throw error;
      }
    },
    async deleteProject({ commit, state }, projectId) {
      try {
        await deleteProject(projectId);
        commit('REMOVE_PROJECT', projectId);

        // If the deleted project is the one currently being viewed, clear it
        if (state.currentProject?._id === projectId) {
          commit('CLEAR_CURRENT_PROJECT');
        }
        return true;
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true });
        throw error;
      }
    },
  },

};
