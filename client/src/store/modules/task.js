import Vue from "vue";
import {
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
} from "@/services/tasks";
import wsService, { WS_EVENTS } from "@/services/websocket";

export default {
    namespaced: true,
    state: {
        tasks: [],
        currentTask: null,
        currentProjectId: null,
        totalTasks: 0,
        editingTaskIds: [],
        taskCounts: {
            CREATED: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            ARCHIVED: 0
        },
        filters: {
            search: '',
            page: 1,
            limit: 20,
            sortField: 'createdAt',
            sortOrder: 'desc'
        },
        lastActionId: null, // Track our last action
        lastActionIdTimeout: null // Track the timeout for lastActionId
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
            state.taskCounts = counts;
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
        ADD_EDITING_TASK(state, id) {
            if (!state.editingTaskIds.includes(id)) {
                state.editingTaskIds.push(id);
            }
        },
        REMOVE_EDITING_TASK(state, id) {
            state.editingTaskIds = state.editingTaskIds.filter(tid => tid !== id);
        }
    },
    actions: {
        async fetchTasks({ commit, state }, { projectId, page, limit, search, sortField,  sortOrder} = {}) {
            try {
                commit('SET_LOADING', { type: 'tasks', value: true }, { root: true });
                commit('SET_ERROR', null, { root: true });

                const params = {
                    projectId,
                    page: page || state.filters.page,
                    limit: limit || state.filters.limit,
                    search: search !== undefined ? search : state.filters.search,
                    sortField: sortField || state.filters.sortField,
                    sortOrder: sortOrder || state.filters.sortOrder
                };

                const data = await fetchTasks(
                    params.projectId,
                    params.page,
                    params.limit,
                    params.search,
                    params.sortField,
                    params.sortOrder
                );
                
                commit('SET_TASKS', data.tasks);
                commit('SET_TOTAL_TASKS', data.total);
                commit('SET_TOTAL_TASKS', data.total);
                commit('SET_TASK_COUNTS', data.counts);
            } catch (error) {
                commit('SET_ERROR', error.message, { root: true });
            } finally {
                commit('SET_LOADING', { type: 'tasks', value: false }, { root: true });
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
        resetFilters({ commit }) {
            commit('RESET_FILTERS');
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
        async createTask({ commit, dispatch }, taskData) {
            try {
                const task = await createTask(taskData);
                commit('ADD_TASK', task);
                
                // Set last action ID to prevent duplicate notifications
                commit('SET_LAST_ACTION', task._id);
                
                // Add success notification for the user who created the task
                dispatch('notifications/showNotification', {
                    type: 'task',
                    message: `Task "${task.description || 'Empty task'}" has been created successfully`,
                    notificationType: 'success',
                    autoClose: true
                }, { root: true });
                
                return task;
            } catch (error) {
                dispatch('notifications/showNotification', {
                    type: 'task',
                    message: `Failed to create task: ${error.message}`,
                    notificationType: 'error',
                    autoClose: true
                }, { root: true });
                commit('SET_ERROR', error.message, { root: true });
                throw error;
            }
        },
        async updateTask({ commit, dispatch }, { taskId, taskData }) {
            try {
                // Set last action ID to prevent duplicate notifications
                commit('SET_LAST_ACTION', taskId);
                
                const updatedTask = await updateTask(taskId, taskData);
                commit('UPDATE_TASK', updatedTask);
                
                // Add success notification for the user who updated the task
                dispatch('notifications/showNotification', {
                    type: 'task',
                    message: `Task "${updatedTask.description || 'Empty task'}" has been updated successfully`,
                    notificationType: 'success',
                    autoClose: true
                }, { root: true });
                
                return updatedTask;
            } catch (error) {
                dispatch('notifications/showNotification', {
                    type: 'task',
                    message: `Failed to update task: ${error.message}`,
                    notificationType: 'error',
                    autoClose: true
                }, { root: true });
                commit('SET_ERROR', error.message, { root: true });
                throw error;
            }
        },
        async deleteTask({ commit, dispatch, state }, taskId) {
            try {
                // Set last action ID to prevent duplicate notifications
                commit('SET_LAST_ACTION', taskId);
                
                // Find the task description before deletion
                const taskToDelete = state.tasks.find(t => t._id === taskId);
                const taskDesc = taskToDelete?.description || 'Empty task';
                
                await deleteTask(taskId);
                commit('REMOVE_TASK', taskId);
                
                // Add success notification for the user who deleted the task
                dispatch('notifications/showNotification', {
                    type: 'task',
                    message: `Task "${taskDesc}" has been deleted successfully`,
                    notificationType: 'success',
                    autoClose: true
                }, { root: true });
            } catch (error) {
                dispatch('notifications/showNotification', {
                    type: 'task',
                    message: `Failed to delete task: ${error.message}`,
                    notificationType: 'error',
                    autoClose: true
                }, { root: true });
                commit('SET_ERROR', error.message, { root: true });
                throw error;
            }
        },
        // WebSocket event handlers
        handleTaskCreated({ commit, state, dispatch }, payload) {
            try {
                if (!payload || !payload._id) {
                    console.error('Invalid task creation payload:', payload);
                    return;
                }

                const task = payload;

                // Only process if we're viewing the relevant project
                if (state.currentProjectId === task.projectId) {
                    commit('ADD_TASK', task);
                    
                    // Only show notification if it wasn't our action
                    if (state.lastActionId !== task._id) {
                        dispatch('notifications/showNotification', {
                            type: 'task',
                            message: `New task "${task.description || 'Empty task'}" has been created`,
                            notificationType: 'info',
                            autoClose: false
                        }, { root: true });
                        
                        // Refresh task counts
                        dispatch('fetchTasks', { projectId: task.projectId });
                    }
                }
            } catch (error) {
                console.error('Error handling task creation:', error);
            }
        },
        handleTaskUpdated({ commit, state, dispatch }, payload) {
            try {
                if (!payload || !payload._id) {
                    console.error('Invalid task update payload:', payload);
                    return;
                }

                const task = payload;

                // Only process if we're viewing the relevant project
                if (state.currentProjectId === task.projectId) {
                    commit('UPDATE_TASK', task);
                    
                    // Only show notification if it wasn't our action
                    if (state.lastActionId !== task._id) {
                        dispatch('notifications/showNotification', {
                            type: 'task',
                            message: `Task "${task.description || 'Empty task'}" has been updated`,
                            notificationType: 'info',
                            autoClose: false
                        }, { root: true });
                    }
                }
            } catch (error) {
                console.error('Error handling task update:', error);
            }
        },
        handleTaskDeleted({ commit, state, dispatch }, payload) {
            try {
                if (!payload || !payload._id) {
                    console.error('Invalid task deletion payload:', payload);
                    return;
                }

                const taskId = payload._id;
                const taskDesc = payload.description || 'Empty task';
                const { projectId } = payload;

                // Only process if we're viewing the relevant project
                if (state.currentProjectId === projectId) {
                    commit('REMOVE_TASK', taskId);
                    
                    // Clear currentTask if it's the one being deleted
                    if (state.currentTask?._id === taskId) {
                        commit('SET_CURRENT_TASK', null);
                    }

                    // Only show notification if it wasn't our action
                    if (state.lastActionId !== taskId) {
                        dispatch('notifications/showNotification', {
                            type: 'task',
                            message: `Task "${taskDesc}" has been deleted`,
                            notificationType: 'info',
                            autoClose: false
                        }, { root: true });
                    }
                }
            } catch (error) {
                console.error('Error handling task deletion:', error);
            }
        },
        // Initialize WebSocket listeners
        initializeWebSocket({ commit, dispatch }) {
            wsService.connect();

            // Listen for task events
            wsService.subscribe(WS_EVENTS.TASK_CREATED, (data) => {
                dispatch('handleTaskCreated', data);
            });

            wsService.subscribe(WS_EVENTS.TASK_UPDATED, (data) => {
                dispatch('handleTaskUpdated', data);
            });

            wsService.subscribe(WS_EVENTS.TASK_DELETED, (data) => {
                dispatch('handleTaskDeleted', data);
            });

            wsService.subscribe(WS_EVENTS.START_EDITING_TASK, ({ id }) => {
                commit('ADD_EDITING_TASK', id);
            });

            wsService.subscribe(WS_EVENTS.STOP_EDITING_TASK, ({ id }) => {
                commit('REMOVE_EDITING_TASK', id);
            });
        },
        startEditingTask(_, id) {
            if (!id) {
                console.warn('startEditingTask called with missing ID');
                return;
            }
            wsService.send(WS_EVENTS.START_EDITING_TASK, { id });
        },
        stopEditingTask(_, id) {
            wsService.send(WS_EVENTS.STOP_EDITING_TASK, { id });
        }
    },
    getters: {
        recentNotifications: state => state.notifications
    }
};