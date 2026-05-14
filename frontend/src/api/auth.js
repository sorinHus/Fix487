import api from './axios';

export const login = (username, password) =>
  api.post('/auth/login/', { username, password });

export const logout = (refresh) =>
  api.post('/auth/logout/', { refresh });

export const getMe = () =>
  api.get('/auth/me/');

export const registerUser = (data) =>
  api.post('/auth/register/', data);

export const listUsers = () =>
  api.get('/users/');

export const getUser = (id) =>
  api.get(`/users/${id}/`);

export const updateUser = (id, data) =>
  api.patch(`/users/${id}/`, data);

export const listCompanies = () =>
  api.get('/companies/');

export const createCompany = (data) =>
  api.post('/companies/', data);

export const getCompany = (id) =>
  api.get(`/companies/${id}/`);

export const updateCompany = (id, data) =>
  api.patch(`/companies/${id}/`, data);
