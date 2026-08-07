// Konfigurasi aplikasi frontend
// URL API akan mengambil dari file .env di environment (REACT_APP_API_URL)
// Jika tidak ada, maka secara default akan mengarah ke http://localhost:8000/api

export const API_URL = process.env.REACT_APP_API_URL || 'https://absensi-backend-smk-b037.onrender.com/api';
