// projects store
import Vue from "vue";
import {fetchProjects, createProject, updateProject, fetchProject, deleteProject} from "@/services/projects";

export default {
  namespaced: true,
  state: {
    projects: [],
    currentProject: null,
    totalProjects: 0,
  },
  mutations: {
    SET_PROJECTS(state, projects) {
      state.projects = projects;
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
  },
  actions: {
    async fetchProjects({ commit }, {page=1, limit=20} = {}) {
      try {
        commit('SET_LOADING', { type: 'projects', value: true }, { root: true })
        commit('SET_ERROR', null, { root: true })
        const projectsData = await fetchProjects(page, limit)
        commit('SET_PROJECTS', projectsData.projects)
        commit('SET_TOTAL_PROJECTS', projectsData.total)
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true })
      } finally {
        commit('SET_LOADING', { type: 'projects', value: false }, { root: true })
      }
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
