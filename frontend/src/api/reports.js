import api from './axios';

export const getSummary = () => api.get('/reports/summary/');
export const getTechnicianReport = () => api.get('/reports/technicians/');
