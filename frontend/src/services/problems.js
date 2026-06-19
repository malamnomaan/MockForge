import api from './api';

export const problemsService = {
  async getLevels() {
    const response = await api.get('/problems/levels/');
    return response.data.data;
  },
  
  async getProblems(levelId) {
    const response = await api.get(`/problems/level/${levelId}/`);
    return response.data.data;
  },

  async getProblem(problemId) {
    const response = await api.get(`/problems/${problemId}/`);
    return response.data.data;
  },

  async submitProblem(problemId, code, language) {
    const response = await api.post(`/problems/${problemId}/submit/`, { code, language });
    return response.data.data;
  },

  async runProblem(problemId, code, language) {
    const response = await api.post(`/problems/${problemId}/run/`, { code, language });
    return response.data.data;
  },

  async unlockTest(levelId) {
    const response = await api.post(`/problems/level/${levelId}/unlock-test/`);
    return response.data.data;
  },

  async getSubmissions() {
    const response = await api.get('/problems/submissions/');
    return response.data.data;
  }
};
