import api from './axios';

export const getNotifications = () => api.get('/notifications/');
export const markAllRead = () => api.post('/notifications/read-all/');
