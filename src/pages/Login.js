import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import './Login.css';
import { API_URL } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [loginTarget, setLoginTarget] = useState(null);

  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect');

  const handleLogin = async (e, target = 'absensi') => {
    e.preventDefault();
    if (!email || !password) {
      setError('Mohon isi email dan password.');
      return;
    }

    setError('');
    setIsLoading(true);
    setLoginTarget(target);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          app_source: target
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 0. Bersihkan cache sesi sebelumnya agar data tidak bercampur
        localStorage.removeItem('cached_angkatan');
        localStorage.removeItem('cached_classrooms');
        localStorage.removeItem('cached_students');
        localStorage.removeItem('cached_dashboard_atts');
        localStorage.removeItem('cached_mapel');
        localStorage.removeItem('cached_laporan');

        // 1. Simpan token ke localStorage
        localStorage.setItem('token', data.token);

        // 2. Simpan role ke localStorage agar Sidebar bisa menyesuaikan menu
        localStorage.setItem('role', data.user.role);

        // (Opsional) Simpan nama user & app_source
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('appSource', data.user.app_source || 'absensi');

        // Simpan info kelas jika ada
        localStorage.setItem('classroomId', data.user.classroom_id || '');

        // JIKA USER KLIK TOMBOL "LOGIN KE STORING MODUL" DI HALAMAN INI
        if (target === 'storing') {
          const finalRedirectUrl = redirectUrl ? redirectUrl : 'https://storing-modul-main.vercel.app/sso-callback';
          window.location.href = `${finalRedirectUrl}?token=${data.token}`;
          return;
        }

        // JIKA TARGET 'absensi', abaikan redirectUrl dan tetap di Absensi
        // 3. Arahkan pengguna berdasarkan rolenya (Flow Biasa Absensi)
        if (data.user.role === 'sarpras') {
          navigate('/inventaris-barang', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        // Menangkap pesan error dari Laravel (termasuk jika akun dinonaktifkan)
        setError(data.message || 'Email atau password tidak valid.');
      }
    } catch (err) {
      setError('Gagal terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setIsLoading(false);
      setLoginTarget(null);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* LOGO MENGGANTUNG DI ATAS CARD */}
        <div className="logo-wrapper">
          <img src="/IMG_03611.png" alt="Logo SMK NU Donomulyo" className="overlapping-logo" />
        </div>
        <div className="login-header">

          <h2>Sistem Absensi SMK NU Donomulyo</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-icon-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                placeholder="Masukkan email anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                placeholder="Masukkan password anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="button" 
            className="btn-login" 
            onClick={(e) => handleLogin(e, 'absensi')}
            disabled={isLoading}
          >
            {isLoading && loginTarget === 'absensi' ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <FaSignInAlt className="btn-icon" /> Login ke Absensi
              </>
            )}
          </button>
        </form>

        <div className="login-link" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <Link to="/login-storing" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>Login Storing Modul di sini</Link>
        </div>

        <div className="login-link" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          Belum punya akun? <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>Daftar di sini</Link>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0 16px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
          <strong>SMK NU DONOMULYO MALANG © 2026</strong>
          <div>Malang, Indonesia</div>
        </div>
      </div>
    </div>
  );
};

export default Login;