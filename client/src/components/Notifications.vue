<template>
  <div class="notifications" v-if="allNotifications.length">
    <transition-group name="notification">
      <div
          v-for="notification in allNotifications"
          :key="notification.timestamp"
          :class="['notification', `notification-${notification.type}`, { 'auto-close': notification.autoClose }]"
      >
        <div class="notification-content">
          <span class="notification-icon">{{ getIcon(notification.type) }}</span>
          <span class="notification-message">{{ notification.message }}</span>
          <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
          <button class="close-btn" @click="dismissNotification(notification)">×</button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'Notifications',
  data() {
    return {
      dismissTimeout: 5000,
      timeoutMap: new Map()
    };
  },
  computed: {
    ...mapGetters({
      projectNotifications: 'notifications/projectNotifications',
      taskNotifications: 'notifications/taskNotifications'
    }),
    allNotifications() {
      return [...this.projectNotifications, ...this.taskNotifications]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  },
  methods: {
    ...mapMutations({
      removeNotification: 'notifications/REMOVE_NOTIFICATION'
    }),
    getIcon(type) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      return icons[type] || '📢';
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return isNaN(date) ? '' : date.toLocaleTimeString();
    },
    dismissNotification(notification) {
      const sourceType = this.projectNotifications.includes(notification) ? 'project' : 'task';
      this.removeNotification({ type: sourceType, notification });
      this.timeoutMap.delete(notification.timestamp);
    },
    scheduleAutoDismiss(notification) {
      if (!notification.autoClose || this.timeoutMap.has(notification.timestamp)) return;

      const timeoutId = setTimeout(() => {
        this.dismissNotification(notification);
      }, this.dismissTimeout);

      this.timeoutMap.set(notification.timestamp, timeoutId);
    }
  },
  watch: {
    allNotifications: {
      handler(newNotifications) {
        newNotifications.forEach(this.scheduleAutoDismiss);
      },
      deep: true
    }
  },
  beforeDestroy() {
    this.timeoutMap.forEach(clearTimeout);
    this.timeoutMap.clear();
  }
};
</script>

<style scoped>
.notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  margin-bottom: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  pointer-events: auto;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-icon {
  flex-shrink: 0;
}

.notification-message {
  flex: 1;
  font-size: 14px;
}

.notification-time {
  font-size: 12px;
  color: #666;
}

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 16px;
  cursor: pointer;
  padding: 0 6px;
  line-height: 1;
}

.close-btn:hover {
  color: #444;
}

.notification-success {
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
}

.notification-error {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.notification-warning {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.notification-info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.notification.auto-close {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>