import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const AuthContext = createContext(null);

// Daftar path publik yang tidak memerlukan autentikasi
const PUBLIC_PATHS = ['/login', '/login-storing', '/register', '/register-storing'];

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const lastCheckRef = useRef(0);

  // Fungsi untuk menandai bahwa user sudah berhasil login
  // Dipanggil dari halaman Login setelah token disimpan ke localStorage
  const markAsAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
    setIsChecking(false);
    lastCheckRef.current = Date.now();
  }, []);

  // Fungsi untuk logout dan redirect ke halaman login
  const forceLogout = useCallback((message = 'Sesi Anda telah berakhir. Silakan login kembali.') => {
    // Hapus semua data sesi dari localStorage
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
    
    setIsAuthenticated(false);

    // Hanya tampilkan toast jika bukan di halaman publik
    if (!PUBLIC_PATHS.includes(window.location.pathname)) {
      toast.error(message, {
        position: 'top-center',
        autoClose: 5000,
        toastId: 'session-expired', // Mencegah duplikasi toast
      });
    }

    // Redirect ke halaman login
    window.location.href = '/login';
  }, []);

  // Fungsi untuk mengecek apakah token masih valid ke backend
  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    // Jika tidak ada token, langsung set tidak authenticated
    if (!token) {
      setIsAuthenticated(false);
      setIsChecking(false);
      return false;
    }

    // Throttle: jangan cek ulang kalau baru dicek < 30 detik yang lalu
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      setIsChecking(false);
      return isAuthenticated;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 detik

      const response = await fetch(`${API_URL}/user`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      clearTimeout(timeoutId);
      lastCheckRef.current = Date.now();

      if (response.status === 401) {
        // Token expired atau tidak valid
        forceLogout('Sesi Anda telah berakhir. Silakan login kembali.');
        return false;
      }

      if (response.ok) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return true;
      }

      // Response lain (500, dll) - jangan logout, bisa jadi server error sementara
      setIsChecking(false);
      return true;
    } catch (error) {
      // Network error - jangan logout langsung, bisa jadi masalah koneksi
      console.warn('Gagal memverifikasi token:', error.message);
      setIsChecking(false);
      return true; // Asumsikan masih valid jika network error
    }
  }, [forceLogout, isAuthenticated]);

  // Cek token saat pertama kali app dimuat
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !PUBLIC_PATHS.includes(location.pathname)) {
      verifyToken();
    } else {
      setIsChecking(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ================================================================
  // EVENT LISTENER: Cek token saat tab/browser kembali aktif
  // Ini menangani kasus user meninggalkan Chrome dalam waktu lama
  // ================================================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('token');
        if (token && !PUBLIC_PATHS.includes(window.location.pathname)) {
          // Reset throttle agar bisa cek ulang
          lastCheckRef.current = 0;
          verifyToken();
        }
      }
    };

    // Cek saat tab kembali aktif (dari minimize, pindah tab, dll)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [verifyToken]);

  // ================================================================
  // EVENT LISTENER: Cek token saat browser kembali online
  // Menangani kasus koneksi internet putus lalu nyambung lagi
  // ================================================================
  useEffect(() => {
    const handleOnline = () => {
      const token = localStorage.getItem('token');
      if (token && !PUBLIC_PATHS.includes(window.location.pathname)) {
        lastCheckRef.current = 0;
        verifyToken();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [verifyToken]);

  // ================================================================
  // EVENT LISTENER: Cek token saat window mendapatkan fokus kembali
  // Backup untuk visibilitychange pada beberapa browser
  // ================================================================
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token && !PUBLIC_PATHS.includes(window.location.pathname)) {
        verifyToken();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [verifyToken]);

  // ================================================================
  // PERIODIC CHECK: Cek token setiap 5 menit sebagai safety net
  // Jaga-jaga jika user tetap di halaman tapi token sudah expired
  // ================================================================
  useEffect(() => {
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && !PUBLIC_PATHS.includes(window.location.pathname)) {
        lastCheckRef.current = 0; // Reset throttle untuk periodic check
        verifyToken();
      }
    }, 5 * 60 * 1000); // Cek setiap 5 menit

    return () => clearInterval(intervalId);
  }, [verifyToken]);

  const value = {
    isAuthenticated,
    isChecking,
    markAsAuthenticated,
    forceLogout,
    verifyToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook untuk menggunakan AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};

export default AuthContext;
