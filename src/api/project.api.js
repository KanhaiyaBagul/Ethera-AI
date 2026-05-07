import api from './axios.config';

export const getProjects = async () => {
  const { data } = await api.get('/projects');
  return data;
};

export const getProjectById = async (id) => {
  const { data } = await api.get(`/projects/${id}`);
  return data;
};

export const createProject = async (projectData) => {
  const { data } = await api.post('/projects', projectData);
  return data;
};

export const updateProject = async (id, projectData) => {
  const { data } = await api.put(`/projects/${id}`, projectData);
  return data;
};

export const deleteProject = async (id) => {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
};

export const addProjectMember = async (projectId, memberData) => {
  const { data } = await api.post(`/projects/${projectId}/members`, memberData);
  return data;
};

export const updateProjectMemberRole = async (projectId, userId, role) => {
  const { data } = await api.patch(`/projects/${projectId}/members/${userId}`, { role });
  return data;
};

export const removeProjectMember = async (projectId, userId) => {
  const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);
  return data;
};
