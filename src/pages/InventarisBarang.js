import React, { useState } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiBox, FiCheckCircle, FiUpload, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';

import './DataKelas.css';

const InventarisBarang = () => {
    const [activeTab, setActiveTab] = useState('barang'); // 'barang' | 'peminjaman'

    const [dataBarang, setDataBarang] = useState([
        { id: 1, kode: 'INV-001', nama: 'Proyektor Epson', kategori: 'Elektronik', jumlah: 5, kondisi: 'Baik' },
        { id: 2, kode: 'INV-002', nama: 'Papan Tulis Kaca', kategori: 'Furniture', jumlah: 12, kondisi: 'Baik' },
    ]);

    const [dataPeminjaman, setDataPeminjaman] = useState([
        {
            id: 101,
            barang_id: 1,
            nama_barang: 'Proyektor Epson',
            nama_peminjam: 'Budi Santoso',
            tanggal_pinjam: '2026-07-20',
            jumlah: 1,
            keterangan: 'Untuk presentasi kelas 10 RPL 1',
            status: 'Sedang Dipinjam'
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: null, kode: '', nama: '', kategori: 'Elektronik', jumlah: 1, kondisi: 'Baik' });

    const [showModalPinjam, setShowModalPinjam] = useState(false);
    // State form peminjaman ditambahkan keterangan
    const [formPinjam, setFormPinjam] = useState({ barang_id: null, nama_barang: '', nama_peminjam: '', tanggal_pinjam: '', jumlah: 1, keterangan: '' });

    const filteredBarang = dataBarang.filter(b =>
        b.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.kode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPeminjaman = dataPeminjaman.filter(p =>
        p.nama_peminjam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const handleSimpanBarang = (e) => {
        e.preventDefault();
        if (isEditMode) {
            setDataBarang(dataBarang.map(b => b.id === formData.id ? formData : b));
            toast.success("Data barang berhasil diperbarui!");
        } else {
            setDataBarang([...dataBarang, { ...formData, id: Date.now() }]);
            toast.success("Data barang berhasil ditambahkan!");
        }
        setShowModal(false);
    };

    const handleHapusBarang = (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus ${nama}?`)) {
            setDataBarang(dataBarang.filter(b => b.id !== id));
            toast.success("Data barang dihapus!");
        }
    };

    // --- FUNGSI BUKA MODAL PINJAM ---
    const bukaModalPinjam = (barang) => {
        if (barang.jumlah <= 0) return toast.error("Stok barang habis!");

        // Ambil tanggal hari ini secara otomatis
        const hariIni = new Date().toISOString().split('T')[0];

        // Set state agar data otomatis terisi (nama barang & tanggal)
        setFormPinjam({
            barang_id: barang.id,
            nama_barang: barang.nama,
            nama_peminjam: '',
            tanggal_pinjam: hariIni,
            jumlah: 1,
            keterangan: ''
        });
        setShowModalPinjam(true);
    };

    // --- FUNGSI SIMPAN PEMINJAMAN ---
    const handleSimpanPeminjaman = (e) => {
        e.preventDefault();
        const barangTerkait = dataBarang.find(b => b.id === formPinjam.barang_id);

        if (formPinjam.jumlah > barangTerkait.jumlah) {
            return toast.error("Jumlah pinjam melebihi stok tersedia!");
        }

        const pinjamBaru = { ...formPinjam, id: Date.now(), status: 'Sedang Dipinjam' };
        setDataPeminjaman([pinjamBaru, ...dataPeminjaman]); // Data baru di atas

        // Kurangi stok dari database state
        setDataBarang(dataBarang.map(b => b.id === formPinjam.barang_id ? { ...b, jumlah: b.jumlah - formPinjam.jumlah } : b));

        toast.success("Peminjaman berhasil dicatat!");
        setShowModalPinjam(false);
        setActiveTab('peminjaman');
        setSearchTerm('');
    };

    // --- FUNGSI KEMBALIKAN BARANG ---
    const handleKembalikanBarang = (pinjam) => {
        if (window.confirm(`Konfirmasi pengembalian barang oleh ${pinjam.nama_peminjam}?`)) {
            // Ubah status di riwayat
            setDataPeminjaman(dataPeminjaman.map(p => p.id === pinjam.id ? { ...p, status: 'Dikembalikan' } : p));

            // Tambahkan stok kembali ke database state
            setDataBarang(dataBarang.map(b => b.id === pinjam.barang_id ? { ...b, jumlah: parseInt(b.jumlah) + parseInt(pinjam.jumlah) } : b));

            toast.success("Status diperbarui: Barang dikembalikan!");
        }
    };

    return (
        <div className="data-kelas-container">
            <div className="page-header">
                <div className="header-left">
                    <h2><FiBox style={{ marginRight: '8px' }} /> Manajemen Inventaris</h2>
                </div>
            </div>

            {/* TAB NAVIGASI BARU */}
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

            {/* KONTEN TAB: DAFTAR BARANG */}
            {activeTab === 'barang' ? (
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
            ) : (
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
                                        <span><strong>Barang:</strong> {pinjam.nama_barang} ({pinjam.jumlah} unit)</span>
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
                                    {/* Tanggal dibuat otomatis dan tidak bisa diubah */}
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
                                <input type="number" min="1" max={dataBarang.find(b => b.id === formPinjam.barang_id)?.jumlah} value={formPinjam.jumlah} onChange={(e) => setFormPinjam({ ...formPinjam, jumlah: parseInt(e.target.value) })} required className="modern-input" />
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

            {/* Modal Tambah/Edit Barang (Tetap disembunyikan dalam cuplikan ini untuk menghemat ruang, Anda bisa memakai yang sebelumnya) */}
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