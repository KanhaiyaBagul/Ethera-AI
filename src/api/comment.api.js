import api from './axios.config';

export const getTaskComments = async (taskId) => {
  const { data } = await api.get(`/comments/task/${taskId}`);
  return data;
};

export const createComment = async (taskId, content) => {
  const { data } = await api.post(`/comments/task/${taskId}`, { content });
  return data;
};

export const deleteComment = async (id) => {
  const { data } = await api.delete(`/comments/${id}`);
  return data;
};
