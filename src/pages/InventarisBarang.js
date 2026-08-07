import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiBox, FiCheckCircle, FiUpload, FiClock, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

import './DataKelas.css';

const InventarisBarang = () => {
    const [activeTab, setActiveTab] = useState('barang'); // 'barang' | 'peminjaman'
    const [loading, setLoading] = useState(false);

    const [dataBarang, setDataBarang] = useState([]);
    const [dataPeminjaman, setDataPeminjaman] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: null, kode: '', nama: '', kategori: 'Elektronik', jumlah: 1, kondisi: 'Baik' });

    const [showModalPinjam, setShowModalPinjam] = useState(false);
    const [formPinjam, setFormPinjam] = useState({ inventaris_id: null, nama_barang: '', nama_peminjam: '', tanggal_pinjam: '', jumlah: 1, keterangan: '' });

    // Helper: get auth headers
    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
    });

    // ========================
    // FETCH DATA DARI API
    // ========================

    const fetchBarang = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/inventaris`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Gagal mengambil data barang');
            const data = await res.json();
            setDataBarang(data);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data barang');
        }
    }, []);

    const fetchPeminjaman = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/peminjaman`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Gagal mengambil data peminjaman');
            const data = await res.json();
            setDataPeminjaman(data);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data peminjaman');
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchBarang(), fetchPeminjaman()]).finally(() => setLoading(false));
    }, [fetchBarang, fetchPeminjaman]);

    // ========================
    // FILTER
    // ========================

    const filteredBarang = dataBarang.filter(b =>
        b.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.kode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPeminjaman = dataPeminjaman.filter(p =>
        p.nama_peminjam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.inventaris?.nama || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ========================
    // CRUD BARANG
    // ========================

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const bukaModalTambah = () => {
        setIsEditMode(false);
        setFormData({ id: null, kode: '', nama: '', kategori: 'Elektronik', jumlah: 1, kondisi: 'Baik' });
        setShowModal(true);
    };

    const bukaModalEdit = (barang) => {
        setIsEditMode(true);
        setFormData(barang);
        setShowModal(true);
    };

    const handleSimpanBarang = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = isEditMode ? `${API_URL}/inventaris/${formData.id}` : `${API_URL}/inventaris`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify({
                    kode: formData.kode,
                    nama: formData.nama,
                    kategori: formData.kategori,
                    jumlah: parseInt(formData.jumlah),
                    kondisi: formData.kondisi,
                }),
            });

            // Handle non-JSON responses (e.g. HTML error pages)
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server error: respons bukan JSON. Pastikan backend sudah deploy.');
            }

            const result = await res.json();

            if (!res.ok) {
                // Tampilkan pesan validasi dari Laravel
                if (result.errors) {
                    const firstError = Object.values(result.errors)[0][0];
                    throw new Error(firstError);
                }
                throw new Error(result.message || 'Gagal menyimpan data');
            }

            toast.success(isEditMode ? "Data barang berhasil diperbarui!" : "Data barang berhasil ditambahkan!");
            setShowModal(false);
            await fetchBarang();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleHapusBarang = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus ${nama}?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/inventaris/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Gagal menghapus barang');
            toast.success("Data barang dihapus!");
            await fetchBarang();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ========================
    // PEMINJAMAN
    // ========================

    const bukaModalPinjam = (barang) => {
        if (barang.jumlah <= 0) return toast.error("Stok barang habis!");

        const hariIni = new Date().toISOString().split('T')[0];

        setFormPinjam({
            inventaris_id: barang.id,
            nama_barang: barang.nama,
            nama_peminjam: '',
            tanggal_pinjam: hariIni,
            jumlah: 1,
            keterangan: ''
        });
        setShowModalPinjam(true);
    };

    const handleSimpanPeminjaman = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/peminjaman`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    inventaris_id: formPinjam.inventaris_id,
                    nama_peminjam: formPinjam.nama_peminjam,
                    tanggal_pinjam: formPinjam.tanggal_pinjam,
                    jumlah: parseInt(formPinjam.jumlah),
                    keterangan: formPinjam.keterangan,
                }),
            });

            // Handle non-JSON responses
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server error: respons bukan JSON. Pastikan backend sudah deploy.');
            }

            const result = await res.json();
            if (!res.ok) {
                if (result.errors) {
                    const firstError = Object.values(result.errors)[0][0];
                    throw new Error(firstError);
                }
                throw new Error(result.message || 'Gagal menyimpan peminjaman');
            }

            toast.success("Peminjaman berhasil dicatat!");
            setShowModalPinjam(false);
            setActiveTab('peminjaman');
            setSearchTerm('');
            await Promise.all([fetchBarang(), fetchPeminjaman()]);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKembalikanBarang = async (pinjam) => {
        if (!window.confirm(`Konfirmasi pengembalian barang oleh ${pinjam.nama_peminjam}?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/peminjaman/${pinjam.id}/kembalikan`, {
                method: 'PUT',
                headers: getHeaders(),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Gagal mengembalikan barang');

            toast.success("Status diperbarui: Barang dikembalikan!");
            await Promise.all([fetchBarang(), fetchPeminjaman()]);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="data-kelas-container">
            <div className="page-header">
                <div className="header-left">
                    <h2><FiBox style={{ marginRight: '8px' }} /> Manajemen Inventaris</h2>
                </div>
            </div>

            {/* TAB NAVIGASI */}
            <div className="inventaris-tabs">
                <div className={`tab-item ${activeTab === 'barang' ? 'active' : ''}`} onClick={() => { setActiveTab('barang'); setSearchTerm(''); }}>
                    Daftar Barang
                </div>
                <div className="tab-divider">|</div>
                <div className={`tab-item ${activeTab === 'peminjaman' ? 'active' : ''}`} onClick={() => { setActiveTab('peminjaman'); setSearchTerm(''); }}>
                    Riwayat Peminjaman
                </div>
            </div>

            <div className="toolbar">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder={activeTab === 'barang' ? "Cari kode/nama barang..." : "Cari nama peminjam..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {activeTab === 'barang' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-add" onClick={bukaModalTambah}>
                            <FiPlus className="icon-left" /> Tambah Barang
                        </button>
                    </div>
                )}
            </div>

            {/* LOADING INDICATOR */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    <FiLoader style={{ animation: 'spin 1s linear infinite', fontSize: '24px' }} />
                    <p style={{ marginTop: '8px' }}>Memuat data...</p>
                </div>
            )}

            {/* KONTEN TAB: DAFTAR BARANG */}
            {(!loading && activeTab === 'barang') ? (
                <div className="table-container">
                    <table className="kelas-table">
                        <thead>
                            <tr>
                                <th>No</th><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Stok</th><th>Kondisi</th><th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBarang.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Data tidak ditemukan</td></tr>
                            ) : (
                                filteredBarang.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td className="fw-bold">{item.kode}</td>
                                        <td>{item.nama}</td>
                                        <td>{item.kategori}</td>
                                        <td>
                                            <span style={{ color: item.jumlah > 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                                                {item.jumlah}
                                            </span>
                                        </td>
                                        <td><span className={`badge-siswa status-${item.kondisi.replace(/\s+/g, '-').toLowerCase()}`}>{item.kondisi}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-action" title="Pinjam Barang" onClick={() => bukaModalPinjam(item)} style={{ color: item.jumlah > 0 ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: item.jumlah > 0 ? 'pointer' : 'not-allowed' }}>
                                                    <FiUpload />
                                                </button>
                                                <button className="btn-action btn-edit" onClick={() => bukaModalEdit(item)}><FiEdit2 /></button>
                                                <button className="btn-action btn-delete" onClick={() => handleHapusBarang(item.id, item.nama)}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : !loading && (
                /* KONTEN TAB: RIWAYAT PEMINJAMAN (BENTUK CARD) */
                <div className="card-grid">
                    {filteredPeminjaman.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', width: '100%', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>Belum ada riwayat peminjaman</div>
                    ) : (
                        filteredPeminjaman.map((pinjam) => (
                            <div key={pinjam.id} className="history-card">

                                <div className="history-header">
                                    <h3>{pinjam.nama_peminjam}</h3>
                                    <span className={`badge-siswa ${pinjam.status === 'Sedang Dipinjam' ? 'status-drop-out' : 'status-aktif'}`}>
                                        {pinjam.status}
                                    </span>
                                </div>

                                <div className="history-body">
                                    <div className="history-body-row">
                                        <FiBox style={{ color: 'var(--info-color)', marginTop: '2px' }} />
                                        <span><strong>Barang:</strong> {pinjam.inventaris?.nama || 'N/A'} ({pinjam.jumlah} unit)</span>
                                    </div>
                                    <div className="history-body-row">
                                        <FiClock style={{ color: 'var(--warning-color)', marginTop: '2px' }} />
                                        <span><strong>Tanggal:</strong> {pinjam.tanggal_pinjam}</span>
                                    </div>
                                    <div className="history-body-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                                        <span><strong>Ket:</strong> <i>{pinjam.keterangan}</i></span>
                                    </div>
                                </div>

                                {pinjam.status === 'Sedang Dipinjam' && (
                                    <button
                                        className="btn-add"
                                        onClick={() => handleKembalikanBarang(pinjam)}
                                        style={{ background: 'linear-gradient(135deg, var(--success-color), #059669)', color: 'white', width: '100%', justifyContent: 'center', marginTop: 'auto', border: 'none', padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                                    >
                                        <FiCheckCircle className="icon-left" /> Tandai Dikembalikan
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* --- MODAL FORM PINJAM BARANG --- */}
            {showModalPinjam && (
                <div className="modal-overlay" onClick={() => setShowModalPinjam(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Form Peminjaman Barang</h3>
                            <button className="btn-close-modal" onClick={() => setShowModalPinjam(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSimpanPeminjaman} className="modal-body form-absensi">

                            {/* Input Otomatis (Disabled) */}
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '8px' }}>
                                <div>
                                    <label>Barang yang Dipinjam</label>
                                    <input type="text" value={formPinjam.nama_barang} disabled className="modern-input" style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed', color: 'var(--text-secondary)' }} />
                                </div>
                                <div>
                                    <label>Tanggal Pinjam</label>
                                    <input type="date" value={formPinjam.tanggal_pinjam} disabled className="modern-input" style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed', color: 'var(--text-secondary)' }} />
                                </div>
                            </div>

                            {/* Input Manual */}
                            <div className="form-group">
                                <label>Nama Peminjam</label>
                                <input type="text" placeholder="Masukkan nama peminjam..." value={formPinjam.nama_peminjam} onChange={(e) => setFormPinjam({ ...formPinjam, nama_peminjam: e.target.value })} required className="modern-input" />
                            </div>

                            <div className="form-group">
                                <label>Jumlah Pinjam</label>
                                <input type="number" min="1" max={dataBarang.find(b => b.id === formPinjam.inventaris_id)?.jumlah} value={formPinjam.jumlah} onChange={(e) => setFormPinjam({ ...formPinjam, jumlah: parseInt(e.target.value) })} required className="modern-input" />
                            </div>

                            <div className="form-group">
                                <label>Keterangan Peminjaman</label>
                                <textarea
                                    placeholder="Contoh: Digunakan untuk mengajar di kelas..."
                                    value={formPinjam.keterangan}
                                    onChange={(e) => setFormPinjam({ ...formPinjam, keterangan: e.target.value })}
                                    required
                                    className="modern-input"
                                    style={{ minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModalPinjam(false)}>Batal</button>
                                <button type="submit" className="btn-add" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>Simpan Peminjaman</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Barang */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{isEditMode ? 'Edit Data Barang' : 'Tambah Data Barang'}</h3>
                            <button className="btn-close-modal" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSimpanBarang} className="modal-body form-absensi">
                            <div className="form-group">
                                <label>Kode Barang</label>
                                <input type="text" name="kode" value={formData.kode} onChange={handleInputChange} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Nama Barang</label>
                                <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} required className="modern-input" />
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label>Kategori</label>
                                    <select name="kategori" value={formData.kategori} onChange={handleInputChange} className="modern-input">
                                        <option value="Elektronik">Elektronik</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Aksesoris">Aksesoris</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Jumlah</label>
                                    <input type="number" name="jumlah" min="1" value={formData.jumlah} onChange={handleInputChange} required className="modern-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Kondisi</label>
                                <select name="kondisi" value={formData.kondisi} onChange={handleInputChange} className="modern-input">
                                    <option value="Baik">Baik</option>
                                    <option value="Rusak Ringan">Rusak Ringan</option>
                                    <option value="Rusak Berat">Rusak Berat</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventarisBarang;