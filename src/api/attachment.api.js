import api from './axios.config';

export const getTaskAttachments = async (taskId) => {
  const { data } = await api.get(`/attachments/task/${taskId}`);
  return data;
};

export const uploadTaskAttachment = async (taskId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/attachments/task/${taskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteTaskAttachment = async (attachmentId) => {
  const { data } = await api.delete(`/attachments/${attachmentId}`);
  return data;
};
