import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiFolder, FiUsers, FiChevronRight, FiArrowLeft, FiSave, FiX, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import './DataKelas.css';
import { API_URL } from '../config';

const DataKelas = () => {
    // State Navigasi
    const [currentView, setCurrentView] = useState('angkatan'); // 'angkatan' | 'jurusan' | 'siswa' | 'detail_siswa'

    // State Pemilihan
    const [selectedAngkatan, setSelectedAngkatan] = useState(null);
    const [selectedJurusan, setSelectedJurusan] = useState(null);
    const [selectedSiswa, setSelectedSiswa] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    // State Input Absensi Manual
    const [selectedBulan, setSelectedBulan] = useState('2026-07');
    const [inputTanggal, setInputTanggal] = useState('');
    const [inputStatus, setInputStatus] = useState('Hadir');
    const [inputKeterangan, setInputKeterangan] = useState('');

    // --- STATE MODAL ANGKATAN ---
    const [showModalAngkatan, setShowModalAngkatan] = useState(false);
    const [inputNamaAngkatan, setInputNamaAngkatan] = useState('');
    const [inputTahunAngkatan, setInputTahunAngkatan] = useState('');

    // --- STATE MODAL JURUSAN ---
    const [showModalJurusan, setShowModalJurusan] = useState(false);
    const [inputNamaJurusan, setInputNamaJurusan] = useState('');
    const [inputSingkatanJurusan, setInputSingkatanJurusan] = useState('');

    // --- STATE MODAL SISWA ---
    const [showModalSiswa, setShowModalSiswa] = useState(false);
    const [inputNamaSiswa, setInputNamaSiswa] = useState('');
    const [inputNisn, setInputNisn] = useState('');

    // --- STATE EDIT SISWA ---
    const [showEditModalSiswa, setShowEditModalSiswa] = useState(false);
    const [editNamaSiswa, setEditNamaSiswa] = useState('');
    const [editNisn, setEditNisn] = useState('');
    const [editStatusSiswa, setEditStatusSiswa] = useState('Aktif');
    const [editStatusKeteranganSiswa, setEditStatusKeteranganSiswa] = useState('');
    const [selectedEditSiswa, setSelectedEditSiswa] = useState(null);

    // --- STATE BULK UPDATE STATUS ---
    const [showModalBulkStatus, setShowModalBulkStatus] = useState(false);
    const [bulkStatusValue, setBulkStatusValue] = useState('Aktif');
    const [bulkStatusKeterangan, setBulkStatusKeterangan] = useState('');

    // --- STATE EDIT ANGKATAN ---
    const [showEditModalAngkatan, setShowEditModalAngkatan] = useState(false);
    const [editNamaAngkatan, setEditNamaAngkatan] = useState('');
    const [editTahunAngkatan, setEditTahunAngkatan] = useState('');
    const [selectedEditAngkatan, setSelectedEditAngkatan] = useState(null);

    const [showEditModalJurusan, setShowEditModalJurusan] = useState(false);
    const [editNamaJurusan, setEditNamaJurusan] = useState('');
    const [editSingkatanJurusan, setEditSingkatanJurusan] = useState('');
    const [selectedEditJurusan, setSelectedEditJurusan] = useState(null);

    // --- EDIT ABSENSI ---
    const [showEditAbsensiModal, setShowEditAbsensiModal] = useState(false);
    const [editAbsensiTanggal, setEditAbsensiTanggal] = useState('');
    const [editAbsensiStatus, setEditAbsensiStatus] = useState('Hadir');
    const [selectedEditAbsensi, setSelectedEditAbsensi] = useState(null);

    // --- LOADING EDIT STATE ---
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);

    // --- STATE MATA PELAJARAN & LAINNYA ---
    const [dataMapel, setDataMapel] = useState(() => JSON.parse(localStorage.getItem('cached_mapel')) || []);
    const [inputKodeMapel, setInputKodeMapel] = useState('');
    const [inputNamaMapel, setInputNamaMapel] = useState('');
    const [showModalMapel, setShowModalMapel] = useState(false);

    // State Absensi Massal Guru Mapel
    const [absensiMassal, setAbsensiMassal] = useState({});
    const [absensiKeteranganMassal, setAbsensiKeteranganMassal] = useState({});

    const userRole = localStorage.getItem('role');
    const userClassroomId = localStorage.getItem('classroomId');

    // --- LAZY INITIAL STATE UNTUK LOADING INSTAN ---
    const [dataAngkatan, setDataAngkatan] = useState(() => JSON.parse(localStorage.getItem('cached_angkatan')) || []);
    const [dataJurusan, setDataJurusan] = useState(() => JSON.parse(localStorage.getItem('cached_classrooms')) || []);
    const [dataSiswa, setDataSiswa] = useState(() => JSON.parse(localStorage.getItem('cached_students')) || []);
    const [dataAbsensi, setDataAbsensi] = useState([]);

    // --- OPTIMASI: FETCH SEKUENSIAL (LEBIH CEPAT DI php artisan serve SINGLE-THREAD) ---
    const fetchAllData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };

        try {
            // Fetch sekuensial - setiap response langsung di-render (progresif)
            // 1. Proses Data Angkatan
            const resBatches = await fetch(`${API_URL}/academic-batches`, { headers });
            if (resBatches.ok) {
                const batchesData = await resBatches.json();
                setDataAngkatan(batchesData);
                localStorage.setItem('cached_angkatan', JSON.stringify(batchesData));
            }

            // 2. Proses Data Kelas/Jurusan
            const resClassrooms = await fetch(`${API_URL}/classrooms`, { headers });
            if (resClassrooms.ok) {
                const classroomData = await resClassrooms.json();
                const formattedClassrooms = classroomData.map(kelas => ({
                    id: kelas.id,
                    angkatan_id: kelas.academic_batch_id || 1,
                    nama_jurusan: kelas.name,
                    singkatan: kelas.singkatan,
                    grade: kelas.grade
                }));
                setDataJurusan(formattedClassrooms);
                localStorage.setItem('cached_classrooms', JSON.stringify(formattedClassrooms));
            }

            // 3. Proses Data Mata Pelajaran
            const resSubjects = await fetch(`${API_URL}/subjects`, { headers });
            if (resSubjects.ok) {
                const subjectData = await resSubjects.json();
                setDataMapel(subjectData);
                localStorage.setItem('cached_mapel', JSON.stringify(subjectData));
            }

            // 4. Proses Data Siswa (termasuk rekap count dari withCount database)
            const resStudents = await fetch(`${API_URL}/students`, { headers });
            if (resStudents.ok) {
                const studentData = await resStudents.json();
                const formattedStudents = studentData.map(siswa => ({
                    id: siswa.id,
                    jurusan_id: Number(siswa.classroom_id),
                    nisn: siswa.nisn,
                    nama: siswa.name,
                    kelas: siswa.classroom ? siswa.classroom.name : '-',
                    status: siswa.status || 'Aktif',
                    status_keterangan: siswa.status_keterangan || null,
                    // Rekap absensi langsung dari SQL subquery database
                    hadir_count: Number(siswa.hadir_count || 0),
                    sakit_count: Number(siswa.sakit_count || 0),
                    izin_count: Number(siswa.izin_count || 0),
                    alfa_count: Number(siswa.alfa_count || 0)
                }));
                setDataSiswa(formattedStudents);
                localStorage.setItem('cached_students', JSON.stringify(formattedStudents));
            }
        } catch (error) {
            console.error("Gagal menyinkronkan data dari server", error);
        }
    };

    // --- OPTIMASI: FETCH ABSENSI ON-DEMAND UNTUK SATU SISWA ---
    const fetchAbsensiSiswa = async (siswaId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/attendance?student_id=${siswaId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const absData = await response.json();
                setDataAbsensi(absData);
            }
        } catch (error) {
            console.error("Gagal memuat absensi siswa", error);
        }
    };

    useEffect(() => {
        fetchAllData();
        
        // Initialize current state in history
        window.history.replaceState({ view: 'angkatan', angkatan: null, jurusan: null, siswa: null }, '');

        const handlePopState = (event) => {
            if (event.state && event.state.view) {
                setCurrentView(event.state.view);
                setSelectedAngkatan(event.state.angkatan || null);
                setSelectedJurusan(event.state.jurusan || null);
                setSelectedSiswa(event.state.siswa || null);
            } else {
                setCurrentView('angkatan');
                setSelectedAngkatan(null);
                setSelectedJurusan(null);
                setSelectedSiswa(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleMasukJurusan = (angkatan) => {
        window.history.pushState({ view: 'jurusan', angkatan, jurusan: null, siswa: null }, '');
        setSelectedAngkatan(angkatan);
        setCurrentView('jurusan');
        setSearchTerm('');
    };

    const handleMasukSiswa = (jurusan) => {
        window.history.pushState({ view: 'siswa', angkatan: selectedAngkatan, jurusan, siswa: null }, '');
        setSelectedJurusan(jurusan);
        setCurrentView('siswa');
        setSearchTerm('');
    };

    const handleMasukDetailSiswa = (siswa) => {
        window.history.pushState({ view: 'detail_siswa', angkatan: selectedAngkatan, jurusan: selectedJurusan, siswa }, '');
        setSelectedSiswa(siswa);
        setCurrentView('detail_siswa');
        setSearchTerm('');
        // Fetch absensi on-demand untuk siswa yang dipilih
        fetchAbsensiSiswa(siswa.id);
    };

    const handleKembali = () => {
        window.history.back();
    };

    const handleUbahStatusSiswa = async (siswaId, newStatus, newKeterangan = null) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/students/${siswaId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus,
                    status_keterangan: newKeterangan
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || `Status siswa berhasil diubah!`);
                
                // Optimasi: Update state lokal tanpa fetch ulang semua data
                setDataSiswa(prevSiswa => {
                    const updatedSiswa = prevSiswa.map(siswa => {
                        if (siswa.id === siswaId) {
                            return { ...siswa, status: data.data.status, status_keterangan: data.data.status_keterangan };
                        }
                        return siswa;
                    });
                    localStorage.setItem('cached_students', JSON.stringify(updatedSiswa));
                    return updatedSiswa;
                });

                if (selectedSiswa && selectedSiswa.id === siswaId) {
                    setSelectedSiswa(prev => ({
                        ...prev,
                        status: data.data.status,
                        status_keterangan: data.data.status_keterangan
                    }));
                }
            } else {
                toast.error(data.message || "Gagal mengubah status siswa.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi ke server.");
        }
    };

    const handleBulkUpdateStatus = async (e) => {
        e.preventDefault();
        if (!selectedJurusan) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/students/bulk-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    classroom_id: selectedJurusan.id,
                    status: bulkStatusValue,
                    status_keterangan: bulkStatusKeterangan || null
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || 'Status seluruh siswa berhasil diperbarui!');
                setShowModalBulkStatus(false);
                setBulkStatusValue('Aktif');
                setBulkStatusKeterangan('');
                await fetchAllData();
            } else {
                toast.error(data.message || 'Gagal mengubah status massal.');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan koneksi ke server.');
        }
    };

    const handleHapusAbsensi = async (absensiId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus riwayat absensi ini?")) {
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
                    await fetchAllData();
                    if (selectedSiswa) fetchAbsensiSiswa(selectedSiswa.id);
                } else {
                    toast.error(data.message || "Gagal menghapus absensi.");
                }
            } catch (error) {
                toast.error("Terjadi kesalahan koneksi.");
            }
        }
    };

    const handleSimpanAbsensi = async (e) => {
        e.preventDefault();
        if (selectedSiswa?.status === 'Nonaktif') {
            return toast.error(`Siswa ${selectedSiswa.nama} berstatus Nonaktif (${selectedSiswa.status_keterangan || ''}), tidak dapat di-absen.`);
        }
        if (!inputTanggal) return toast.error("Pilih tanggal terlebih dahulu!");

        try {
            const token = localStorage.getItem('token');
            const payload = {
                date: inputTanggal,
                attendances: [
                    {
                        student_id: selectedSiswa.id,
                        status: inputStatus,
                        notes: inputKeterangan || null
                    }
                ]
            };

            const response = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Absensi berhasil ditambahkan!");
                setInputTanggal('');
                setInputStatus('Hadir');
                setInputKeterangan('');
                await fetchAllData();
                if (selectedSiswa) fetchAbsensiSiswa(selectedSiswa.id);
            } else {
                toast.error(data.message || "Gagal menyimpan absensi.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        }
    };

    const handleSimpanAbsensiMassal = async () => {
        if (!inputTanggal) return toast.error("Pilih tanggal absensi terlebih dahulu!");

        // Filter hanya siswa yang Aktif untuk di-absen (lewati Lulus / Drop Out / Nonaktif)
        const activeStudents = filteredData.filter(s => s.status === 'Aktif' || (s.status !== 'Nonaktif' && s.status !== 'Lulus' && s.status !== 'Drop Out'));

        if (activeStudents.length === 0) {
            return toast.error("Tidak ada siswa aktif di kelas ini yang dapat di-absen.");
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                date: inputTanggal,
                attendances: activeStudents.map(s => ({
                    student_id: s.id,
                    status: absensiMassal[s.id] || 'Hadir',
                    notes: absensiKeteranganMassal[s.id] || null
                }))
            };

            // 1. UPDATE REKAP SISWA INSTAN SECARA OPTIMISTIS PADA STATE FE (Hanya Siswa Aktif)
            const newAbsensiMap = {};
            activeStudents.forEach(s => {
                newAbsensiMap[s.id] = absensiMassal[s.id] || 'Hadir';
            });

            setDataSiswa(prevSiswa => prevSiswa.map(s => {
                if (newAbsensiMap[s.id]) {
                    const st = newAbsensiMap[s.id];
                    return {
                        ...s,
                        hadir_count: (s.hadir_count || 0) + (st === 'Hadir' ? 1 : 0),
                        sakit_count: (s.sakit_count || 0) + (st === 'Sakit' ? 1 : 0),
                        izin_count: (s.izin_count || 0) + (st === 'Izin' ? 1 : 0),
                        alfa_count: (s.alfa_count || 0) + (st === 'Alfa' || st === 'Alpa' ? 1 : 0),
                    };
                }
                return s;
            }));

            // 2. KIRIM KE DATABASE API
            const response = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || "Absensi massal berhasil disimpan!");
                setAbsensiMassal({});
                setAbsensiKeteranganMassal({});
                setInputTanggal('');
                // 3. SYNCHRONIZE DATA SINKRON DARI DATABASE
                await fetchAllData();
            } else {
                await fetchAllData(); // Revert back jika ada error dari DB
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0][0];
                    toast.error(`Gagal: ${firstError}`);
                } else {
                    toast.error(data.message || "Gagal menyimpan absensi.");
                }
            }
        } catch (error) {
            await fetchAllData();
            toast.error("Terjadi kesalahan koneksi.");
        }
    };

    const handleSimpanAngkatan = async (e) => {
        e.preventDefault();
        if (!inputNamaAngkatan || !inputTahunAngkatan) {
            return toast.error("Nama dan Tahun Angkatan wajib diisi!");
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/academic-batches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: inputNamaAngkatan,
                    year: inputTahunAngkatan
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Data Angkatan berhasil disimpan ke Database!");
                setInputNamaAngkatan('');
                setInputTahunAngkatan('');
                setShowModalAngkatan(false);
                fetchAllData(); // Segarkan data secara instan
            } else {
                toast.error(data.message || "Gagal menyimpan angkatan.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        }
    };

    const handleSimpanJurusan = async (e) => {
        e.preventDefault();
        if (!inputNamaJurusan) {
            return toast.error("Nama Jurusan/Kelas wajib diisi!");
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/classrooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: inputNamaJurusan,
                    singkatan: inputSingkatanJurusan || inputNamaJurusan,
                    grade: '10',
                    academic_batch_id: selectedAngkatan?.id || 1
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Jurusan berhasil dibuat dan otomatis terhubung ke akun Anda!");

                if (data.assigned_classroom_id) {
                    localStorage.setItem('classroomId', data.assigned_classroom_id);
                }

                setInputNamaJurusan('');
                setInputSingkatanJurusan('');
                setShowModalJurusan(false);
                fetchAllData();
            } else {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0][0];
                    toast.error(`Gagal: ${firstError}`);
                } else {
                    toast.error(data.message || "Gagal menyimpan jurusan.");
                }
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        }
    };

    const handleSimpanSiswa = async (e) => {
        e.preventDefault();
        if (!selectedJurusan) {
            return toast.error("Silakan pilih jurusan/kelas terlebih dahulu!");
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: inputNamaSiswa,
                    nisn: inputNisn,
                    classroom_id: selectedJurusan.id
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Siswa berhasil ditambahkan ke kelas ini!");
                setShowModalSiswa(false);
                setInputNamaSiswa('');
                setInputNisn('');
                fetchAllData();
            } else {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0][0];
                    toast.error(`Gagal: ${firstError}`);
                } else {
                    toast.error(data.message || "Gagal menyimpan siswa.");
                }
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        }
    };

    const handleEditAngkatan = (angkatan) => {
        setSelectedEditAngkatan(angkatan);
        setEditNamaAngkatan(angkatan.name);
        setEditTahunAngkatan(angkatan.year);
        setShowEditModalAngkatan(true);
    };

    const handleUpdateAngkatan = async (e) => {
        e.preventDefault();
        if (!editNamaAngkatan || !editTahunAngkatan) {
            toast.error("Nama dan Tahun Angkatan wajib diisi!");
            return;
        }

        setIsLoadingEdit(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/academic-batches/${selectedEditAngkatan.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: editNamaAngkatan,
                    year: editTahunAngkatan
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Data Angkatan berhasil diupdate!");
                setShowEditModalAngkatan(false);
                setSelectedEditAngkatan(null);
                fetchAllData();
            } else {
                toast.error(data.message || "Gagal mengupdate angkatan.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleDeleteAngkatan = async (angkatanId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus angkatan ini?")) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/academic-batches/${angkatanId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    toast.success("Angkatan berhasil dihapus!");
                    if (selectedAngkatan?.id === angkatanId) {
                        setCurrentView('angkatan');
                        setSelectedAngkatan(null);
                    }
                    fetchAllData();
                } else {
                    toast.error(data.message || "Gagal menghapus angkatan.");
                }
            } catch (error) {
                toast.error("Terjadi kesalahan koneksi.");
            }
        }
    };

    const handleEditJurusan = (jurusan) => {
        setSelectedEditJurusan(jurusan);
        setEditNamaJurusan(jurusan.nama_jurusan);
        setEditSingkatanJurusan(jurusan.singkatan);
        setShowEditModalJurusan(true);
    };

    const handleDeleteJurusan = async (jurusanId, namaJurusan) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus jurusan "${namaJurusan}"? Data siswa terkait juga akan terhapus!`)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/classrooms/${jurusanId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success(data.message || "Jurusan berhasil dihapus dari database!");
                    // Panggil ulang fetchAllData agar daftar kelas langsung diperbarui dari server
                    fetchAllData();
                } else {
                    toast.error(data.message || "Gagal menghapus jurusan.");
                }
            } catch (error) {
                console.error("Terjadi kesalahan koneksi", error);
                toast.error("Terjadi kesalahan koneksi ke server.");
            }
        }
    };
    const handleEditSiswa = (siswa) => {
        setSelectedEditSiswa(siswa);
        setEditNamaSiswa(siswa.nama);
        setEditNisn(siswa.nisn);
        setSelectedEditJurusan(dataJurusan.find(j => j.id === siswa.jurusan_id) || null);
        setEditStatusSiswa(siswa.status === 'Nonaktif' ? (siswa.status_keterangan || 'Nonaktif') : 'Aktif');
        setEditStatusKeteranganSiswa(siswa.status_keterangan || '');
        setShowEditModalSiswa(true);
    };

    const handleUpdateSiswa = async (e) => {
        e.preventDefault();
        if (!editNamaSiswa || !editNisn) {
            toast.error("Nama dan NISN wajib diisi!");
            return;
        }

        setIsLoadingEdit(true);
        try {
            const token = localStorage.getItem('token');
            let finalStatus = 'Aktif';
            let finalKeterangan = null;

            if (editStatusSiswa === 'Aktif') {
                finalStatus = 'Aktif';
                finalKeterangan = null;
            } else if (editStatusSiswa === 'Lulus') {
                finalStatus = 'Nonaktif';
                finalKeterangan = 'Lulus';
            } else if (editStatusSiswa === 'Drop Out') {
                finalStatus = 'Nonaktif';
                finalKeterangan = 'Drop Out';
            } else {
                finalStatus = 'Nonaktif';
                finalKeterangan = editStatusKeteranganSiswa || 'Nonaktif';
            }

            const response = await fetch(`${API_URL}/students/${selectedEditSiswa.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: editNamaSiswa,
                    nisn: editNisn,
                    classroom_id: selectedJurusan.id,
                    status: finalStatus,
                    status_keterangan: finalKeterangan
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Data Siswa berhasil diupdate!");
                setShowEditModalSiswa(false);
                setSelectedEditSiswa(null);
                await fetchAllData();
            } else {
                toast.error(data.message || "Gagal mengupdate data siswa.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleHapusSiswa = async (siswaId, namaSiswa) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus siswa "${namaSiswa}"?`)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/students/${siswaId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    toast.success(data.message || "Data Siswa berhasil dihapus!");
                    fetchAllData();
                } else {
                    toast.error(data.message || "Gagal menghapus data siswa.");
                }
            } catch (error) {
                toast.error("Terjadi kesalahan koneksi ke server.");
            }
        }
    };

    const handleUpdateJurusan = async (e) => {
        e.preventDefault();
        if (!editNamaJurusan || !editSingkatanJurusan) {
            toast.error("Nama dan Singkatan Jurusan wajib diisi!");
            return;
        }

        setIsLoadingEdit(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/classrooms/${selectedEditJurusan.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: editNamaJurusan,
                    singkatan: editSingkatanJurusan,
                    grade: '10',
                    academic_batch_id: selectedEditJurusan?.angkatan_id || 1
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Data Jurusan berhasil diupdate!");
                setShowEditModalJurusan(false);
                setSelectedEditJurusan(null);
                fetchAllData();
            } else {
                toast.error(data.message || "Gagal mengupdate jurusan.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleEditAbsensi = (absensi) => {
        setSelectedEditAbsensi(absensi);
        setEditAbsensiTanggal(absensi.tanggal);
        setEditAbsensiStatus(absensi.status);
        setShowEditAbsensiModal(true);
    };

    const handleUpdateAbsensi = async (e) => {
        e.preventDefault();
        if (!editAbsensiTanggal) return toast.error("Tanggal Absensi wajib diisi!");

        setIsLoadingEdit(true);
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
                    status: editAbsensiStatus
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Data Absensi berhasil diupdate!");
                setShowEditAbsensiModal(false);
                setSelectedEditAbsensi(null);
                await fetchAllData();
                if (selectedSiswa) fetchAbsensiSiswa(selectedSiswa.id);
            } else {
                toast.error(data.message || "Gagal mengupdate absensi.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                const studentsPayload = data.map(item => ({
                    nisn: String(item.NISN || item.nisn || ''),
                    name: item.Nama || item.nama || 'Tanpa Nama',
                    classroom_id: selectedJurusan.id
                }));

                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/students/bulk`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ students: studentsPayload })
                });

                const resData = await response.json();
                if (response.ok) {
                    toast.success(resData.message || `Berhasil mengimpor ${studentsPayload.length} data siswa!`);
                    fetchAllData();
                } else {
                    toast.error(resData.message || "Gagal mengimpor siswa.");
                }
            } catch (error) {
                toast.error("Gagal membaca file Excel. Pastikan format file benar!");
            }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const getRekapAbsensiSiswa = (siswaId) => {
        const siswa = dataSiswa.find(s => s.id === siswaId);
        if (siswa && (siswa.hadir_count !== undefined || siswa.sakit_count !== undefined)) {
            return {
                hadir: Number(siswa.hadir_count || 0),
                sakit: Number(siswa.sakit_count || 0),
                izin: Number(siswa.izin_count || 0),
                alfa: Number(siswa.alfa_count || 0)
            };
        }
        const absensiSiswa = dataAbsensi.filter(a => Number(a.siswa_id || a.student_id) === Number(siswaId));
        return {
            hadir: absensiSiswa.filter(a => a.status === 'Hadir').length,
            sakit: absensiSiswa.filter(a => a.status === 'Sakit').length,
            izin: absensiSiswa.filter(a => a.status === 'Izin').length,
            alfa: absensiSiswa.filter(a => a.status === 'Alpa' || a.status === 'Alfa').length
        };
    };

    const handleCetakDataSiswaJurusan = () => {
        if (!selectedJurusan) return;
        const siswaList = filteredData;

        const angkatanObj = dataAngkatan.find(a => String(a.id) === String(selectedJurusan.angkatan_id));
        const angkatanLabel = angkatanObj ? (angkatanObj.name || `Angkatan ${angkatanObj.year}`) : '-';

        const printDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        let htmlContent = `
        <html>
            <head>
                <title>Laporan Data Siswa - ${selectedJurusan.nama_jurusan}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; box-shadow: none !important; }
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        padding: 12mm 14mm; 
                        color: #000; 
                        background-color: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header { 
                        text-align: center; 
                        margin: 0 auto 20px auto; 
                    }
                    .header-top { 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        border-bottom: 3px double #000; 
                        padding-bottom: 14px; 
                        margin-bottom: 14px; 
                        gap: 20px; 
                    }
                    .header-logo { width: 75px; height: auto; }
                    .header-text { text-align: center; }
                    .header .school-name { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 2px 0; }
                    .header .school-address { font-size: 11px; color: #333; margin: 0 0 10px 0; }
                    .header .report-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 10px 0 6px 0; }
                    .header .filter-info { font-size: 12px; color: #333; margin: 0; line-height: 1.6; }
                    .header .filter-info span { display: inline-block; margin: 0 6px; }
                    .header .filter-info strong { font-weight: 700; }
                    .header .print-date { font-size: 11px; color: #555; margin: 6px 0 0 0; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    th, td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; text-align: center; color: #000; }
                    th { background-color: #e8e8e8; font-weight: 700; padding: 6px 8px; }
                    td:nth-child(3) { text-align: left; }
                    @page { size: A4 portrait; margin: 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-top">
                        <img src="/IMG_03611.png" alt="Logo SMK NU Donomulyo" class="header-logo" />
                        <div class="header-text">
                            <div class="school-name">SMK Nahdlatul Ulama Donomulyo</div>
                            <div class="school-address">Jl. Raya Dawung, Tempursari Selatan, Tempursari, Kec. Donomulyo, Kab. Malang, Jawa Timur</div>
                        </div>
                    </div>
                    <div class="report-title">Laporan Data Siswa &amp; Rekap Absensi</div>
                    <div class="filter-info">
                        <span>Angkatan: <strong>${angkatanLabel}</strong></span> |
                        <span>Jurusan: <strong>${selectedJurusan.nama_jurusan} (${selectedJurusan.singkatan})</strong></span>
                    </div>
                    <div class="print-date">Dicetak pada: ${printDate}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>No</th><th>NISN</th><th>Nama Siswa</th><th>Kelas</th><th>Status</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alfa</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

        siswaList.forEach((s, index) => {
            const rekap = getRekapAbsensiSiswa(s.id);
            htmlContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${s.nisn}</td>
                <td style="text-align:left">${s.nama}</td>
                <td>${s.kelas}</td>
                <td>${s.status}</td>
                <td><b>${rekap.hadir}</b></td>
                <td><b>${rekap.sakit}</b></td>
                <td><b>${rekap.izin}</b></td>
                <td><b>${rekap.alfa}</b></td>
            </tr>`;
        });

        htmlContent += `</tbody></table></body></html>`;
        
        const iframe = document.createElement('iframe');
        // Gunakan posisi absolute dan ukuran 100% agar tabel bisa mengambil lebar penuh halaman
        iframe.style.position = 'absolute';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.top = '-9999px';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    };

    const handleCetakAbsensiSiswa = () => {
        if (!selectedSiswa) return;
        const absensiList = absensiDitampilkan;
        const jurusanObj = dataJurusan.find(j => Number(j.id) === Number(selectedSiswa.jurusan_id));
        const jurusanLabel = jurusanObj ? `${jurusanObj.nama_jurusan} (${jurusanObj.singkatan})` : selectedSiswa.kelas;

        const printDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        let htmlContent = `
        <html>
            <head>
                <title>Laporan Absensi - ${selectedSiswa.nama}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; box-shadow: none !important; }
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        padding: 12mm 14mm; 
                        color: #000; 
                        background-color: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header { 
                        text-align: center; 
                        margin: 0 auto 20px auto; 
                    }
                    .header-top { 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        border-bottom: 3px double #000; 
                        padding-bottom: 14px; 
                        margin-bottom: 14px; 
                        gap: 20px; 
                    }
                    .header-logo { width: 75px; height: auto; }
                    .header-text { text-align: center; }
                    .header .school-name { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 2px 0; }
                    .header .school-address { font-size: 11px; color: #333; margin: 0 0 10px 0; }
                    .header .report-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 10px 0 6px 0; }
                    .header .filter-info { font-size: 12px; color: #333; margin: 0; line-height: 1.6; }
                    .header .filter-info span { display: inline-block; margin: 0 6px; }
                    .header .filter-info strong { font-weight: 700; }
                    .header .print-date { font-size: 11px; color: #555; margin: 6px 0 0 0; font-style: italic; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    th, td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; text-align: center; color: #000; }
                    th { background-color: #e8e8e8; font-weight: 700; padding: 6px 8px; }
                    @page { size: A4 portrait; margin: 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-top">
                        <img src="/IMG_03611.png" alt="Logo SMK NU Donomulyo" class="header-logo" />
                        <div class="header-text">
                            <div class="school-name">SMK Nahdlatul Ulama Donomulyo</div>
                            <div class="school-address">Jl. Raya Dawung, Tempursari Selatan, Tempursari, Kec. Donomulyo, Kab. Malang, Jawa Timur</div>
                        </div>
                    </div>
                    <div class="report-title">Laporan Riwayat Absensi Siswa</div>
                    <div class="filter-info">
                        <span>Nama: <strong>${selectedSiswa.nama}</strong></span> |
                        <span>NISN: <strong>${selectedSiswa.nisn}</strong></span> |
                        <span>Kelas: <strong>${jurusanLabel}</strong></span><br/>
                        <span>Periode Bulan: <strong>${selectedBulan}</strong></span>
                    </div>
                    <div class="print-date">Dicetak pada: ${printDate}</div>
                </div>
                <table>
                    <thead>
                        <tr><th>No</th><th>Tanggal</th><th>Status Kehadiran</th><th>Keterangan</th></tr>
                    </thead>
                    <tbody>`;

        absensiList.forEach((abs, index) => {
            htmlContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${abs.tanggal}</td>
                <td>${abs.status}</td>
                <td>${abs.notes || abs.keterangan || '-'}</td>
            </tr>`;
        });

        htmlContent += `</tbody></table></body></html>`;

        const iframe = document.createElement('iframe');
        // Gunakan posisi absolute dan ukuran 100% agar tabel bisa mengambil lebar penuh halaman
        iframe.style.position = 'absolute';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.top = '-9999px';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    };

    const getMapelFiltered = () => {
        if (!selectedJurusan) return dataMapel;
        return dataMapel.filter(mapel => {
            if (mapel.classrooms && mapel.classrooms.length > 0) {
                return mapel.classrooms.some(c => Number(c.id) === Number(selectedJurusan.id));
            }
            return true;
        });
    };

    const mapelTampil = getMapelFiltered();

    const handleSimpanMapel = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                kode_mapel: inputKodeMapel,
                nama_mapel: inputNamaMapel
            };

            // Otomatis hubungkan ke jurusan/kelas saat ini jika ada
            if (selectedJurusan) {
                payload.classroom_id = selectedJurusan.id;
            }

            const response = await fetch(`${API_URL}/subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || "Mata pelajaran berhasil ditambahkan!");
                setShowModalMapel(false);
                setInputKodeMapel('');
                setInputNamaMapel('');
                fetchAllData();
            } else {
                toast.error(data.message || "Gagal menambah mapel.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi.");
        }
    };

    const getFilteredData = () => {
        if (currentView === 'angkatan') {
            return dataAngkatan.filter(a => (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (currentView === 'jurusan') {
            return dataJurusan.filter(j =>
                Number(j.angkatan_id) === Number(selectedAngkatan?.id) &&
                (j.nama_jurusan || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (currentView === 'siswa') {
            return dataSiswa.filter(s =>
                Number(s.jurusan_id) === Number(selectedJurusan?.id) &&
                ((s.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(s.nisn || '').includes(searchTerm))
            );
        }
        return [];
    };

    const getAbsensiSiswaBulanIni = () => {
        if (!selectedSiswa) return [];
        return dataAbsensi.filter(abs => {
            const isSiswaSama = abs.siswa_id === selectedSiswa.id;
            const isBulanSama = abs.tanggal.startsWith(selectedBulan);
            return isSiswaSama && isBulanSama;
        }).sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    };

    const filteredData = getFilteredData();
    const absensiDitampilkan = getAbsensiSiswaBulanIni();

    return (
        <div className="data-kelas-container">
            {/* --- BREADCRUMB --- */}
            <div className="breadcrumb">
                <span className={currentView !== 'angkatan' ? 'clickable' : 'active'} onClick={() => { setCurrentView('angkatan'); setSelectedAngkatan(null); setSelectedJurusan(null); setSelectedSiswa(null); }}>
                    Data Angkatan
                </span>

                {selectedAngkatan && (
                    <>
                        <FiChevronRight className="breadcrumb-icon" />
                        <span className={currentView !== 'jurusan' ? 'clickable' : 'active'} onClick={() => { setCurrentView('jurusan'); setSelectedJurusan(null); setSelectedSiswa(null); }}>
                            {selectedAngkatan.name}
                        </span>
                    </>
                )}

                {selectedJurusan && (
                    <>
                        <FiChevronRight className="breadcrumb-icon" />
                        <span className={currentView !== 'siswa' ? 'clickable' : 'active'} onClick={() => { setCurrentView('siswa'); setSelectedSiswa(null); }}>
                            {selectedJurusan.singkatan}
                        </span>
                    </>
                )}

                {selectedSiswa && (
                    <>
                        <FiChevronRight className="breadcrumb-icon" />
                        <span className="active">{selectedSiswa.nama}</span>
                    </>
                )}
            </div>

            {/* --- HEADER --- */}
            <div className="page-header">
                <div className="header-left">
                    {currentView !== 'angkatan' && (
                        <button className="btn-back" onClick={handleKembali}>
                            <FiArrowLeft /> Kembali
                        </button>
                    )}
                    <h2>
                        {currentView === 'angkatan' && 'Daftar Angkatan'}
                        {currentView === 'jurusan' && `Jurusan - ${selectedAngkatan?.name}`}
                        {currentView === 'siswa' && `Data Siswa & Absensi Mapel - ${selectedJurusan?.nama_jurusan}`}
                        {currentView === 'detail_siswa' && `Detail & Absensi Siswa`}
                    </h2>
                </div>
            </div>

            {/* AREA KONTEN */}
            <div className="content-area">

                {/* 1. TAMPILAN ANGKATAN & JURUSAN */}
                {(currentView === 'angkatan' || currentView === 'jurusan') && (
                    <>
                        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="search-box">
                                <FiSearch className="search-icon" />
                                <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            {(userRole === 'admin' || (userRole === 'wali_kelas' && currentView === 'jurusan')) && (
                                <button className="btn-add" onClick={() => currentView === 'angkatan' ? setShowModalAngkatan(true) : setShowModalJurusan(true)}>
                                    <FiPlus className="icon-left" /> Tambah Data
                                </button>
                            )}
                        </div>

                        <div className="card-grid">
                            {filteredData.map((item) => (
                                <div key={item.id} className="folder-card" onClick={() => currentView === 'angkatan' ? handleMasukJurusan(item) : handleMasukSiswa(item)}>
                                    <div className="folder-icon-wrapper">
                                        {currentView === 'angkatan' ? <FiFolder /> : <FiUsers />}
                                    </div>
                                    <div className="folder-info">
                                        {/* Jika sedang di view jurusan, tampilkan singkatan sebagai judul utama atau tampilkan keduanya dengan rapi */}
                                        <h3>{currentView === 'angkatan' ? item.name : item.nama_jurusan}</h3>
                                        <p>{currentView === 'angkatan' ? `Tahun: ${item.year}` : `Singkatan: ${item.singkatan || '-'}`}</p>
                                    </div>
                                    {(userRole === 'admin' || (userRole === 'wali_kelas' && currentView === 'jurusan')) && (
                                        <div className="folder-actions" style={{ display: 'flex', gap: '8px', zIndex: 2 }}>
                                            <button
                                                className="btn-action btn-edit"
                                                title="Edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (currentView === 'angkatan') handleEditAngkatan(item);
                                                    else handleEditJurusan(item);
                                                }}
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                title="Hapus"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (currentView === 'angkatan') handleDeleteAngkatan(item.id);
                                                    else handleDeleteJurusan(item.id, item.nama_jurusan); // <--- Kirim parameter nama jurusan
                                                }}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* 2. TAMPILAN SISWA & ABSENSI MAPEL */}
                {currentView === 'siswa' && (
                    <>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                            <div style={{ minWidth: '200px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Tanggal Absen</label>
                                <input
                                    type="date"
                                    className="modern-input"
                                    value={inputTanggal}
                                    onChange={(e) => setInputTanggal(e.target.value)}
                                />
                            </div>
                        </div>

                        {(userRole === 'admin' || Number(userClassroomId) === Number(selectedJurusan?.id)) && (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div className="search-box">
                                    <FiSearch className="search-icon" />
                                    <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div>
                                    <input type="file" id="excel-upload" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                                    <label htmlFor="excel-upload" className="btn-import" style={{ cursor: 'pointer' }}>
                                        Import Excel
                                    </label>
                                </div>
                                <button className="btn-add" onClick={handleCetakDataSiswaJurusan}>
                                    Cetak Data Siswa
                                </button>
                                <button className="btn-add" onClick={() => setShowModalSiswa(true)}>
                                    <FiPlus className="icon-left" /> Tambah Siswa
                                </button>
                                <button className="btn-add" onClick={() => setShowModalBulkStatus(true)} style={{ background: 'linear-gradient(135deg, var(--warning-color), #d97706)' }}>
                                    <FiEdit2 className="icon-left" /> Status Massal
                                </button>
                            </div>
                        )}

                        <div className="table-container">
                            <table className="kelas-table">
                                <thead>
                                    <tr>
                                        <th>No</th><th>NISN</th><th>Nama Siswa</th><th>Kelas</th><th>Status Kehadiran</th><th>Rekap (H/S/I/A)</th><th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>Belum ada data siswa di kelas ini.</td></tr>
                                    ) : (
                                        filteredData.map((item, index) => {
                                            const rekap = getRekapAbsensiSiswa(item.id);
                                            return (
                                                <tr key={item.id}>
                                                    <td>{index + 1}</td>
                                                    <td className="fw-bold" style={{ cursor: 'pointer' }} onClick={() => handleMasukDetailSiswa(item)}>{item.nisn}</td>
                                                    <td style={{ cursor: 'pointer' }} onClick={() => handleMasukDetailSiswa(item)}>
                                                        {item.nama}
                                                        {item.status === 'Nonaktif' && (
                                                            <span style={{
                                                                marginLeft: '8px',
                                                                fontSize: '11px',
                                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                color: 'var(--danger-color)',
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {item.status_keterangan || 'Nonaktif'}
                                                            </span>
                                                        )}
                                                     </td>
                                                    <td>{item.kelas}</td>
                                                    <td>
                                                        {item.status === 'Nonaktif' ? (
                                                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>
                                                                Nonaktif ({item.status_keterangan || 'Nonaktif'})
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <select
                                                                    className="modern-input"
                                                                    style={{ padding: '6px 12px', width: '140px', marginBottom: '6px' }}
                                                                    value={absensiMassal[item.id] || 'Hadir'}
                                                                    onChange={(e) => setAbsensiMassal({ ...absensiMassal, [item.id]: e.target.value })}
                                                                >
                                                                    <option value="Hadir">Hadir</option>
                                                                    <option value="Izin">Izin</option>
                                                                    <option value="Sakit">Sakit</option>
                                                                    <option value="Alfa">Alfa</option>
                                                                </select>
                                                                <input 
                                                                    type="text" 
                                                                    className="modern-input" 
                                                                    placeholder="Keterangan (Opsional)" 
                                                                    value={absensiKeteranganMassal[item.id] || ''} 
                                                                    onChange={(e) => setAbsensiKeteranganMassal({ ...absensiKeteranganMassal, [item.id]: e.target.value })} 
                                                                    style={{ padding: '6px 12px', width: '140px', fontSize: '12px' }} 
                                                                />
                                                            </>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{rekap.hadir}</span> /{' '}
                                                        <span style={{ color: 'var(--warning-color)', fontWeight: 'bold' }}>{rekap.sakit}</span> /{' '}
                                                        <span style={{ color: 'var(--info-color)', fontWeight: 'bold' }}>{rekap.izin}</span> /{' '}
                                                        <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{rekap.alfa}</span>
                                                    </td>
                                                    <td>
                                                        {(userRole === 'admin' || Number(userClassroomId) === Number(selectedJurusan?.id)) ? (
                                                            <div className="folder-actions" style={{ display: 'flex', gap: '8px' }}>
                                                                <button className="btn-action btn-edit" title="Edit Siswa" onClick={() => handleEditSiswa(item)}><FiEdit2 /></button>
                                                                <button className="btn-action btn-delete" title="Hapus Siswa" onClick={() => handleHapusSiswa(item.id, item.nama)}><FiTrash2 /></button>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Hanya Absensi</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button
                                className="btn-add"
                                style={{ padding: '12px 24px', fontSize: '15px' }}
                                onClick={handleSimpanAbsensiMassal}
                            >
                                <FiSave style={{ marginRight: '8px' }} /> Simpan Absensi Harian
                            </button>
                        </div>
                    </>
                )}

                {/* 3. TAMPILAN DETAIL SISWA & ABSENSI */}
                {currentView === 'detail_siswa' && selectedSiswa && (
                    <div className="detail-siswa-container">
                        <div className="rekap-header">
                            <h4>Riwayat Absensi - {selectedSiswa.nama}</h4>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input type="month" value={selectedBulan} onChange={(e) => setSelectedBulan(e.target.value)} />
                                <button className="btn-add" onClick={handleCetakAbsensiSiswa} style={{ padding: '8px 16px', fontSize: '13px' }}>
                                    Cetak Absensi
                                </button>
                            </div>
                        </div>

                        <div className="profil-card">
                            <div className="profil-avatar">
                                <FiUsers size={40} />
                            </div>
                            <div className="profil-info">
                                <h3>{selectedSiswa.nama}</h3>
                                <p><strong>NISN:</strong> {selectedSiswa.nisn}</p>
                                <p><strong>Kelas:</strong> {selectedSiswa.kelas}</p>
                                <p>
                                    <strong>Status:</strong>
                                    <span className={`badge-siswa status-${(selectedSiswa.status || 'Aktif').replace(/\s+/g, '-').toLowerCase()}`} style={{ marginLeft: '6px' }}>
                                        {selectedSiswa.status === 'Aktif' ? 'Aktif' : `Nonaktif ${selectedSiswa.status_keterangan ? `(${selectedSiswa.status_keterangan})` : ''}`}
                                    </span>
                                </p>

                                {(userRole === 'admin' || Number(userClassroomId) === Number(selectedJurusan?.id)) && (
                                    <div className="profil-status-control" style={{ marginTop: '12px' }}>
                                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Ubah Status Akademik Siswa:</label>
                                        <select
                                            className="modern-input"
                                            style={{ padding: '6px 12px', width: '220px' }}
                                            value={selectedSiswa.status === 'Aktif' ? 'Aktif' : (selectedSiswa.status_keterangan || 'Nonaktif')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'Aktif') {
                                                    handleUbahStatusSiswa(selectedSiswa.id, 'Aktif', null);
                                                } else if (val === 'Lulus') {
                                                    handleUbahStatusSiswa(selectedSiswa.id, 'Nonaktif', 'Lulus');
                                                } else if (val === 'Drop Out') {
                                                    handleUbahStatusSiswa(selectedSiswa.id, 'Nonaktif', 'Drop Out');
                                                } else {
                                                    handleUbahStatusSiswa(selectedSiswa.id, 'Nonaktif', 'Nonaktif');
                                                }
                                            }}
                                        >
                                            <option value="Aktif">Aktif</option>
                                            <option value="Lulus">Nonaktif - Lulus</option>
                                            <option value="Drop Out">Nonaktif - Drop Out</option>
                                            <option value="Nonaktif">Nonaktif (Lainnya)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absensi-section">
                            <div className="absensi-input-box">
                                <h4>Input Absensi Manual</h4>
                                {selectedSiswa.status === 'Nonaktif' ? (
                                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-color)', fontSize: '14px', marginTop: '10px' }}>
                                        <strong>Siswa Nonaktif:</strong> Siswa ini berstatus Nonaktif {selectedSiswa.status_keterangan ? `(${selectedSiswa.status_keterangan})` : ''} sehingga tidak dapat di-absen.
                                    </div>
                                ) : (
                                    <form onSubmit={handleSimpanAbsensi} className="form-absensi">
                                        <div className="form-group">
                                            <label>Tanggal</label>
                                            <input type="date" value={inputTanggal} onChange={(e) => setInputTanggal(e.target.value)} required />
                                        </div>

                                        <div className="form-group">
                                            <label>Status Kehadiran</label>
                                            <select value={inputStatus} onChange={(e) => setInputStatus(e.target.value)}>
                                                <option value="Hadir">Hadir</option>
                                                <option value="Izin">Izin</option>
                                                <option value="Sakit">Sakit</option>
                                                <option value="Alfa">Alfa</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Keterangan (Opsional)</label>
                                            <input type="text" className="modern-input" placeholder="Contoh: Sakit tipes" value={inputKeterangan} onChange={(e) => setInputKeterangan(e.target.value)} />
                                        </div>
                                        <button type="submit" className="btn-save-absensi">
                                            <FiSave /> Simpan
                                        </button>
                                    </form>
                                )}
                            </div>

                            <div className="absensi-rekap-box">
                                <div className="rekap-header">
                                    <h4>Riwayat Absensi</h4>
                                    <div className="month-filter">
                                        <input type="month" value={selectedBulan} onChange={(e) => setSelectedBulan(e.target.value)} />
                                    </div>
                                </div>

                                <table className="kelas-table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th><th>Status</th><th>Petugas</th><th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {absensiDitampilkan.length === 0 ? (
                                            <tr><td colSpan="5" className="empty-row">Belum ada data absensi di bulan ini.</td></tr>
                                        ) : (
                                            absensiDitampilkan.map((abs) => {
                                                return (
                                                    <tr key={abs.id}>
                                                        <td>{abs.tanggal}</td>
                                                        <td>
                                                            <span className={`badge-status status-${abs.status.toLowerCase()}`}>
                                                                {abs.status}
                                                            </span>
                                                        </td>
                                                        <td>{abs.created_by_name || 'Admin / Guru'}</td>
                                                        <td className="actions-cell">
                                                            <button className="btn-edit" title="Edit Absensi" onClick={() => handleEditAbsensi(abs)}><FiEdit2 /></button>
                                                            <button className="btn-action btn-delete" title="Hapus Absensi" onClick={() => handleHapusAbsensi(abs.id)}><FiTrash2 /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL KELOLA MATA PELAJARAN --- */}
            {showModalMapel && (
                <div className="modal-overlay" onClick={() => setShowModalMapel(false)}>
                    <div className="modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Kelola Mata Pelajaran {selectedJurusan ? `- ${selectedJurusan.nama_jurusan}` : ''}</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowModalMapel(false)}><FiX /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Bagian 1: Assign mapel yang sudah ada ke jurusan ini */}
                            {selectedJurusan && (
                                <div style={{ marginBottom: '20px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                                        Pilih Mapel untuk Jurusan Ini:
                                    </p>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)' }}>
                                        {mapelTampil.length === 0 ? (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>Belum ada mapel. Tambahkan di bawah.</p>
                                        ) : (
                                            dataMapel.map(m => {
                                                const isAssigned = m.classrooms && m.classrooms.some(c => Number(c.id) === Number(selectedJurusan.id));
                                                return (
                                                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '14px', transition: 'background-color 0.2s', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isAssigned}
                                                            onChange={async () => {
                                                                const token = localStorage.getItem('token');
                                                                const currentIds = (m.classrooms || []).map(c => c.id);
                                                                let newIds;
                                                                if (isAssigned) {
                                                                    newIds = currentIds.filter(id => Number(id) !== Number(selectedJurusan.id));
                                                                } else {
                                                                    newIds = [...currentIds, selectedJurusan.id];
                                                                }
                                                                try {
                                                                    const res = await fetch(`${API_URL}/subjects/${m.id}/classrooms`, {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Bearer ${token}`,
                                                                            'Accept': 'application/json'
                                                                        },
                                                                        body: JSON.stringify({ classroom_ids: newIds })
                                                                    });
                                                                    if (res.ok) {
                                                                        toast.success(isAssigned ? `${m.nama_mapel} dihapus dari jurusan` : `${m.nama_mapel} ditambahkan ke jurusan`);
                                                                        fetchAllData();
                                                                    } else {
                                                                        toast.error('Gagal mengubah mapel jurusan');
                                                                    }
                                                                } catch {
                                                                    toast.error('Kesalahan koneksi');
                                                                }
                                                            }}
                                                            style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                                                        />
                                                        <span style={{ fontWeight: isAssigned ? '600' : '400', color: isAssigned ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                            {m.nama_mapel} <span style={{ color: 'var(--text-secondary)' }}>({m.kode_mapel})</span>
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bagian 2: Tambah mapel baru */}
                            <div style={{ borderTop: selectedJurusan ? '1px solid var(--border-color)' : 'none', paddingTop: selectedJurusan ? '16px' : '0' }}>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                                    Tambah Mapel Baru {selectedJurusan ? `(otomatis ditambah ke ${selectedJurusan.singkatan})` : ''}:
                                </p>
                                <form onSubmit={handleSimpanMapel} className="form-absensi">
                                    <div className="form-group">
                                        <label>Kode Mata Pelajaran</label>
                                        <input type="text" placeholder="Contoh: MAT-10" value={inputKodeMapel} onChange={(e) => setInputKodeMapel(e.target.value)} required className="modern-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Nama Mata Pelajaran</label>
                                        <input type="text" placeholder="Contoh: Matematika" value={inputNamaMapel} onChange={(e) => setInputNamaMapel(e.target.value)} required className="modern-input" />
                                    </div>
                                    <div className="modal-actions" style={{ marginTop: '12px' }}>
                                        <button type="button" className="btn-cancel" onClick={() => setShowModalMapel(false)}>Tutup</button>
                                        <button type="submit" className="btn-save-absensi" style={{ marginTop: 0 }}>Simpan Mapel Baru</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ANGKATAN */}
            {showModalAngkatan && (
                <div className="modal-overlay" onClick={() => setShowModalAngkatan(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Tambah Data Angkatan</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowModalAngkatan(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSimpanAngkatan} className="modal-body">
                            <div className="form-group">
                                <label>Nama Angkatan</label>
                                <input type="text" placeholder="Contoh: Angkatan 2026" value={inputNamaAngkatan} onChange={(e) => setInputNamaAngkatan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Tahun Ajaran</label>
                                <input type="text" placeholder="Contoh: 2026/2027" value={inputTahunAngkatan} onChange={(e) => setInputTahunAngkatan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModalAngkatan(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" style={{ marginTop: 0 }}>Simpan Angkatan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL JURUSAN */}
            {showModalJurusan && (
                <div className="modal-overlay" onClick={() => setShowModalJurusan(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Tambah Data Jurusan</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowModalJurusan(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSimpanJurusan} className="form-absensi modal-body">
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label>Angkatan Terpilih</label>
                                <input type="text" value={selectedAngkatan?.name || ''} disabled className="modern-input" style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed', color: 'var(--text-secondary)' }} />
                            </div>
                            <div className="form-group">
                                <label>Nama Jurusan</label>
                                <input type="text" placeholder="Contoh: Desain Komunikasi Visual" value={inputNamaJurusan} onChange={(e) => setInputNamaJurusan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Singkatan</label>
                                {/* Input Singkatan Jurusan terhubung ke state */}
                                <input type="text" placeholder="Contoh: DKV" value={inputSingkatanJurusan} onChange={(e) => setInputSingkatanJurusan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModalJurusan(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" style={{ marginTop: 0 }}>Simpan Jurusan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL SISWA */}
            {showModalSiswa && (
                <div className="modal-overlay" onClick={() => setShowModalSiswa(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Tambah Siswa - {selectedJurusan?.name}</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowModalSiswa(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSimpanSiswa} className="form-absensi modal-body">
                            <div className="form-group">
                                <label>Nama Siswa</label>
                                <input type="text" placeholder="Contoh: Budi Santoso" value={inputNamaSiswa} onChange={(e) => setInputNamaSiswa(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>NISN</label>
                                <input type="text" placeholder="Contoh: 1234567890" value={inputNisn} onChange={(e) => setInputNisn(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Jurusan / Kelas Terpilih</label>
                                <input
                                    type="text"
                                    value={selectedJurusan ? `${selectedJurusan.nama_jurusan}` : ''}
                                    disabled
                                    className="modern-input"
                                    style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModalSiswa(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" style={{ marginTop: 0 }}>Simpan Siswa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModalAngkatan && selectedEditAngkatan && (
                <div className="modal-overlay" onClick={() => setShowEditModalAngkatan(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Data Angkatan</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowEditModalAngkatan(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleUpdateAngkatan} className="modal-body">
                            <div className="form-group">
                                <label>Tahun</label>
                                <input type="text" value={editTahunAngkatan} onChange={(e) => setEditTahunAngkatan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Nama Angkatan</label>
                                <input type="text" value={editNamaAngkatan} onChange={(e) => setEditNamaAngkatan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowEditModalAngkatan(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" style={{ marginTop: 0 }} disabled={isLoadingEdit}>
                                    {isLoadingEdit ? <><FiLoader style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Menyimpan...</> : "Update Angkatan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModalJurusan && selectedEditJurusan && (
                <div className="modal-overlay" onClick={() => setShowEditModalJurusan(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Data Jurusan</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowEditModalJurusan(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleUpdateJurusan} className="modal-body">
                            <div className="form-group">
                                <label>Nama Jurusan</label>
                                <input type="text" value={editNamaJurusan} onChange={(e) => setEditNamaJurusan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Singkatan</label>
                                <input type="text" value={editSingkatanJurusan} onChange={(e) => setEditSingkatanJurusan(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowEditModalJurusan(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" style={{ marginTop: 0 }} disabled={isLoadingEdit}>
                                    {isLoadingEdit ? <><FiLoader style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Menyimpan...</> : "Update Jurusan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModalSiswa && selectedEditSiswa && (
                <div className="modal-overlay" onClick={() => setShowEditModalSiswa(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Data Siswa</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowEditModalSiswa(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleUpdateSiswa} className="modal-body">
                            <div className="form-group">
                                <label>Nama Siswa</label>
                                <input type="text" value={editNamaSiswa} onChange={(e) => setEditNamaSiswa(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>NISN</label>
                                <input type="text" value={editNisn} onChange={(e) => setEditNisn(e.target.value)} required className="modern-input" />
                            </div>
                            <div className="form-group">
                                <label>Status Akademik</label>
                                <select
                                    className="modern-input"
                                    value={editStatusSiswa}
                                    onChange={(e) => setEditStatusSiswa(e.target.value)}
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Lulus">Nonaktif - Lulus</option>
                                    <option value="Drop Out">Nonaktif - Drop Out</option>
                                    <option value="Nonaktif">Nonaktif (Lainnya)</option>
                                </select>
                            </div>
                            {editStatusSiswa === 'Nonaktif' && (
                                <div className="form-group">
                                    <label>Keterangan Nonaktif</label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Misal: Mutasi, Pindah Sekolah, dll"
                                        value={editStatusKeteranganSiswa}
                                        onChange={(e) => setEditStatusKeteranganSiswa(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowEditModalSiswa(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" disabled={isLoadingEdit}>
                                    {isLoadingEdit ? <><FiLoader style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Menyimpan...</> : "Update Siswa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditAbsensiModal && selectedEditAbsensi && (
                <div className="modal-overlay" onClick={() => setShowEditAbsensiModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Data Absensi</h3>
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
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowEditAbsensiModal(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" disabled={isLoadingEdit}>
                                    {isLoadingEdit ? <><FiLoader style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Menyimpan...</> : "Update Absensi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModalBulkStatus && (
                <div className="modal-overlay" onClick={() => setShowModalBulkStatus(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Update Status Massal</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowModalBulkStatus(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleBulkUpdateStatus} className="modal-body">
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                                Aksi ini akan mengubah status akademik seluruh siswa di <strong>{selectedJurusan?.nama_jurusan}</strong> secara bersamaan.
                            </p>
                            <div className="form-group">
                                <label>Status Akademik Baru</label>
                                <select
                                    className="modern-input"
                                    value={bulkStatusValue}
                                    onChange={(e) => setBulkStatusValue(e.target.value)}
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Lulus">Nonaktif - Lulus</option>
                                    <option value="Drop Out">Nonaktif - Drop Out</option>
                                    <option value="Nonaktif">Nonaktif (Lainnya)</option>
                                </select>
                            </div>
                            {bulkStatusValue === 'Nonaktif' && (
                                <div className="form-group">
                                    <label>Keterangan Nonaktif</label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Misal: Mutasi, Pindah Sekolah, dll"
                                        value={bulkStatusKeterangan}
                                        onChange={(e) => setBulkStatusKeterangan(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModalBulkStatus(false)}>Batal</button>
                                <button type="submit" className="btn-save-absensi" style={{ background: 'linear-gradient(135deg, var(--warning-color), #d97706)' }}>Update Massal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataKelas;