import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiLogOut, FiSettings, FiBox } from 'react-icons/fi';

import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        // Hapus token dan role dari localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        // Arahkan ke halaman login
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Absensi App</h2>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
                    <FiHome className="nav-icon" />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/inventaris-barang" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <FiBox className="nav-icon" />
                    <span>Inventaris Barang</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button className="btn-logout" onClick={handleLogout}>
                    <FiLogOut className="nav-icon" />
                    <span>Keluar</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
