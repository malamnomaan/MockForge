import api from './api';

export const aiService = {
  async triggerEvaluation(sessionId) {
    const response = await api.post(`/ai/evaluate/${sessionId}/`);
    return response.data;
  },

  async getEvaluations(sessionId) {
    const response = await api.get(`/ai/evaluations/${sessionId}/`);
    return response.data;
  },

  async sendChatMessage(sessionId, message) {
    const response = await api.post(`/ai/chat/${sessionId}/`, { message });
    return response.data;
  }
};
