import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiLogOut, FiSettings, FiBox, FiKey, FiFileText, FiMenu } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, closeSidebar }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role'); // Mengambil role yang sedang login

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleMenuClick = () => {
    if (closeSidebar) closeSidebar();
    else toggleSidebar();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar || toggleSidebar}></div>}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Absensi App</h2>
        <button className="sidebar-burger" onClick={toggleSidebar} title="Tutup Sidebar">
          <FiMenu />
        </button>
      </div>
      <nav className="sidebar-nav">
        {/* Dashboard bisa diakses semua role */}
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end onClick={handleMenuClick}>
          <FiHome className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        {/* Data Kelas & Absensi MUNCUL untuk Admin, Wali Kelas, Guru Mapel, dan Guru */}
        {(role === 'admin' || role === 'wali_kelas' || role === 'guru_mapel' || role === 'guru') && (
          <NavLink to="/DataKelas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleMenuClick}>
            <FiUsers className="nav-icon" />
            <span>Data Kelas & Absensi</span>
          </NavLink>
        )}

        {/* Manajemen Akun HANYA MUNCUL untuk Admin */}
        {role === 'admin' && (
          <NavLink to="/manajemen-akun" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleMenuClick}>
            <FiSettings className="nav-icon" />
            <span>Manajemen Akun</span>
          </NavLink>
        )}

        {/* Laporan HANYA MUNCUL untuk Admin */}
        {role === 'admin' && (
          <NavLink to="/laporan" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={handleMenuClick}>
            <FiFileText className="nav-icon" />
            <span>Laporan</span>
          </NavLink>
        )}

        {/* Link eksternal ke Web Storing Modul */}
        {(role === 'admin' || role === 'wali_kelas' || role === 'guru_mapel' || role === 'guru') && (
          <a href="https://storing-modul-main.vercel.app" target="_blank" rel="noopener noreferrer" className="nav-item">
            <FiFileText className="nav-icon" />
            <span>Arsip Modul (Web Baru)</span>
          </a>
        )}

        {/* Inventaris Barang MUNCUL untuk Admin dan Sarpras */}
        {role === 'sarpras' && (
          <NavLink to="/inventaris-barang" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleMenuClick}>
            <FiBox className="nav-icon" />
            <span>Inventaris Barang</span>
          </NavLink>
        )}
      </nav>

      <NavLink to="/ubah-password" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleMenuClick}>
        <FiKey className="nav-icon" />
        <span>Ubah Password</span>
      </NavLink>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <FiLogOut className="nav-icon" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;