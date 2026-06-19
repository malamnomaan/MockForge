import api from './api';

export const aiService = {
  async triggerEvaluation(sessionId) {
    const response = await api.post(`/ai/evaluate/${sessionId}/`);
    return response.data;
  },

  async getEvaluations(sessionId) {
    const response = await api.get(`/ai/evaluations/${sessionId}/`);
    return response.data;
  }
};
