import api from './axios.config';

export const getProjectTasks = async (projectId, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const { data } = await api.get(`/projects/${projectId}/tasks?${params}`);
  return data;
};

export const createTask = async (projectId, taskData) => {
  const { data } = await api.post(`/projects/${projectId}/tasks`, taskData);
  return data;
};

export const getTaskById = async (id) => {
  const { data } = await api.get(`/tasks/${id}`);
  return data;
};

export const updateTask = async (id, taskData) => {
  const { data } = await api.put(`/tasks/${id}`, taskData);
  return data;
};

export const updateTaskStatus = async (id, status) => {
  const { data } = await api.patch(`/tasks/${id}/status`, { status });
  return data;
};

export const deleteTask = async (id) => {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
};
