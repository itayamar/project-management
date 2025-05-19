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
    UPDATE_PROJECT(state, updatedProject) {
      const index = state.projects.findIndex(p => p._id === updatedProject._id)
      if (index !== -1) {
        Vue.set(state.projects, index, updatedProject)
      }
    },
    REMOVE_PROJECT(state, projectId) {
      state.projects = state.projects.filter(p => p._id !== projectId)
    }
  },
  actions: {
    async fetchProjects({ commit }, {page=1, limit=20} = {}) {
      try {
        commit('SET_LOADING', { type: 'projects', value: true })
        commit('SET_ERROR', null)
        const projectsData = await fetchProjects(page, limit)
        commit('SET_PROJECTS', projectsData.projects)
        commit('SET_TOTAL_PROJECTS', projectsData.total)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', { type: 'projects', value: false })
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
    async updateProject({ commit }, { projectId, projectData }) {
      try {
        const project = await updateProject(projectId, projectData)
        commit('UPDATE_PROJECT', project)
        return project
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true })
        throw error
      }
    },
    async deleteProject({ commit }, projectId) {
      try {
        const response = await deleteProject(projectId)
        commit('REMOVE_PROJECT', projectId)

        return response
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true })
        throw error
      }
    }
  },

};
