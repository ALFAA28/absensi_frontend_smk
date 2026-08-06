import React, { useState, useEffect } from 'react';
import { FiSearch, FiPrinter, FiCalendar, FiFilter, FiChevronRight, FiFileText, FiUsers, FiLayers, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './DataKelas.css'; // Meminjam style utama dari DataKelas
import './Laporan.css';   // Untuk styling khusus Print
import { API_URL } from '../config';

const Laporan = () => {
    // --- OPTIMASI: LAZY LOADING DARI LOCALSTORAGE AGAR TAMPIL INSTAN ---
    const [laporan, setLaporan] = useState(() => JSON.parse(localStorage.getItem('cached_laporan')) || []);
    const [dataAngkatan, setDataAngkatan] = useState(() => JSON.parse(localStorage.getItem('cached_angkatan')) || []);
    const [dataJurusan, setDataJurusan] = useState(() => JSON.parse(localStorage.getItem('cached_classrooms')) || []);
    const [isLoading, setIsLoading] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    // --- STATE FILTER BERINGKAT (CASCADING FILTERS) ---
    const [filterAngkatan, setFilterAngkatan] = useState('');
    const [filterJurusan, setFilterJurusan] = useState('');
    const [filterTanggal, setFilterTanggal] = useState('');
    const [filterBulan, setFilterBulan] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
    const [searchTerm, setSearchTerm] = useState('');

    // --- STATE EDIT ABSENSI ---
    const [showEditAbsensiModal, setShowEditAbsensiModal] = useState(false);
    const [editAbsensiTanggal, setEditAbsensiTanggal] = useState('');
    const [editAbsensiStatus, setEditAbsensiStatus] = useState('Hadir');
    const [editAbsensiKeterangan, setEditAbsensiKeterangan] = useState('');
    const [selectedEditAbsensi, setSelectedEditAbsensi] = useState(null);

    // 1. MEMUAT METADATA (Angkatan, Jurusan, Mapel) SECARA SEKUENSIAL
    // Sekuensial lebih cepat dari Promise.all di server single-thread (php artisan serve)
    // karena menghindari antrian request yang menumpuk
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                };

                // Fetch sekuensial - lebih cepat di php artisan serve (single-thread)
                const resBatches = await fetch(`${API_URL}/academic-batches`, { headers });
                if (resBatches.ok) {
                    const batches = await resBatches.json();
                    setDataAngkatan(batches);
                    localStorage.setItem('cached_angkatan', JSON.stringify(batches));
                }

                const resClassrooms = await fetch(`${API_URL}/classrooms`, { headers });
                if (resClassrooms.ok) {
                    const classrooms = await resClassrooms.json();
                    setDataJurusan(classrooms);
                    localStorage.setItem('cached_classrooms', JSON.stringify(classrooms));
                }
            } catch (error) {
                console.error("Gagal mengambil metadata laporan", error);
            }
        };

        fetchMetadata();
    }, []);

    // 2. LOGIKA CASCADING: DAFTAR JURUSAN SESUAI ANGKATAN / TINGKAT YANG DIPILIH
    const filteredJurusanList = dataJurusan.filter(j => {
        if (!filterAngkatan) return true;
        // Jika filterAngkatan adalah tingkat ('10', '11', '12'), cocokkan dengan grade
        if (['10', '11', '12'].includes(filterAngkatan)) {
            return String(j.grade) === String(filterAngkatan);
        }
        // Jika filterAngkatan adalah ID dari academic_batch (Angkatan), cocokkan dengan academic_batch_id
        if (j.academic_batch_id) {
            return String(j.academic_batch_id) === String(filterAngkatan);
        }
        // Jika j tidak memiliki academic_batch_id (data lama) tetapi pengguna memilih Angkatan dari dropdown
        if (filterAngkatan && !['10', '11', '12'].includes(filterAngkatan)) {
            // Karena kita baru menambah fitur academic_batch_id, anggap semua data lama (academic_batch_id = null)
            // masuk ke ID 1 (default) jika pengguna memfilter ID 1.
            if (String(filterAngkatan) === '1') {
                return true;
            }
            return false; // Jangan tampilkan jika filter Angkatan tidak cocok
        }

        return true;
    });

    // 4. MEMUAT DATA ABSENSI TERFILTER SECARA EFISIEN DARI BACKEND
    // Hanya fetch jika ada minimal 1 filter yang dipilih (menghindari load semua data)
    const fetchLaporan = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `${API_URL}/absensi`;
            const params = new URLSearchParams();

            if (filterTanggal) params.append('tanggal', filterTanggal);
            if (filterBulan) params.append('bulan', filterBulan);
            if (filterSemester && filterTahun) {
                params.append('semester', filterSemester);
                params.append('tahun', filterTahun);
            }
            if (filterJurusan) params.append('classroom_id', filterJurusan);
            if (filterAngkatan) params.append('batch_id', filterAngkatan);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLaporan(data);
                localStorage.setItem('cached_laporan', JSON.stringify(data));
            } else {
                console.error("Gagal mengambil data laporan dari server");
            }
        } catch (error) {
            console.error("Terjadi kesalahan koneksi", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Jangan fetch tanpa filter apapun
        const hasFilter = filterTanggal || filterBulan || filterJurusan || filterAngkatan || filterSemester;
        if (!hasFilter) {
            if (!isFirstLoad) {
                // Filter dihapus semua, kosongkan data
                setLaporan([]);
            }
            return;
        }

        setIsFirstLoad(false);
        fetchLaporan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterTanggal, filterBulan, filterJurusan, filterAngkatan, filterSemester, filterTahun]);

    // FILTER SISWA BERDASARKAN SEARCH BAR (NAMA / NISN)
    const filteredLaporan = laporan.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const namaMatches = item.nama_siswa ? item.nama_siswa.toLowerCase().includes(term) : false;
        const nisnMatches = item.nisn ? String(item.nisn).toLowerCase().includes(term) : false;
        return namaMatches || nisnMatches;
    });

    const handleEditAbsensi = (abs) => {
        setSelectedEditAbsensi(abs);
        setEditAbsensiTanggal(abs.tanggal);
        setEditAbsensiStatus(abs.status_kehadiran);
        setEditAbsensiKeterangan(abs.keterangan || '');
        setShowEditAbsensiModal(true);
    };

    const handleUpdateAbsensi = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/attendance/${selectedEditAbsensi.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    date: editAbsensiTanggal,
                    status: editAbsensiStatus,
                    notes: editAbsensiKeterangan || null
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || "Data absensi berhasil diperbarui!");
                setShowEditAbsensiModal(false);
                fetchLaporan();
            } else {
                toast.error(data.message || "Gagal memperbarui absensi.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        }
    };

    const handleHapusAbsensi = async (absensiId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data absensi ini?")) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/attendance/${absensiId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    toast.success(data.message || "Riwayat absensi berhasil dihapus!");
                    fetchLaporan();
                } else {
                    toast.error(data.message || "Gagal menghapus absensi.");
                }
            } catch (error) {
                toast.error("Terjadi kesalahan koneksi.");
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Ambil nama angkatan, jurusan & mapel aktif untuk header cetak
    const currentAngkatanObj = dataAngkatan.find(b => String(b.id) === String(filterAngkatan) || String(b.name) === String(filterAngkatan));
    const currentJurusanObj = dataJurusan.find(j => String(j.id) === String(filterJurusan));

    return (
        <div className="data-kelas-container">
            {/* BREADCRUMB */}
            <div className="breadcrumb no-print">
                <span className="clickable">Manajemen</span>
                <FiChevronRight className="breadcrumb-icon" />
                <span className="active">Laporan Absensi</span>
            </div>

            {/* HEADER */}
            <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-left">
                    <h2><FiFileText style={{ marginRight: '8px' }} /> Laporan Absensi</h2>
                </div>
                <div>
                    <button className="btn-add no-print" onClick={handlePrint} style={{ background: 'linear-gradient(135deg, var(--primary-color), #6366f1)', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
                        <FiPrinter /> Cetak Laporan
                    </button>
                </div>
            </div>

            {/* AREA KONTEN UTAMA */}
            <div className="content-area">

                {/* TOOLBAR FILTER MULTI-LEVEL (Angkatan -> Jurusan -> Mapel) */}
                <div className="toolbar no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--surface-color)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>

                    {/* 1. FILTER ANGKATAN / TINGKAT */}
                    <div className="filter-group">
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiLayers /> Angkatan / Tingkat
                        </label>
                        <select
                            className="modern-input"
                            value={filterAngkatan}
                            onChange={(e) => {
                                setFilterAngkatan(e.target.value);
                            }}
                            style={{ width: '100%' }}
                        >
                            <option value="">Semua Angkatan / Tingkat</option>
                            {dataAngkatan.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.name || `Angkatan ${b.year}`}
                                </option>
                            ))}
                            <option value="10">Tingkat 10</option>
                            <option value="11">Tingkat 11</option>
                            <option value="12">Tingkat 12</option>
                        </select>
                    </div>

                    {/* 2. FILTER JURUSAN / KELAS */}
                    <div className="filter-group">
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiUsers /> Jurusan / Kelas
                        </label>
                        <select
                            className="modern-input"
                            value={filterJurusan}
                            onChange={(e) => {
                                setFilterJurusan(e.target.value);
                            }}
                            style={{ width: '100%' }}
                        >
                            <option value="">Semua Jurusan/Kelas</option>
                            {filteredJurusanList.map(kelas => (
                                <option key={kelas.id} value={kelas.id}>
                                    {kelas.name || kelas.nama_jurusan} ({kelas.singkatan})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. TANGGAL HARIAN */}
                    <div className="filter-group">
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiCalendar /> Tanggal Harian
                        </label>
                        <input
                            type="date"
                            className="modern-input"
                            value={filterTanggal}
                            onChange={(e) => {
                                setFilterTanggal(e.target.value);
                                if (e.target.value) {
                                    setFilterBulan('');
                                    setFilterSemester('');
                                }
                            }}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* 5. BERDASARKAN BULAN */}
                    <div className="filter-group">
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiFilter /> Berdasarkan Bulan
                        </label>
                        <input
                            type="month"
                            className="modern-input"
                            value={filterBulan}
                            onChange={(e) => {
                                setFilterBulan(e.target.value);
                                if (e.target.value) {
                                    setFilterTanggal('');
                                    setFilterSemester('');
                                }
                            }}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* 5.5 BERDASARKAN SEMESTER */}
                    <div className="filter-group">
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiFilter /> Berdasarkan Semester
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                                className="modern-input"
                                value={filterSemester}
                                onChange={(e) => {
                                    setFilterSemester(e.target.value);
                                    if (e.target.value) {
                                        setFilterTanggal('');
                                        setFilterBulan('');
                                    }
                                }}
                                style={{ flex: 1, padding: '12px' }}
                            >
                                <option value="">Semua</option>
                                <option value="ganjil">Ganjil (Jul - Des)</option>
                                <option value="genap">Genap (Jan - Jun)</option>
                            </select>
                            <input
                                type="number"
                                className="modern-input"
                                value={filterTahun}
                                onChange={(e) => setFilterTahun(e.target.value)}
                                style={{ width: '80px', padding: '12px 8px' }}
                            />
                        </div>
                    </div>

                    {/* 6. CARI SISWA */}
                    <div className="filter-group">
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiSearch /> Cari Siswa
                        </label>
                        <div className="search-box" style={{ width: '100%' }}>
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Ketik NISN atau Nama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* TABEL DATA LAPORAN (Print Area) */}
                <div className="print-area">
                    <div className="print-only-header">
                        <h2 className="print-school-name">SMK Nahdlatul Ulama Donomulyo</h2>
                        <p className="print-school-address">Jl. Raya Donomulyo, Kec. Donomulyo, Kab. Malang, Jawa Timur</p>
                        <h3 className="print-report-title">Laporan Kehadiran Siswa</h3>
                        <p className="print-filter-info">
                            {currentAngkatanObj && <span>Angkatan: <strong>{currentAngkatanObj.name || currentAngkatanObj.year}</strong></span>}
                            {currentJurusanObj && <span>| Jurusan: <strong>{currentJurusanObj.nama_jurusan || currentJurusanObj.name}</strong></span>}
                            {filterTanggal && <span>| Tanggal: <strong>{filterTanggal}</strong></span>}
                            {filterBulan && <span>| Bulan: <strong>{filterBulan}</strong></span>}
                            {filterSemester && <span>| Semester: <strong>{filterSemester === 'ganjil' ? 'Ganjil (Jul-Des)' : 'Genap (Jan-Jun)'} {filterTahun}</strong></span>}
                            {searchTerm && <span>| Pencarian: <strong>"{searchTerm}"</strong></span>}
                            {!filterTanggal && !filterBulan && !filterSemester && !currentAngkatanObj && !currentJurusanObj && <span>Semua Riwayat Waktu</span>}
                        </p>
                        <p className="print-date">Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div className="table-container">
                        <table className="kelas-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Tanggal</th>
                                    <th>NISN</th>
                                    <th>Nama Siswa</th>
                                    <th>Kelas</th>
                                    <th>Kehadiran</th>
                                    <th>Keterangan</th>
                                    <th className="no-print">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Memuat data laporan...</td>
                                    </tr>
                                ) : isFirstLoad && filteredLaporan.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                            Silakan pilih filter di atas (Angkatan, Jurusan, Mapel, Tanggal, atau Bulan) untuk menampilkan data laporan.
                                        </td>
                                    </tr>
                                ) : filteredLaporan.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                            Tidak ada data kehadiran yang sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLaporan.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td>{index + 1}</td>
                                            <td>{item.tanggal}</td>
                                            <td>{item.nisn}</td>
                                            <td>{item.nama_siswa || '-'}</td>
                                            <td>{item.kelas_siswa || '-'}</td>
                                            <td>
                                                <span className={`badge-status status-${item.status_kehadiran ? item.status_kehadiran.toLowerCase() : ''}`}>
                                                    {item.status_kehadiran || '-'}
                                                </span>
                                            </td>
                                            <td>{item.keterangan || '-'}</td>
                                            <td className="actions-cell no-print">
                                                <button className="btn-edit" title="Edit Absensi" onClick={() => handleEditAbsensi(item)}><FiEdit2 /></button>
                                                <button className="btn-action btn-delete" title="Hapus Absensi" onClick={() => handleHapusAbsensi(item.id)}><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* --- MODAL EDIT ABSENSI --- */}
            {showEditAbsensiModal && selectedEditAbsensi && (
                <div className="modal-overlay" onClick={() => setShowEditAbsensiModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Data Absensi Laporan</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowEditAbsensiModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleUpdateAbsensi} className="modal-body">
                            <div className="form-group">
                                <label>Tanggal</label>
                                <input type="date" value={editAbsensiTanggal} onChange={(e) => setEditAbsensiTanggal(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={editAbsensiStatus} onChange={(e) => setEditAbsensiStatus(e.target.value)} className="modern-input">
                                    <option value="Hadir">Hadir</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Alfa">Alfa</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Keterangan (Opsional)</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="Contoh: Sakit tipes"
                                    value={editAbsensiKeterangan}
                                    onChange={(e) => setEditAbsensiKeterangan(e.target.value)}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowEditAbsensiModal(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi">Update Absensi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Laporan;