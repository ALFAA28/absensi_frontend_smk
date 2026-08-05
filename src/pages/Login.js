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

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {

        // 1. Simpan token ke localStorage
        localStorage.setItem('token', data.token);

        // 2. Simpan role ke localStorage agar Sidebar bisa menyesuaikan menu
        localStorage.setItem('role', data.user.role);

        // (Opsional) Simpan nama user
        localStorage.setItem('userName', data.user.name);

        // Simpan info kelas jika ada
        localStorage.setItem('classroomId', data.user.classroom_id || '');

        // 3. Arahkan pengguna berdasarkan rolenya
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
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* LOGO MENGGANTUNG DI ATAS CARD */}
        <div className="logo-wrapper">
          <img src="/IMG_03611.PNG" alt="Logo SMK NU Donomulyo" className="overlapping-logo" />
        </div>
        <div className="login-header">

          <h2>Sistem Absensi SMK NU Donomulyo</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
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

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <FaSignInAlt className="btn-icon" /> Login
              </>
            )}
          </button>
        </form>

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