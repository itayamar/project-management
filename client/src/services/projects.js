const PRODUCTS_BASE_URL = '/api/projects/';

async function fetchProjects(page=1, limit=20) {
    console.log('HERE 2')
    const url = `${PRODUCTS_BASE_URL}?page=${page}&limit=${limit}`;
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch projects')

    const projectsData = await response.json()
    console.log('project sData', projectsData)
    return projectsData
}

async function fetchProject(projectId) {
    const url = `${PRODUCTS_BASE_URL}?projectId=${projectId}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch project')
    const project = await response.json()
    return project
}

async function createProject(projectData) {
    const response = await fetch(PRODUCTS_BASE_URL, {
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
    const response = await fetch(`${PRODUCTS_BASE_URL}${projectId}`, {
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
    const response = await fetch(`${PRODUCTS_BASE_URL}${projectId}`, {
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