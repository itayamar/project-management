const PROJECTS_BASE_URL = '/api/projects/';

async function fetchProjects({ page = 1, limit = 20, search = '', status = '' } = {}) {
    const params = new URLSearchParams();
    
    // Add pagination parameters
    params.append('page', page);
    params.append('limit', limit);
    
    // Add search parameter if not empty
    if (search?.trim()) {
        params.append('search', search.trim());
    }
    
    // Add status parameter if not empty
    if (status?.trim()) {
        params.append('status', status.trim());
    }

    const url = `${PROJECTS_BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch projects');

    const projectsData = await response.json();
    return projectsData;
}

async function fetchProject(projectId) {
    const url = `${PROJECTS_BASE_URL}/${projectId}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch project')
    const project = await response.json()
    return project
}

async function createProject(projectData) {
    const response = await fetch(PROJECTS_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
    })

    if (!response.ok) throw new Error('Failed to create project')

    const project = await response.json()
    return project
}

async function updateProject(projectId, projectData) {
    const response = await fetch(`${PROJECTS_BASE_URL}${projectId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
    })

    if (!response.ok) throw new Error('Failed to update project')

    const project = await response.json()
    return project
}

async function deleteProject(projectId) {
    const response = await fetch(`${PROJECTS_BASE_URL}${projectId}`, {
        method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete project')
    return await response.json()
}

export {
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
};