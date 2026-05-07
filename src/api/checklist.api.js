import api from './axios.config';

export const addChecklistItem = async (taskId, title) => {
  const { data } = await api.post(`/tasks/${taskId}/checklist`, { title });
  return data;
};

export const updateChecklistItem = async (itemId, updates) => {
  const { data } = await api.patch(`/checklist/${itemId}`, updates);
  return data;
};

export const deleteChecklistItem = async (itemId) => {
  const { data } = await api.delete(`/checklist/${itemId}`);
  return data;
};
