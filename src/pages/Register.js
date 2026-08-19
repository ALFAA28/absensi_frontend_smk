import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiBook, FiUserPlus, FiCheckCircle } from 'react-icons/fi';
import './Register.css';
import { API_URL } from '../config';

const Register = () => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    classroom_id: ''
  });
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch(`${API_URL}/classrooms/public`);
        if (response.ok) {
          const data = await response.json();
          setClassrooms(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data kelas:", err);
      }
    };
    fetchClassrooms();
  }, []);
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
          password: formData.password,
          classroom_id: formData.classroom_id || null
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
      <div className="register-card">
        {isSuccess ? (
          <div className="success-message-container" style={{ textAlign: 'center', padding: '20px 0' }}>
            <FiCheckCircle style={{ fontSize: '4rem', color: 'var(--success-color)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Pendaftaran Berhasil!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Akun Anda telah berhasil dibuat. Namun, akun ini belum bisa digunakan untuk login karena membutuhkan persetujuan (approval) dari Admin.
            </p>
            <Link to="/login" className="btn-register" style={{ textDecoration: 'none' }}>
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <>
            <div className="register-header">
              <h2>Buat Akun Baru</h2>
              <p>Lengkapi data di bawah untuk mendaftar</p>
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
                <label htmlFor="classroom_id">Kelas Binaan Wali Kelas (Opsional)</label>
                <div className="input-icon-wrapper">
                  <FiBook className="input-icon" />
                  <select
                    id="classroom_id"
                    value={formData.classroom_id || ''}
                    onChange={handleChange}
                    className="modern-input"
                  >
                    <option value="">-- Bukan Wali Kelas / Pilih Kelas Binaan --</option>
                    {['10', '11', '12'].map(grade => {
                      const list = classrooms.filter(c => String(c.grade) === String(grade));
                      if (list.length === 0) return null;
                      return (
                        <optgroup key={grade} label={`Tingkat ${grade} (Kelas ${grade === '10' ? 'X' : (grade === '11' ? 'XI' : 'XII')})`}>
                          {list.map(cls => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} ({cls.singkatan})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {classrooms.filter(c => !['10', '11', '12'].includes(String(c.grade))).length > 0 && (
                      <optgroup label="Kelas Lainnya">
                        {classrooms.filter(c => !['10', '11', '12'].includes(String(c.grade))).map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.singkatan})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
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

              <button type="submit" className="btn-register" disabled={isLoading}>
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <FiUserPlus className="btn-icon" />
                    Daftar Sekarang
                  </>
                )}
              </button>
            </form>

            <div className="login-link">
              Sudah punya akun? <Link to="/login">Masuk di sini</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
