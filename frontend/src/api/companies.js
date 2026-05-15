import api from './axios';

export const getCompanies = () => api.get('/companies/');
