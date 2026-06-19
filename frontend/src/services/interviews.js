import api from './api';

export const interviewService = {
  async getStatuses() {
    const response = await api.get('/interviews/statuses/');
    return response.data;
  },

  async getSessions() {
    const response = await api.get('/interviews/sessions/');
    return response.data;
  },

  async getSession(id) {
    const response = await api.get(`/interviews/sessions/${id}/`);
    return response.data;
  },

  async createSession(type, question) {
    const response = await api.post('/interviews/sessions/', { type, question });
    return response.data;
  },

  async submitAnswer(id, answer) {
    const response = await api.patch(`/interviews/sessions/${id}/`, { answer });
    return response.data;
  },

  async transitionStatus(id, toStatusCode) {
    const response = await api.post(`/interviews/sessions/${id}/transition/`, { 
      to_status_code: toStatusCode 
    });
    return response.data;
  }
};
