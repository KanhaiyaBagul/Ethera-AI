import api from './axios.config';

export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard');
  return data;
};
