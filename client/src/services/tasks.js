const TASKS_BASE_URL = '/api/tasks/';

async function fetchTasks(projectId, page = 1, limit = 20, search = '', sortField = '',
                          sortOrder = '', status = '') {
    const params = new URLSearchParams({
        projectId,
        page: page.toString(),
        limit: limit.toString()
    });

    if (search && typeof search === 'string' && search.trim()) {
        params.append('search', search.trim());
    }
    if (sortField?.trim()) {
        params.append('sortField', sortField.trim());
    }
    if (sortOrder?.trim()) {
        params.append('sortOrder', sortOrder.trim());
    }
    if (status?.trim()) {
        params.append('status', status);
    }

    const url = `${TASKS_BASE_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Failed to fetch tasks');

    const tasksData = await response.json();

    // Expecting response to be like: { tasks: [...], total: 100 }
    return tasksData;
}

async function fetchTask(taskId) {
    const url = `${TASKS_BASE_URL}${taskId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch task');
    return await response.json();
}

async function createTask(taskData) {
    taskData = {
        ...taskData,
        dueDate: new Date(taskData.dueDate).toISOString(),
    }
    const response = await fetch(TASKS_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
    });

    if (!response.ok) throw new Error('Failed to create task');
    return await response.json();
}

async function updateTask(taskId, taskData) {
    const response = await fetch(`${TASKS_BASE_URL}${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
    });

    if (!response.ok) throw new Error('Failed to update task');
    return await response.json();
}

async function deleteTask(taskId) {
    const response = await fetch(`${TASKS_BASE_URL}${taskId}`, {
        method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete task');
    return await response.json();
}

export {
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
};