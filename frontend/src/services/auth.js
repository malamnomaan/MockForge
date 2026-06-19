import api from './api';

export const authService = {
  async register(data) {
    const response = await api.post('/accounts/register/', data);
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/accounts/login/', { email, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  },

  async getProfile() {
    const response = await api.get('/accounts/profile/');
    return response.data;
  },

  async getAchievements() {
    const response = await api.get('/accounts/profile/achievements/');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.patch('/accounts/profile/', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await api.post('/accounts/change-password/', data);
    return response.data;
  }
};
