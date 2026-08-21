import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DataKelas from './pages/DataKelas';
import ManajemenAkun from './pages/ManajemenAkun';
import Login from './pages/Login';
import LoginStoring from './pages/LoginStoring';
import Register from './pages/Register';
import RegisterStoring from './pages/RegisterStoring';
import InventarisBarang from './pages/InventarisBarang';
import PrivateRoute from './components/PrivateRoute';
import UbahPassword from './pages/UbahPassword';
import Laporan from './pages/Laporan';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiMenu } from 'react-icons/fi';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/login-storing" element={<LoginStoring />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-storing" element={<RegisterStoring />} />

        {/* Rute yang diproteksi */}
        <Route element={<PrivateRoute />}>
          <Route path="/*" element={
            <div className="app-container">
              <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={closeSidebar} />
              <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
                {!isSidebarOpen && (
                  <button className="mobile-menu-btn" onClick={toggleSidebar} title="Buka Sidebar">
                    <FiMenu />
                  </button>
                )}
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/datakelas" element={<DataKelas />} />
                  <Route path="/manajemen-akun" element={<ManajemenAkun />} />
                  <Route path="/inventaris-barang" element={<InventarisBarang />} />
                  <Route path="/ubah-password" element={<UbahPassword />} />
                  <Route path="/laporan" element={<Laporan />} />
                </Routes>
              </main>
            </div>
          } />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;
