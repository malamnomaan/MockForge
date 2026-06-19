import api from './api';

export const interviewService = {
  async getStatuses() {
    const response = await api.get('/interviews/statuses/');
    return response.data;
  },

  async getSessions() {
    const response = await api.get('/interviews/sessions/');
    return response.data.success ? response.data.data : response.data;
  },

  async getSession(id) {
    const response = await api.get(`/interviews/sessions/${id}/`);
    return response.data.success ? response.data.data : response.data;
  },

  async createSession(type, question, language = '', difficulty = '') {
    const response = await api.post('/interviews/sessions/', { type, question, language, difficulty });
    return response.data.success ? response.data.data : response.data;
  },

  async submitAnswer(id, answer, violations = 0) {
    const response = await api.patch(`/interviews/sessions/${id}/`, { answer, violations });
    return response.data.success ? response.data.data : response.data;
  },

  async transitionStatus(id, toStatusCode) {
    const response = await api.post(`/interviews/sessions/${id}/transition/`, { 
      to_status_code: toStatusCode 
    });
    return response.data.success ? response.data.data : response.data;
  },

  executeCode: async (language, files) => {
    const response = await api.post(`/interviews/execute/`, { language, files });
    return response.data;
  }
};
