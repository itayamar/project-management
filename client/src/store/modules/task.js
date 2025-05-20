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
    },
    actions: {
        async fetchTasks({ commit }, { projectId, page = 1, limit = 20 } = {}) {
            commit("SET_LOADING", { type: "tasks", value: true }, { root: true });
            commit("SET_ERROR", null, { root: true });

            try {
                const data = await fetchTasks(projectId, page, limit); // Expected format: { tasks: [], total: number }
                commit("SET_TASKS", data.tasks);
                commit("SET_TOTAL_TASKS", data.total);
            } catch (error) {
                commit("SET_ERROR", error.message, { root: true });
            } finally {
                commit("SET_LOADING", { type: "tasks", value: false }, { root: true });
            }
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

        async updateTask({ commit }, { taskId, taskData }) {
            try {
                const task = await updateTask(taskId, taskData);
                commit("UPDATE_TASK", task);
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