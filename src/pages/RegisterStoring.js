import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiHash, FiUserPlus, FiCheckCircle } from 'react-icons/fi';
import './Register.css'; // Reusing the same CSS
import { API_URL } from '../config';

const RegisterStoring = () => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    nrg: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      setIsLoading(false);
      return;
    }

    if (!formData.nrg) {
      setError('Nomor Registrasi Guru (NRG) wajib diisi.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nama: formData.nama,
          email: formData.email,
          nrg: formData.nrg,
          password: formData.password,
          app_source: 'storing' // Penanda bahwa akun ini dari web storing
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        // Tampilkan error dari backend (misal: email sudah terdaftar)
        setError(data.message || 'Registrasi gagal. Cek kembali data Anda.');
      }
    } catch (err) {
      setError('Gagal terhubung ke server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card" style={{ borderTop: '4px solid #4f46e5' }}>
        {isSuccess ? (
          <div className="success-message-container" style={{ textAlign: 'center', padding: '20px 0' }}>
            <FiCheckCircle style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Pendaftaran Berhasil!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Akun Storing Modul Anda telah berhasil dibuat. Namun, akun ini membutuhkan persetujuan (approval) dari Admin terlebih dahulu.
            </p>
            <Link to="/login-storing" className="btn-register" style={{ textDecoration: 'none', backgroundColor: '#4f46e5' }}>
              Kembali ke Login Storing
            </Link>
          </div>
        ) : (
          <>
            <div className="register-header">
              <h2 style={{ color: '#4f46e5' }}>Daftar Akun Storing</h2>
              <p>Lengkapi data di bawah untuk mendaftar Arsip Modul</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form className="register-form" onSubmit={handleRegister}>

              <div className="input-group">
                <label htmlFor="nama">Nama Akun</label>
                <div className="input-icon-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="nama"
                    placeholder="Nama Lengkap Anda"
                    value={formData.nama}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-icon-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="contoh@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="nrg">Nomor Registrasi Guru (NRG)</label>
                <div className="input-icon-wrapper">
                  <FiHash className="input-icon" />
                  <input
                    type="text"
                    id="nrg"
                    placeholder="Masukkan NRG Anda"
                    value={formData.nrg}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-icon-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    id="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-register" style={{ backgroundColor: '#4f46e5' }} disabled={isLoading}>
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <FiUserPlus className="btn-icon" />
                    Daftar Storing Modul
                  </>
                )}
              </button>
            </form>

            <div className="login-link">
              Sudah punya akun? <Link to="/login-storing" style={{ color: '#4f46e5' }}>Masuk di sini</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterStoring;
