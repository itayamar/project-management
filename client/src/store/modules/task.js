import Vue from "vue";
import {
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
} from "@/services/tasks";

export default {
    namespaced: true,
    state: {
        tasks: [],
        currentTask: null,
        totalTasks: 0,
        taskCounts: {
            CREATED: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            ARCHIVED: 0
        },
        filters: {
            search: '',
            page: 1,
            limit: 20
        }
    },
    mutations: {
        SET_TASKS(state, tasks) {
            state.tasks = tasks;
        },
        SET_CURRENT_TASK(state, task) {
            state.currentTask = task;
        },
        ADD_TASK(state, task) {
            state.tasks.push(task);
        },
        UPDATE_TASK(state, updatedTask) {
            const index = state.tasks.findIndex((t) => t._id === updatedTask._id);
            if (index !== -1) {
                Vue.set(state.tasks, index, updatedTask);
            }
        },
        REMOVE_TASK(state, taskId) {
            state.tasks = state.tasks.filter((t) => t._id !== taskId);
        },
        SET_TOTAL_TASKS(state, total) {
            state.totalTasks = total;
        },
        SET_TASK_COUNTS(state, counts) {
            state.taskCounts = { ...state.taskCounts, ...counts };
        },
        SET_FILTERS(state, filters) {
            state.filters = { ...state.filters, ...filters };
        },
        RESET_FILTERS(state) {
            state.filters = {
                search: '',
                page: 1,
                limit: 20
            };
        }
    },
    actions: {
        async fetchTasks({ commit, state }, { projectId, page, limit, search } = {}) {
            commit("SET_LOADING", { type: "tasks", value: true }, { root: true });
            commit("SET_ERROR", null, { root: true });

            try {
                // Use existing filter values if not provided
                const params = {
                    projectId,
                    page: page || state.filters.page,
                    limit: limit || state.filters.limit,
                    search: search !== undefined ? search : state.filters.search
                };

                const data = await fetchTasks(
                    params.projectId,
                    params.page,
                    params.limit,
                    params.search
                );
                
                commit("SET_TASKS", data.tasks);
                commit("SET_TOTAL_TASKS", data.total);
                commit("SET_TASK_COUNTS", data.counts);
            } catch (error) {
                commit("SET_ERROR", error.message, { root: true });
            } finally {
                commit("SET_LOADING", { type: "tasks", value: false }, { root: true });
            }
        },

        updateFilters({ commit, dispatch }, { projectId, filters = {} }) {
            // Reset to page 1 when filters change (except when explicitly changing page)
            const newFilters = { ...filters };
            if (!('page' in filters)) {
                newFilters.page = 1;
            }
            
            commit('SET_FILTERS', newFilters);
            return dispatch('fetchTasks', { projectId });
        },

        resetFilters({ commit, dispatch }, { projectId }) {
            commit('RESET_FILTERS');
            return dispatch('fetchTasks', { projectId });
        },

        async fetchTask({ commit }, taskId) {
            commit("SET_LOADING", { type: "task", value: true }, { root: true });
            commit("SET_ERROR", null, { root: true });

            try {
                const task = await fetchTask(taskId);
                commit("SET_CURRENT_TASK", task);
                return task;
            } catch (error) {
                commit("SET_ERROR", error.message, { root: true });
                throw error;
            } finally {
                commit("SET_LOADING", { type: "task", value: false }, { root: true });
            }
        },

        async createTask({ commit }, taskData) {
            try {
                const task = await createTask(taskData);
                commit("ADD_TASK", task);
                return task;
            } catch (error) {
                commit("SET_ERROR", error.message, { root: true });
                throw error;
            }
        },

        async updateTask({ commit, dispatch }, { taskId, taskData }) {
            try {
                const task = await updateTask(taskId, taskData);
                commit("UPDATE_TASK", task);
                
                // Fetch fresh task data to update counts
                await dispatch('fetchTasks', { projectId: taskData.projectId });
                
                return task;
            } catch (error) {
                commit("SET_ERROR", error.message, { root: true });
                throw error;
            }
        },

        async deleteTask({ commit }, taskId) {
            try {
                await deleteTask(taskId);
                commit("REMOVE_TASK", taskId);
            } catch (error) {
                commit("SET_ERROR", error.message, { root: true });
                throw error;
            }
        },
    },
};