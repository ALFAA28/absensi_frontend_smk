import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';
import './Login.css';
import { API_URL } from '../config';

const LoginStoring = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Mohon isi email dan password.');
      return;
    }

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
        // Simpan token ke localStorage (opsional, karena akan dialihkan ke web storing)
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('classroomId', data.user.classroom_id || '');

        // Arahkan ke Storing Modul
        const finalRedirectUrl = redirectUrl ? redirectUrl : 'https://storing-modul-main.vercel.app/sso-callback';
        window.location.href = `${finalRedirectUrl}?token=${data.token}`;
      } else {
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
        <div className="logo-wrapper">
          <img src="/IMG_03611.png" alt="Logo SMK NU Donomulyo" className="overlapping-logo" />
        </div>
        <div className="login-header">
          <h2>Sistem Informasi Storing Modul</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Login khusus untuk akses Arsip Modul</p>
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
            style={{ backgroundColor: '#4f46e5' }}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <FaSignInAlt className="btn-icon" /> Login ke Storing Modul
              </>
            )}
          </button>
        </form>

        <div className="login-link" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          Belum punya akun Storing? <Link to="/register-storing" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>Daftar di sini</Link>
        </div>

        <div className="login-link" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FaArrowLeft /> Kembali ke Login Absensi
          </Link>
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

export default LoginStoring;
