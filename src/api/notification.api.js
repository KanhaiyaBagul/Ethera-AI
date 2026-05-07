import axios from './axios.config';

export const getNotifications = () => axios.get('/notifications');
export const markAsRead = (id) => axios.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => axios.patch('/notifications/read-all');
