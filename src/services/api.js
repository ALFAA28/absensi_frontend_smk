import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: `${API_URL}`, // Ubah sesuai URL backend Anda
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor Request: Menyisipkan Token Otorisasi ke setiap panggilan API
api.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem('token');
    
    // Jika token ada, tambahkan ke header Authorization
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Menangkap error seperti sesi habis (401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Jika backend merespon 401 (Tidak Diizinkan), 
      // hapus token dan tendang user ke halaman login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
