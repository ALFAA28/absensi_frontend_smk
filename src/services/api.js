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

// Flag untuk mencegah multiple redirect secara bersamaan
let isRedirecting = false;

// Interceptor Response: Menangkap error seperti sesi habis (401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Jangan redirect berulang kali jika sudah dalam proses redirect
      if (!isRedirecting) {
        isRedirecting = true;

        // Jika backend merespon 401 (Tidak Diizinkan / Token Expired), 
        // hapus semua data sesi dan tendang user ke halaman login
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('appSource');
        localStorage.removeItem('classroomId');
        localStorage.removeItem('cached_angkatan');
        localStorage.removeItem('cached_classrooms');
        localStorage.removeItem('cached_students');
        localStorage.removeItem('cached_dashboard_atts');
        localStorage.removeItem('cached_mapel');
        localStorage.removeItem('cached_laporan');

        // Hanya redirect jika belum di halaman login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/login-storing') {
          window.location.href = '/login';
        }

        // Reset flag setelah beberapa detik
        setTimeout(() => {
          isRedirecting = false;
        }, 3000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
