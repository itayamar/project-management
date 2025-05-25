// projects store
import Vue from "vue";
import {fetchProjects, createProject, updateProject, fetchProject, deleteProject} from "@/services/projects";
import wsService, { WS_EVENTS } from "@/services/websocket";
import router from "@/router";

export default {
  namespaced: true,
  state: {
    projects: [],
    currentViewedProjectId: null, // Single source of truth for current project
    editingProjectIds: [],
    projectCounts: {
      in_progress: 0,
      completed: 0,
      total: 0
    },
    filters: {
      search: '',
      status: '',
      page: 1,
      limit: 20,
      sortField: 'createdAt',
      sortOrder: 'desc'
    },
    lastActionId: null, // Track our last action
    lastActionIdTimeout: null // Track the timeout for lastActionId
  },
  mutations: {
    SET_PROJECTS(state, projects) {
      state.projects = projects;
    },
    SET_PROJECT_COUNTS(state, counts) {
      state.projectCounts = counts;
    },
    ADD_PROJECT(state, project) {
      state.projects.unshift(project);
      state.totalProjects++;
    },
    UPDATE_PROJECT(state, updatedProject) {
      const index = state.projects.findIndex(p => p._id === updatedProject._id);
      if (index !== -1) {
        Vue.set(state.projects, index, updatedProject);
      }
    },
    REMOVE_PROJECT(state, projectId) {
      state.projects = state.projects.filter(p => p._id !== projectId);
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
    },
    SET_LAST_ACTION(state, id) {
      state.lastActionId = id;
      // Clear the ID after 2 seconds to prevent stale state
      if (state.lastActionIdTimeout) {
        clearTimeout(state.lastActionIdTimeout);
      }
      state.lastActionIdTimeout = setTimeout(() => {
        state.lastActionId = null;
      }, 2000);
    },
    SET_CURRENT_VIEWED_PROJECT(state, projectId) {
      state.currentViewedProjectId = projectId;
    },
    ADD_EDITING_PROJECT(state, projectId) {
      if (!state.editingProjectIds.includes(projectId)) {
        state.editingProjectIds.push(projectId);
      }
    },
    REMOVE_EDITING_PROJECT(state, projectId) {
      console.log('removing project', projectId);
      state.editingProjectIds = state.editingProjectIds.filter(id => id !== projectId);
      console.log(state.editingProjectIds);
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
          status: state.filters.status,
          sortField: state.filters.sortField,
          sortOrder: state.filters.sortOrder
        });
        
        commit('SET_PROJECTS', projectsData.projects);
        commit('SET_PROJECT_COUNTS', ...projectsData.counts);
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
    async fetchProject({ commit, state }, projectId) {
      commit('SET_LOADING', { type: 'project', value: true }, { root: true });
      commit('SET_ERROR', null, { root: true });
      commit('SET_CURRENT_VIEWED_PROJECT', projectId);

      try {
        // Always fetch from API to ensure we have the latest data
        const project = await fetchProject(projectId);
        
        // Update or add the project in the store
        const index = state.projects.findIndex(p => p._id === projectId);
        if (index !== -1) {
          commit('UPDATE_PROJECT', project);
        } else {
          commit('ADD_PROJECT', project);
        }
        
        return project;
      } catch (error) {
        commit('SET_ERROR', error.message, { root: true });
        throw error;
      } finally {
        commit('SET_LOADING', { type: 'project', value: false }, { root: true });
      }
    },
    async createProject({ commit, dispatch }, projectData) {
      try {
        const project = await createProject(projectData);
        commit('ADD_PROJECT', project);
        
        dispatch('notifications/showNotification', {
          type: 'project',
          message: `Project "${project.name}" has been created successfully`,
          notificationType: 'success',
          autoClose: true
        }, { root: true });
        
        return project;
      } catch (error) {
        dispatch('notifications/showNotification', {
          type: 'project',
          message: `Failed to create project: ${error.message}`,
          notificationType: 'error',
          autoClose: true
        }, { root: true });
        commit('SET_ERROR', error.message, { root: true });
        throw error;
      }
    },
    async updateProject({ commit, dispatch }, { projectId, projectData }) {
      try {
        dispatch('notifications/setLastAction', projectId, { root: true });
        const updatedProject = await updateProject(projectId, projectData);
        
        commit('UPDATE_PROJECT', updatedProject);

        dispatch('notifications/showNotification', {
          type: 'project',
          message: `Project "${updatedProject.name}" has been updated successfully`,
          notificationType: 'success',
          autoClose: true
        }, { root: true });

        return updatedProject;
      } catch (error) {
        dispatch('notifications/showNotification', {
          type: 'project',
          message: `Failed to update project: ${error.message}`,
          notificationType: 'error',
          autoClose: true
        }, { root: true });
        commit('SET_ERROR', error.message, { root: true });
        throw error;
      }
    },
    async deleteProject({ commit, dispatch, state }, projectId) {
      try {
        dispatch('notifications/setLastAction', projectId, { root: true });
        const projectToDelete = state.projects.find(p => p._id === projectId);
        const projectName = projectToDelete?.name || 'Project';

        await deleteProject(projectId);
        commit('REMOVE_PROJECT', projectId);
        
        if (state.currentViewedProjectId === projectId) {
          commit('SET_CURRENT_VIEWED_PROJECT', null);
        }

        dispatch('notifications/showNotification', {
          type: 'project',
          message: `Project "${projectName}" has been deleted successfully`,
          notificationType: 'success',
          autoClose: true
        }, { root: true });

        return true;
      } catch (error) {
        dispatch('notifications/showNotification', {
          type: 'project',
          message: `Failed to delete project: ${error.message}`,
          notificationType: 'error',
          autoClose: true
        }, { root: true });
        commit('SET_ERROR', error.message, { root: true });
        throw error;
      }
    },
    // Initialize WebSocket listeners
    initializeWebSocket({ commit, state, dispatch, rootState }) {
      wsService.connect();

      // Listen for project updates
      wsService.subscribe(WS_EVENTS.PROJECT_UPDATED, (data) => {
        const project = data;
        if (project && project._id) {
          commit('UPDATE_PROJECT', project);

          const lastActionId = rootState.notifications.lastActionId;
          if (lastActionId !== project._id && 
              (!state.currentViewedProjectId || state.currentViewedProjectId === project._id)) {
            dispatch('notifications/showNotification', {
              type: 'project',
              message: `Project "${project.name}" has been updated by another user`,
              notificationType: 'info',
              autoClose: false
            }, { root: true });
          }
        }
      });

      // Listen for new projects
      wsService.subscribe(WS_EVENTS.PROJECT_CREATED, (data) => {
        const project = data;
        if (project && project.name) {
          commit('ADD_PROJECT', project);
          const lastActionId = rootState.notifications.lastActionId;
          if (lastActionId !== project._id && !state.currentViewedProjectId) {
            dispatch('notifications/showNotification', {
              type: 'project',
              message: `New project "${project.name}" has been created by another user`,
              notificationType: 'info',
              autoClose: false
            }, { root: true });
          }
          dispatch('fetchProjects');
        }
      });

      // Listen for project deletions
      wsService.subscribe(WS_EVENTS.PROJECT_DELETED, (data) => {
        const projectId = data._id;
        const deletedProject = data

        if (deletedProject) {
          const projectName = data.name;
          commit('REMOVE_PROJECT', projectId);

          const isViewingDeletedProject = state.currentViewedProjectId === projectId;

          if (isViewingDeletedProject) {
            commit('SET_CURRENT_VIEWED_PROJECT', null);

            // Redirect and notify
            router.push('/projects');

            dispatch('notifications/showNotification', {
              type: 'project',
              message: `The project "${projectName}" was deleted by another user.`,
              notificationType: 'info',
              autoClose: false
            }, { root: true });
          }

          const lastActionId = rootState.notifications.lastActionId;
          if (lastActionId !== projectId && !isViewingDeletedProject) {
            dispatch('notifications/showNotification', {
              type: 'project',
              message: `Project "${projectName}" has been deleted by another user.`,
              notificationType: 'info',
              autoClose: false
            }, { root: true });
          }

          dispatch('fetchProjects');
        }
      });

      wsService.subscribe(WS_EVENTS.START_EDITING_PROJECT, ({ id }) => {
        commit('ADD_EDITING_PROJECT', id);
        dispatch('notifications/showNotification', {
          type: 'project',
          message: 'This project is being edited by someone else.',
          notificationType: 'warning',
          autoClose: false
        }, { root: true });
        console.log('START_EDITING_PROJECT', id)
      });

      wsService.subscribe(WS_EVENTS.STOP_EDITING_PROJECT, ({ id }) => {
        if (!id) {
          console.warn('stopEditingProject called with missing ID');
          return;
        }
        commit('REMOVE_EDITING_PROJECT', id);
      });
    },
    startEditingProject(_, id) {
      wsService.send(WS_EVENTS.START_EDITING_PROJECT, { id });
    },
    stopEditingProject(_, id) {
      wsService.send(WS_EVENTS.STOP_EDITING_PROJECT, { id });
    }
  },
  getters: {
    currentProjectId: state => state.currentViewedProjectId,
    currentProject: state => state.projects.find(p => p._id === state.currentViewedProjectId)
  }
};
