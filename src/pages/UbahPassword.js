import React, { useState } from 'react';
import { FiLock, FiKey, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Login.css'; // Kita pinjam style form yang sudah ada agar rapi
import { API_URL } from '../config';

const UbahPassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('Kata sandi baru minimal harus 6 karakter.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Konfirmasi kata sandi baru tidak cocok.');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/user/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Kata sandi berhasil diubah!');
                // Reset form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(data.message || 'Gagal mengubah kata sandi.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal terhubung ke server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="data-kelas-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="page-header">
                <h2>Ubah Kata Sandi</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', marginTop: '-12px' }}>
                Pastikan menggunakan kata sandi yang kuat untuk menjaga keamanan akun Anda.
            </p>

            <div style={{
                background: 'var(--surface-color)',
                padding: '32px',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-color)'
            }}>
                <form onSubmit={handleSubmit}>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>Kata Sandi Lama</label>
                        <div className="input-icon-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <FiLock className="input-icon" style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                placeholder="Masukkan kata sandi lama"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="modern-input"
                                style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>Kata Sandi Baru</label>
                        <div className="input-icon-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <FiKey className="input-icon" style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                placeholder="Minimal 6 karakter"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="modern-input"
                                style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '28px' }}>
                        <label>Konfirmasi Kata Sandi Baru</label>
                        <div className="input-icon-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <FiKey className="input-icon" style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                placeholder="Ulangi kata sandi baru"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="modern-input"
                                style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-add"
                        style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                    >
                        <FiSave style={{ fontSize: '1.2rem' }} /> {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default UbahPassword;