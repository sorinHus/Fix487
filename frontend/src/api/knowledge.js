import api from './axios';

export const getKBCategories = () => api.get('/kb/categories/');
export const getKBArticles = (params) => api.get('/kb/articles/', { params });
export const getKBArticle = (id) => api.get(`/kb/articles/${id}/`);
export const createKBArticle = (data) => api.post('/kb/articles/', data);
export const updateKBArticle = (id, data) => api.patch(`/kb/articles/${id}/`, data);
