import api from './axios';

export const getTickets = (params) => api.get('/tickets/', { params });
export const createTicket = (data) => api.post('/tickets/', data);
export const getTicket = (id) => api.get(`/tickets/${id}/`);
export const updateTicket = (id, data) => api.patch(`/tickets/${id}/`, data);
export const getCategories = () => api.get('/categories/');
export const exportTickets = (params) => api.get('/tickets/export/', { params, responseType: 'blob' });
