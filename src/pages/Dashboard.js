import React, { useState, useEffect } from 'react';
import { FiUsers, FiCheckCircle, FiAlertCircle, FiClock, FiXCircle, FiCalendar, FiSearch, FiTrendingUp, FiActivity } from 'react-icons/fi';
import './Dashboard.css';
import { API_URL } from '../config';

const Dashboard = () => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Date().toLocaleDateString('id-ID', options);
  const today = new Date().toISOString().split('T')[0];

  // 1. LAZY LOADING STATE DARI LOCALSTORAGE AGAR TAMPIL 0ms (SANGAT CEPAT)
  const [classrooms, setClassrooms] = useState(() => JSON.parse(localStorage.getItem('cached_classrooms')) || []);
  const [students, setStudents] = useState(() => JSON.parse(localStorage.getItem('cached_students')) || []);
  const [attendances, setAttendances] = useState(() => JSON.parse(localStorage.getItem('cached_dashboard_atts')) || []);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. FETCH SEKUENSIAL DI BACKGROUND (lebih cepat di php artisan serve single-thread)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        };

        // Sekuensial: setiap response langsung di-set ke state (render progresif)
        const resClassrooms = await fetch(`${API_URL}/classrooms`, { headers });
        if (resClassrooms.ok) {
          const classData = await resClassrooms.json();
          setClassrooms(classData);
          localStorage.setItem('cached_classrooms', JSON.stringify(classData));
        }

        const resStudents = await fetch(`${API_URL}/students`, { headers });
        if (resStudents.ok) {
          const studData = await resStudents.json();
          setStudents(studData);
          localStorage.setItem('cached_students', JSON.stringify(studData));
        }

        const resAttendances = await fetch(`${API_URL}/attendance?tanggal=${today}`, { headers });
        if (resAttendances.ok) {
          const attData = await resAttendances.json();
          setAttendances(attData);
          localStorage.setItem('cached_dashboard_atts', JSON.stringify(attData));
        }
      } catch (error) {
        console.error("Gagal memperbarui data dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [today]);

  // Statistik Utama Hari Ini
  const totalSiswa = students.filter(s => s.status !== 'Nonaktif').length;
  const hadirHariIni = attendances.filter(a => a.status === 'Hadir').length;
  const sakitHariIni = attendances.filter(a => a.status === 'Sakit').length;
  const izinHariIni = attendances.filter(a => a.status === 'Izin').length;
  const alfaHariIni = attendances.filter(a => a.status === 'Alfa' || a.status === 'Alpa').length;

  // Rekap per Kelas
  const classroomStats = classrooms.map(cls => {
    const classAtts = attendances.filter(a => a.kelas_siswa === cls.name || a.kelas_siswa === cls.nama_jurusan);
    const classStudents = students.filter(s => String(s.classroom_id) === String(cls.id) && s.status !== 'Nonaktif');
    const totalClassStudents = classStudents.length || classAtts.length || 1;
    const hadir = classAtts.filter(a => a.status === 'Hadir').length;
    const sakit = classAtts.filter(a => a.status === 'Sakit').length;
    const izin = classAtts.filter(a => a.status === 'Izin').length;
    const alfa = classAtts.filter(a => a.status === 'Alfa' || a.status === 'Alpa').length;
    const persenHadir = Math.round((hadir / totalClassStudents) * 100);

    return {
      id: cls.id,
      name: cls.name || cls.nama_jurusan,
      singkatan: cls.singkatan || '',
      hadir,
      sakit,
      izin,
      alfa,
      totalStudents: totalClassStudents,
      persenHadir: isNaN(persenHadir) ? 0 : (persenHadir > 100 ? 100 : persenHadir)
    };
  });

  const filteredClassroomStats = classroomStats.filter(cls => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return cls.name.toLowerCase().includes(term) || cls.singkatan.toLowerCase().includes(term);
  });

  return (
    <div className="dashboard-container">

      {/* HERO BANNER GRADIENT ANIMATED */}
      <div className="dash-hero">
        <div>
          <h1 className="dash-hero-title">Selamat Datang di Panel Absensi 👋</h1>
          <p className="dash-hero-subtitle">
            Ringkasan & statistik kehadiran siswa secara real-time hari ini.
          </p>
        </div>
        <div className="dash-hero-badge">
          <FiCalendar /> {formattedDate} | <FiClock /> {currentTime}
        </div>
      </div>

      {/* KPI STAT CARDS INTERAKTIF */}
      <div className="dash-grid">
        {/* Total Siswa Aktif */}
        <div className="dash-card card-total">
          <div className="dash-card-header">
            <span className="dash-card-title">Total Siswa Aktif</span>
            <div className="dash-card-icon"><FiUsers /></div>
          </div>
          <h3 className="dash-card-val">{totalSiswa}</h3>
          <span className="dash-card-sub" style={{ color: '#4f46e5' }}>
            <FiActivity /> Terdaftar dalam sistem
          </span>
        </div>

        {/* Hadir */}
        <div className="dash-card card-hadir">
          <div className="dash-card-header">
            <span className="dash-card-title">Hadir Hari Ini</span>
            <div className="dash-card-icon"><FiCheckCircle /></div>
          </div>
          <h3 className="dash-card-val" style={{ color: '#059669' }}>{hadirHariIni}</h3>
          <span className="dash-card-sub" style={{ color: '#059669' }}>
            <FiTrendingUp /> Siswa masuk sekolah
          </span>
        </div>

        {/* Sakit */}
        <div className="dash-card card-sakit">
          <div className="dash-card-header">
            <span className="dash-card-title">Sakit Hari Ini</span>
            <div className="dash-card-icon"><FiAlertCircle /></div>
          </div>
          <h3 className="dash-card-val" style={{ color: '#d97706' }}>{sakitHariIni}</h3>
          <span className="dash-card-sub" style={{ color: '#d97706' }}>
            Berijin sakit
          </span>
        </div>

        {/* Izin */}
        <div className="dash-card card-izin">
          <div className="dash-card-header">
            <span className="dash-card-title">Izin Hari Ini</span>
            <div className="dash-card-icon"><FiClock /></div>
          </div>
          <h3 className="dash-card-val" style={{ color: '#2563eb' }}>{izinHariIni}</h3>
          <span className="dash-card-sub" style={{ color: '#2563eb' }}>
            Izin keperluan
          </span>
        </div>

        {/* Alfa */}
        <div className="dash-card card-alfa">
          <div className="dash-card-header">
            <span className="dash-card-title">Alfa Hari Ini</span>
            <div className="dash-card-icon"><FiXCircle /></div>
          </div>
          <h3 className="dash-card-val" style={{ color: '#e11d48' }}>{alfaHariIni}</h3>
          <span className="dash-card-sub" style={{ color: '#e11d48' }}>
            Tanpa keterangan
          </span>
        </div>
      </div>

      {/* TABLE REKAP PER KELAS */}
      <div className="dash-table-card">
        <div className="dash-table-header">
          <div>
            <h3 className="dash-table-title">Rekap Kehadiran Per Kelas</h3>
            <p className="dash-table-desc">
              Monitoring persentase dan rincian absensi di tiap kelas hari ini.
            </p>
          </div>
          <div className="search-box" style={{ width: '260px' }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="kelas-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px', textAlign: 'left' }}>
                <th style={{ padding: '14px 16px' }}>Kelas / Jurusan</th>
                <th style={{ padding: '14px 16px' }}>Persentase Kehadiran</th>
                <th style={{ padding: '14px 16px' }}>Hadir</th>
                <th style={{ padding: '14px 16px' }}>Sakit</th>
                <th style={{ padding: '14px 16px' }}>Izin</th>
                <th style={{ padding: '14px 16px' }}>Alfa</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && classroomStats.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Memuat data statistik...
                  </td>
                </tr>
              ) : filteredClassroomStats.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Tidak ada data kelas yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredClassroomStats.map(stat => (
                  <tr key={stat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#1e293b' }}>
                      {stat.name} {stat.singkatan && <span style={{ color: '#6366f1', fontSize: '12px', marginLeft: '6px' }}>({stat.singkatan})</span>}
                    </td>
                    <td style={{ padding: '16px', minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                        <span style={{ color: '#059669' }}>{stat.persenHadir}% Hadir</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${stat.persenHadir}%`,
                            background: stat.persenHadir >= 80 ? '#10b981' : (stat.persenHadir >= 50 ? '#f59e0b' : '#ef4444')
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge-pill" style={{ background: '#d1fae5', color: '#059669' }}>{stat.hadir}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge-pill" style={{ background: '#fef3c7', color: '#d97706' }}>{stat.sakit}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge-pill" style={{ background: '#dbeafe', color: '#2563eb' }}>{stat.izin}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge-pill" style={{ background: '#ffe4e6', color: '#e11d48' }}>{stat.alfa}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;