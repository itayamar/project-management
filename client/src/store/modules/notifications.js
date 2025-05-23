export default {
    namespaced: true,
    state: {
        projectNotifications: [],
        taskNotifications: [],
        lastActionId: null,
        lastActionIdTimeout: null
    },
    mutations: {
        ADD_NOTIFICATION(state, { type, notification }) {
            const list = type === 'project' ? state.projectNotifications : state.taskNotifications;
            list.unshift(notification);
            // Keep only last 10 notifications
            if (list.length > 10) {
                list.pop();
            }
        },
        REMOVE_NOTIFICATION(state, { type, notification }) {
            const list = type === 'project' ? state.projectNotifications : state.taskNotifications;
            const index = list.findIndex(n => n.timestamp === notification.timestamp);
            if (index !== -1) {
                list.splice(index, 1);
            }
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
        }
    },
    actions: {
        showNotification({ commit }, { type, message, notificationType = 'info', autoClose = false }) {
            const notification = {
                type,
                notificationType,
                message,
                timestamp: new Date().toISOString(),
                autoClose
            };
            
            commit('ADD_NOTIFICATION', { type, notification });
            
            if (autoClose) {
                setTimeout(() => {
                    commit('REMOVE_NOTIFICATION', { type, notification });
                }, 5000); // 5 seconds
            }
        },
        setLastAction({ commit }, id) {
            commit('SET_LAST_ACTION', id);
        }
    },
    getters: {
        projectNotifications: state => state.projectNotifications,
        taskNotifications: state => state.taskNotifications,
        lastActionId: state => state.lastActionId
    }
}; 