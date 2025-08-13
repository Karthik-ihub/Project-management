import axios from 'axios';

const API_BASE_URL = '/api';

interface LoginResponse {
  status: string;
  token: string;
  developer_id?: string;
  manager_id?: string;
  name: string;
  message: string;
}

export const developerLogin = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/developer/login/`, { email, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.error || 'Login failed';
  }
};

export const managerLogin = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/manager/login/`, { email, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.error || 'Login failed';
  }
};