<template>
  <div class="project-header">
    <div class="header-top">
      <div class="actions-inline">
        <button class="icon-btn edit" @click="$emit('edit')" title="Edit Project">✏️</button>
        <button class="icon-btn delete" @click="$emit('delete')" title="Delete Project">🗑️</button>
        <h1 class="title">{{ project.name }}</h1>
      </div>
      <p class="description">{{ project.description }}</p>
    </div>

    <div class="add-task">
      <button class="btn btn-add" @click="$emit('add-task')">➕ Add Task</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectHeader',
  props: {
    project: {
      type: Object,
      required: true
    },
  }
}
</script>

<style scoped lang="less">
.project-header {
  margin-bottom: 32px;

  .header-top {
    display: flex;
    flex-direction: column;
  }

  .actions-inline {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon-btn {
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.1s ease, background 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

      &:hover {
        transform: scale(1.05);
      }

      &.edit {
        background: #10b981;
        color: white;

        &:hover {
          background: #059669;
        }
      }

      &.delete {
        background: #bfa5a5;
        color: white;

        &:hover {
          background: #dc2626;
        }
      }
    }
  }

  .title {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .description {
    font-size: 18px;
    color: #4b5563;
    margin-top: 4px;
  }

  .add-task {
    margin-top: 16px;

    .btn-add {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
      background: #eff6ff;
      color: #1d4ed8;
      transition: background 0.2s ease;

      &:hover {
        background: #dbeafe;
      }
    }
  }
}
</style>