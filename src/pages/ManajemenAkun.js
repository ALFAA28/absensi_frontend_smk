import React, { useState, useEffect } from 'react';
import { FiTrash2, FiSearch, FiFilter, FiUnlock, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import './ManajemenAkun.css';
import { API_URL } from '../config';

const ManajemenAkun = () => {
  const [accounts, setAccounts] = useState(() => {
    const cached = localStorage.getItem('cached_accounts');
    return cached ? JSON.parse(cached) : [];
  });
  const [classrooms, setClassrooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditUser, setSelectedEditUser] = useState(null);
  const [editRole, setEditRole] = useState('guru_mapel');
  const [editClassroomId, setEditClassroomId] = useState('');

  useEffect(() => {
    fetchDataAkun();
  }, []);

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

  const fetchDataAkun = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        const formattedData = data.map(user => ({
          id: user.id,
          nama: user.name,
          email: user.email,
          kelas: user.classroom ? user.classroom.name : (user.kelas || '-'),
          classroom_id: user.classroom_id || '',
          role: user.role,
          status: user.status || 'pending',
          createdAt: new Date(user.created_at).toLocaleDateString('id-ID')
        }));

        setAccounts(formattedData);
        localStorage.setItem('cached_accounts', JSON.stringify(formattedData));
      }
    } catch (error) {
      console.error("Gagal mengambil data akun:", error);
    }
  };

  // Filter dan pencarian
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.kelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || acc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Hitung jumlah per status
  const pendingCount = accounts.filter((a) => a.status === 'pending').length;
  const activeCount = accounts.filter((a) => a.status === 'active').length;
  const inactiveCount = accounts.filter((a) => a.status === 'inactive').length;

  // --- FUNGSI UPDATE STATUS KE BACKEND ---
  const updateStatusAkun = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setAccounts(accounts.map((acc) => (acc.id === id ? { ...acc, status: newStatus } : acc)));
      } else {
        alert("Gagal memperbarui status akun.");
      }
    } catch (error) {
      console.error("Terjadi kesalahan koneksi", error);
    }
  };

  const handleApprove = (id) => {
    updateStatusAkun(id, 'active');
  };

  const handleDeactivate = (id) => {
    updateStatusAkun(id, 'inactive');
  };



  // --- FUNGSI HAPUS AKUN KE BACKEND ---
  const confirmDelete = (acc) => {
    setSelectedAccount(acc);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (selectedAccount) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${selectedAccount.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          setAccounts(accounts.filter((acc) => acc.id !== selectedAccount.id));
          setShowDeleteModal(false);
          setSelectedAccount(null);
        } else {
          alert("Gagal menghapus akun.");
        }
      } catch (error) {
        console.error("Terjadi kesalahan koneksi", error);
      }
    }
  };

  // --- EDIT USER ROLE & KELAS BINAAN ---
  const handleOpenEdit = (acc) => {
    setSelectedEditUser(acc);
    setEditRole(acc.role || 'guru_mapel');
    setEditClassroomId(acc.classroom_id || '');
    setShowEditModal(true);
    if (classrooms.length === 0) {
      fetchClassrooms();
    }
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!selectedEditUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${selectedEditUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          role: editRole,
          classroom_id: editRole === 'wali_kelas' ? editClassroomId : null
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchDataAkun();
      } else {
        alert("Gagal meng-update akun.");
      }
    } catch (error) {
      console.error("Terjadi kesalahan koneksi", error);
    }
  };

  // --- FUNGSI RESET PASSWORD ---
  const handleResetPassword = async (id, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin mereset sandi untuk akun ${nama}? Sandi akan diubah menjadi "password123".`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
      } else {
        alert(data.message || "Gagal mereset sandi.");
      }
    } catch (error) {
      console.error("Terjadi kesalahan koneksi", error);
      alert("Gagal terhubung ke server.");
    }
  };

  // Badge Status Akun
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">Menunggu Persetujuan</span>;
      case 'active':
        return <span className="badge badge-active">Aktif</span>;
      case 'inactive':
        return <span className="badge badge-inactive">Nonaktif</span>;
      default:
        return null;
    }
  };

  // Format Tampilan Role Asli Akun
  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span style={{ background: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>Admin</span>;
    } else if (role === 'sarpras') {
      return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#b45309', padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>Sarpras</span>;
    } else if (role === 'wali_kelas') {
      return <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info-color)', padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>Wali Kelas</span>;
    } else {
      // default guru mapel
      return <span style={{ background: 'var(--border-color)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>Guru Mapel</span>;
    }
  };

  return (
    <div className="manajemen-akun">
      <h2>Manajemen Akun</h2>

      {/* Kartu Ringkasan */}
      <div className="summary-cards">
        <div className="summary-card pending" onClick={() => setFilterStatus('pending')}>
          <h4>Menunggu Persetujuan</h4>
          <p className="summary-value">{pendingCount}</p>
        </div>
        <div className="summary-card active" onClick={() => setFilterStatus('active')}>
          <h4>Akun Aktif</h4>
          <p className="summary-value">{activeCount}</p>
        </div>
        <div className="summary-card inactive" onClick={() => setFilterStatus('inactive')}>
          <h4>Akun Nonaktif</h4>
          <p className="summary-value">{inactiveCount}</p>
        </div>
      </div>

      {/* Toolbar Pencarian & Filter */}
      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama, email, atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select value={filterStatus} onChange={(e) => setSearchTerm(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Tabel Daftar Akun */}
      <div className="table-container">
        <table className="account-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Kelas / Jurusan</th>
              <th>Role / Peran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">Tidak ada data akun ditemukan.</td>
              </tr>
            ) : (
              filteredAccounts.map((acc, index) => (
                <tr key={acc.id}>
                  <td>{index + 1}</td>
                  <td className="name-cell">
                    {acc.nama}
                  </td>
                  <td>{acc.email}</td>
                  <td>
                    {acc.kelas !== '-' ? (
                      <strong style={{ color: 'var(--primary-color)' }}>{acc.kelas}</strong>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </td>
                  {/* Menampilkan Role Asli Akun dalam Bentuk Label Badge */}
                  <td>{getRoleBadge(acc.role)}</td>
                  <td>{getStatusBadge(acc.status)}</td>
                  <td className="action-cell">
                    {acc.status === 'pending' || acc.status === 'inactive' ? (
                      <button className="btn-action btn-approve" title="Aktifkan Akun" onClick={() => handleApprove(acc.id)}>
                        <FiCheck />
                      </button>
                    ) : (
                      <button className="btn-action btn-deactivate" title="Nonaktifkan" onClick={() => handleDeactivate(acc.id)}>
                        <FiX />
                      </button>
                    )}
                    <button className="btn-action btn-edit" title="Edit Data" onClick={() => handleOpenEdit(acc)}>
                      <FiEdit2 />
                    </button>
                    <button className="btn-action btn-deactivate" title="Reset Password" onClick={() => handleResetPassword(acc.id, acc.nama)}>
                      <FiUnlock />
                    </button>
                    <button className="btn-action btn-delete" title="Hapus Akun" onClick={() => confirmDelete(acc)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Edit Role & Kelas Binaan */}
      {showEditModal && selectedEditUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Edit Akun: {selectedEditUser.nama}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setShowEditModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSaveEditUser} className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>Peran / Role Akun</label>
                <select
                  className="modern-input"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="guru_mapel">Guru Mata Pelajaran</option>
                  <option value="wali_kelas">Wali Kelas</option>

                  <option value="sarpras">Pengelola Sarpras</option>
                  <option value="admin">Admin System</option>
                </select>
              </div>

              {editRole === 'wali_kelas' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>Kelas Binaan Wali Kelas</label>
                  <select
                    className="modern-input"
                    value={editClassroomId}
                    onChange={(e) => setEditClassroomId(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">-- Pilih Kelas Binaan --</option>
                    {classrooms.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.singkatan})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn-save-absensi" style={{ marginTop: 0 }}>Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Konfirmasi Hapus Akun</h3>
            <p>Apakah Anda yakin ingin menghapus akun <strong>{selectedAccount?.nama}</strong> ({selectedAccount?.email})?</p>
            <p className="modal-warning">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button className="btn-confirm-delete" onClick={handleDelete}>Hapus Akun</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenAkun;
