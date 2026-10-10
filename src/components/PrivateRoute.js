import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, isChecking } = useAuth();
  
  // Tampilkan loading saat sedang verifikasi token ke server
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#94a3b8',
        fontSize: '16px',
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(148, 163, 184, 0.3)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Memverifikasi sesi...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Mengecek apakah ada token yang tersimpan di localStorage
  // Jika tidak ada, pengguna dianggap belum login
  const token = localStorage.getItem('token');

  // Jika token ada DAN authenticated, render komponen anak (Outlet)
  // Jika tidak, arahkan kembali (redirect) ke halaman login
  return (token && isAuthenticated) ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
