import api from './axios.config';

export const globalSearch = async (query) => {
  const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return data;
};
